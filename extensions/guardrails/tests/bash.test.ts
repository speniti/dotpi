import { describe, it, expect, vi } from 'vitest';
import { BashGuard, defaultConfig } from '../src/guards/bash';
import type { BashConfig } from '../src/guards/bash';
import { createMockPi, createMockCtx } from './fixtures/mocks';

// ─── Mock bash-parser ───────────────────────────────────────────
// Tests mock parseBash to return parsed commands or null (parse failure).
// This avoids loading the WASM parser in the test environment.

vi.mock('../src/bash-parser', () => ({
    initBashParser: vi.fn().mockResolvedValue(undefined),
    parseBash: vi.fn(),
}));

vi.mock('../src/matchers', () => ({
    matchDangerous: vi.fn(),
}));

// Import after mock so they use the mocked versions
import { parseBash } from '../src/bash-parser';
import { matchDangerous } from '../src/matchers';

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Simulate tree-sitter parsing output for a command.
 * Returns the parsed commands that the structural matchers expect.
 */
function parsedCommands(name: string, args: string[] = []): NonNullable<ReturnType<typeof parseBash>> {
    return [{ name, args, redirects: [] }];
}

function setup(overrides: Partial<BashConfig> = {}) {
    const config: BashConfig = { ...defaultConfig, ...overrides };
    const mock = createMockPi();

    // Reset mocks before each test
    vi.mocked(parseBash as unknown as ReturnType<typeof vi.fn>).mockReset();
    vi.mocked(matchDangerous as unknown as ReturnType<typeof vi.fn>).mockReset();

    new BashGuard(config).register(mock.api);

    return mock;
}

// ─── Tests ──────────────────────────────────────────────────────

describe('BashGuard', () => {
    it('registers a tool_call handler', () => {
        const mock = setup();
        expect(mock.api.on).toHaveBeenCalledWith('tool_call', expect.any(Function));
    });

    it('ignores non-bash tool calls', async () => {
        const mock = setup();
        const result = await mock.emit('tool_call', {
            toolName: 'read',
            input: { path: '/some/file' },
        });

        expect(parseBash).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    it('passes through safe commands', async () => {
        const mock = setup();
        vi.mocked(parseBash).mockReturnValue(parsedCommands('ls', ['-la']));
        vi.mocked(matchDangerous).mockReturnValue(undefined);

        const result = await mock.emit('tool_call', {
            toolName: 'bash',
            input: { command: 'ls -la' },
        });

        expect(result).toBeUndefined();
    });

    it('blocks dangerous commands without UI', async () => {
        const mock = setup();
        vi.mocked(parseBash).mockReturnValue(parsedCommands('rm', ['-rf', '/tmp/test']));
        vi.mocked(matchDangerous).mockReturnValue({ description: 'recursive force delete', pattern: 'rm -rf' });

        const ctx = createMockCtx({ hasUI: false });
        const result = await mock.emit(
            'tool_call',
            { toolName: 'bash', input: { command: 'rm -rf /tmp/test' } },
            ctx,
        );

        expect(result).toEqual({ block: true, reason: expect.stringContaining('recursive force delete') });
    });

    it("prompts user and blocks on 'No'", async () => {
        const mock = setup();
        vi.mocked(parseBash).mockReturnValue(parsedCommands('sudo', ['apt', 'install', 'something']));
        vi.mocked(matchDangerous).mockReturnValue({ description: 'superuser command', pattern: 'sudo' });

        const ctx = createMockCtx({
            ui: {
                ...createMockCtx().ui,
                select: vi.fn().mockResolvedValue('No, block it'),
            },
        });

        const result = await mock.emit(
            'tool_call',
            { toolName: 'bash', input: { command: 'sudo apt install something' } },
            ctx,
        );

        expect(result).toEqual({ block: true, reason: 'Blocked by user' });
    });

    it("prompts user and allows on 'Yes'", async () => {
        const mock = setup();
        vi.mocked(parseBash).mockReturnValue(parsedCommands('sudo', ['apt', 'install', 'something']));
        vi.mocked(matchDangerous).mockReturnValue({ description: 'superuser command', pattern: 'sudo' });

        const ctx = createMockCtx({
            ui: {
                ...createMockCtx().ui,
                select: vi.fn().mockResolvedValue('Yes, run it'),
            },
        });

        const result = await mock.emit(
            'tool_call',
            { toolName: 'bash', input: { command: 'sudo apt install something' } },
            ctx,
        );

        expect(result).toBeUndefined();
    });

    it('passes through rm without dangerous flags', async () => {
        const mock = setup();
        vi.mocked(parseBash).mockReturnValue(parsedCommands('rm', ['/tmp/test-file.txt']));
        vi.mocked(matchDangerous).mockReturnValue(undefined);

        const ctx = createMockCtx({ hasUI: false });
        const result = await mock.emit(
            'tool_call',
            { toolName: 'bash', input: { command: 'rm /tmp/test-file.txt' } },
            ctx,
        );

        expect(result).toBeUndefined();
    });

    it("prompts user and blocks on 'Suggest changes'", async () => {
        const mock = setup();
        vi.mocked(parseBash).mockReturnValue(parsedCommands('rm', ['-rf', '/tmp/test']));
        vi.mocked(matchDangerous).mockReturnValue({ description: 'recursive force delete', pattern: 'rm -rf' });

        const mockInput = vi.fn().mockResolvedValue('use rm -f instead');
        const ctx = createMockCtx({
            ui: {
                ...createMockCtx().ui,
                select: vi.fn().mockResolvedValue('Suggest changes'),
                input: mockInput,
            },
        });

        const result = await mock.emit(
            'tool_call',
            { toolName: 'bash', input: { command: 'rm -rf /tmp/test' } },
            ctx,
        );

        expect(ctx.ui.select).toHaveBeenCalledWith(
            expect.stringContaining('Dangerous command'),
            ['Yes, run it', 'No, block it', 'Suggest changes'],
            expect.any(Object),
        );
        expect(mockInput).toHaveBeenCalledWith('Enter your suggestions for changes:');
        expect(ctx.ui.notify).toHaveBeenCalledWith('Suggestions noted: use rm -f instead');
        expect(result).toEqual({ block: true, reason: 'Command blocked - changes suggested by user' });
    });

    it('does not register when disabled', () => {
        const mock = setup({ enabled: false });
        expect(mock.api.on).not.toHaveBeenCalled();
    });

    // ─── Fail-closed tests ──────────────────────────────────────

    describe('fail-closed (parser returns null)', () => {
        it('blocks unparseable commands without UI', async () => {
            const mock = setup();
            vi.mocked(parseBash).mockReturnValue(null);

            const ctx = createMockCtx({ hasUI: false });
            const result = await mock.emit(
                'tool_call',
                { toolName: 'bash', input: { command: 'some weird command' } },
                ctx,
            );

            expect(result).toEqual({ block: true, reason: expect.stringContaining('unable to parse') });
        });

        it('prompts user for unparseable commands with UI and blocks on deny', async () => {
            const mock = setup();
            vi.mocked(parseBash).mockReturnValue(null);

            const ctx = createMockCtx({
                ui: {
                    ...createMockCtx().ui,
                    select: vi.fn().mockResolvedValue('No, block it'),
                },
            });

            const result = await mock.emit(
                'tool_call',
                { toolName: 'bash', input: { command: 'some weird command' } },
                ctx,
            );

            expect(ctx.ui.select).toHaveBeenCalledWith(
                expect.stringContaining('Unable to parse'),
                ['Yes, run it', 'No, block it'],
            );
            expect(result).toEqual({ block: true, reason: 'Blocked by user (unparseable command)' });
        });

        it('allows unparseable commands with UI when user confirms', async () => {
            const mock = setup();
            vi.mocked(parseBash).mockReturnValue(null);

            const ctx = createMockCtx({
                ui: {
                    ...createMockCtx().ui,
                    select: vi.fn().mockResolvedValue('Yes, run it'),
                },
            });

            const result = await mock.emit(
                'tool_call',
                { toolName: 'bash', input: { command: 'some weird command' } },
                ctx,
            );

            expect(result).toBeUndefined();
        });
    });

    // ─── Structural matching edge cases ─────────────────────────

    describe('structural matching', () => {
        it('does not match rm inside quoted strings', async () => {
            const mock = setup();
            // Parser correctly identifies "echo" as command, not "rm"
            vi.mocked(parseBash).mockReturnValue(parsedCommands('echo', ["'rm -rf /'"]));
            vi.mocked(matchDangerous).mockReturnValue(undefined);

            const result = await mock.emit('tool_call', {
                toolName: 'bash',
                input: { command: "echo 'rm -rf /'" },
            });

            expect(result).toBeUndefined();
        });

        it('matches sudo with sub-commands', async () => {
            const mock = setup();
            vi.mocked(parseBash).mockReturnValue(parsedCommands('sudo', ['chmod', '-R', '777', '/var']));
            vi.mocked(matchDangerous).mockReturnValue({ description: 'superuser command', pattern: 'sudo' });

            const ctx = createMockCtx({ hasUI: false });
            const result = await mock.emit(
                'tool_call',
                { toolName: 'bash', input: { command: 'sudo chmod -R 777 /var' } },
                ctx,
            );

            expect(result).toEqual({ block: true, reason: expect.any(String) });
        });

        it('handles multiple commands (pipeline)', async () => {
            const mock = setup();
            // Pipeline: cat .env | grep SECRET
            vi.mocked(parseBash).mockReturnValue([
                { name: 'cat', args: ['.env'], redirects: [] },
                { name: 'grep', args: ['SECRET'], redirects: [] },
            ]);
            vi.mocked(matchDangerous).mockReturnValue(undefined);

            const result = await mock.emit('tool_call', {
                toolName: 'bash',
                input: { command: 'cat .env | grep SECRET' },
            });

            expect(result).toBeUndefined();
            expect(matchDangerous).toHaveBeenCalledTimes(2);
        });

        it('detects danger in second command of a pipeline', async () => {
            const mock = setup();
            vi.mocked(parseBash).mockReturnValue([
                { name: 'cat', args: ['.env'], redirects: [] },
                { name: 'sudo', args: ['rm', '-rf', '/'], redirects: [] },
            ]);
            vi.mocked(matchDangerous)
                .mockReturnValueOnce(undefined)
                .mockReturnValueOnce({ description: 'superuser command', pattern: 'sudo' });

            const ctx = createMockCtx({ hasUI: false });
            const result = await mock.emit(
                'tool_call',
                { toolName: 'bash', input: { command: 'cat .env | sudo rm -rf /' } },
                ctx,
            );

            expect(result).toEqual({ block: true, reason: expect.any(String) });
        });
    });
});

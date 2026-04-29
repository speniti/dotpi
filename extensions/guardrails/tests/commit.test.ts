import { describe, it, expect, vi } from 'vitest';
import { CommitGuard, defaultConfig } from '../src/guards/commit';
import type { CommitConfig } from '../src/guards/commit';
import { createMockPi, createMockCtx } from './fixtures/mocks';

describe('CommitGuard', () => {
    function setup(overrides: Partial<CommitConfig> = {}) {
        const config: CommitConfig = { ...defaultConfig, ...overrides };
        const mock = createMockPi();

        new CommitGuard(config).register(mock.api);

        return mock;
    }

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

        expect(result).toBeUndefined();
    });

    it('passes through non-commit git commands', async () => {
        const mock = setup();
        const result = await mock.emit('tool_call', {
            toolName: 'bash',
            input: { command: 'git status' },
        });

        expect(result).toBeUndefined();
    });

    it('blocks commit commands without UI', async () => {
        const mock = setup();
        const ctx = createMockCtx({ hasUI: false });

        const result = await mock.emit(
            'tool_call',
            {
                toolName: 'bash',
                input: { command: 'git commit -m "test commit"' },
            },
            ctx,
        );

        expect(result).toEqual({ block: true, reason: expect.any(String) });
    });

    it("prompts user and blocks on 'No'", async () => {
        const mock = setup();

        const ctx = createMockCtx({
            ui: {
                ...createMockCtx().ui,
                select: vi.fn().mockResolvedValue('No, cancel commit'),
            },
        });

        const result = await mock.emit(
            'tool_call',
            {
                toolName: 'bash',
                input: { command: 'git commit -m "test commit"' },
            },
            ctx,
        );

        expect(result).toEqual({ block: true, reason: 'Commit cancelled by user' });
    });

    it("prompts user and suggests changes on 'Suggest changes'", async () => {
        const mock = setup();

        const ctx = createMockCtx({
            ui: {
                ...createMockCtx().ui,
                select: vi.fn().mockResolvedValue('Suggest changes'),
                input: vi.fn().mockResolvedValue('Add more tests'),
            },
        });

        const result = await mock.emit(
            'tool_call',
            {
                toolName: 'bash',
                input: { command: 'git commit -m "test commit"' },
            },
            ctx,
        );

        expect(result).toEqual({ block: true, reason: 'Commit cancelled - changes suggested by user' });
        expect(ctx.ui.input).toHaveBeenCalledWith('Enter your suggestions for changes:');
        expect(ctx.ui.notify).toHaveBeenCalledWith('Suggestions noted: Add more tests');
    });

    it("prompts user and suggests changes with empty input", async () => {
        const mock = setup();

        const ctx = createMockCtx({
            ui: {
                ...createMockCtx().ui,
                select: vi.fn().mockResolvedValue('Suggest changes'),
                input: vi.fn().mockResolvedValue(''),
            },
        });

        const result = await mock.emit(
            'tool_call',
            {
                toolName: 'bash',
                input: { command: 'git commit -m "test commit"' },
            },
            ctx,
        );

        expect(result).toEqual({ block: true, reason: 'Commit cancelled - changes suggested by user' });
        expect(ctx.ui.notify).toHaveBeenCalledWith('Suggestions noted: (no suggestions provided)');
    });

    it("prompts user and allows on 'Yes'", async () => {
        const mock = setup();

        const ctx = createMockCtx({
            ui: {
                ...createMockCtx().ui,
                select: vi.fn().mockResolvedValue('Yes, commit it'),
            },
        });

        const result = await mock.emit(
            'tool_call',
            {
                toolName: 'bash',
                input: { command: 'git commit -m "test commit"' },
            },
            ctx,
        );

        expect(result).toBeUndefined();
    });

    it('detects commit with various flags', async () => {
        const mock = setup();
        const ctx = createMockCtx({ hasUI: false });

        const commands = [
            'git commit -m "msg"',
            'git commit -am "msg"',
            'git commit --amend',
            'git commit -m "msg" --no-verify',
        ];

        for (const command of commands) {
            const result = await mock.emit(
                'tool_call',
                {
                    toolName: 'bash',
                    input: { command },
                },
                ctx,
            );

            expect(result).toEqual({ block: true, reason: expect.any(String) });
        }
    });

    it('does not register when disabled', () => {
        const mock = setup({ enabled: false });

        expect(mock.api.on).not.toHaveBeenCalled();
    });
});

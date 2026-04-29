import { describe, it, expect, vi } from 'vitest';
import { PushGuard, defaultConfig } from '../src/guards/push';
import type { PushConfig } from '../src/guards/push';
import { createMockPi, createMockCtx } from './fixtures/mocks';

describe('PushGuard', () => {
    function setup(overrides: Partial<PushConfig> = {}) {
        const config: PushConfig = { ...defaultConfig, ...overrides };
        const mock = createMockPi();

        new PushGuard(config).register(mock.api);

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

    it('passes through non-push git commands', async () => {
        const mock = setup();
        const result = await mock.emit('tool_call', {
            toolName: 'bash',
            input: { command: 'git status' },
        });

        expect(result).toBeUndefined();
    });

    it('blocks push commands without UI', async () => {
        const mock = setup();
        const ctx = createMockCtx({ hasUI: false });

        const result = await mock.emit(
            'tool_call',
            {
                toolName: 'bash',
                input: { command: 'git push origin main' },
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
                select: vi.fn().mockResolvedValue('No, cancel push'),
            },
        });

        const result = await mock.emit(
            'tool_call',
            {
                toolName: 'bash',
                input: { command: 'git push origin main' },
            },
            ctx,
        );

        expect(result).toEqual({ block: true, reason: 'Push cancelled by user' });
    });

    it("prompts user and allows on 'Yes'", async () => {
        const mock = setup();

        const ctx = createMockCtx({
            ui: {
                ...createMockCtx().ui,
                select: vi.fn().mockResolvedValue('Yes, push it'),
            },
        });

        const result = await mock.emit(
            'tool_call',
            {
                toolName: 'bash',
                input: { command: 'git push origin main' },
            },
            ctx,
        );

        expect(result).toBeUndefined();
    });

    it('detects push with various flags', async () => {
        const mock = setup();
        const ctx = createMockCtx({ hasUI: false });

        const commands = [
            'git push origin main',
            'git push --force origin main',
            'git push -u origin feature-branch',
            'git push',
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

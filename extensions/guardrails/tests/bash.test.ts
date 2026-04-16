import { describe, it, expect, vi } from 'vitest';
import { BashGuard, defaultConfig } from '../src/guards/bash';
import type { BashConfig } from '../src/guards/bash';
import { createMockPi, createMockCtx } from './fixtures/mocks';

describe('BashGuard', () => {
    function setup(overrides: Partial<BashConfig> = {}) {
        const config: BashConfig = { ...defaultConfig, ...overrides };
        const mock = createMockPi();

        new BashGuard(config).register(mock.api);

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

    it('passes through safe commands', async () => {
        const mock = setup();
        const result = await mock.emit('tool_call', {
            toolName: 'bash',
            input: { command: 'ls -la' },
        });

        expect(result).toBeUndefined();
    });

    it('blocks dangerous commands without UI', async () => {
        const mock = setup();
        const ctx = createMockCtx({ hasUI: false });

        const result = await mock.emit(
            'tool_call',
            {
                toolName: 'bash',
                input: { command: 'rm -rf /tmp/test' },
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
                select: vi.fn().mockResolvedValue('No, block it'),
            },
        });

        const result = await mock.emit(
            'tool_call',
            {
                toolName: 'bash',
                input: { command: 'sudo apt install something' },
            },
            ctx,
        );

        expect(result).toEqual({ block: true, reason: 'Blocked by user' });
    });

    it("prompts user and allows on 'Yes'", async () => {
        const mock = setup();

        const ctx = createMockCtx({
            ui: {
                ...createMockCtx().ui,
                select: vi.fn().mockResolvedValue('Yes, run it'),
            },
        });

        const result = await mock.emit(
            'tool_call',
            {
                toolName: 'bash',
                input: { command: 'sudo apt install something' },
            },
            ctx,
        );

        expect(result).toBeUndefined();
    });

    it('does not register when disabled', () => {
        const mock = setup({ enabled: false });

        expect(mock.api.on).not.toHaveBeenCalled();
    });
});

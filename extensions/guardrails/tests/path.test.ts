import { describe, it, expect } from 'vitest';
import { PathGuard, defaultConfig } from '../src/guards/path';
import type { PathConfig } from '../src/guards/path';
import { createMockPi, createMockCtx } from './fixtures/mocks';

describe('PathGuard', () => {
    function setup(overrides: Partial<PathConfig> = {}) {
        const config: PathConfig = { ...defaultConfig, ...overrides };
        const mock = createMockPi();

        new PathGuard(config).register(mock.api);

        return mock;
    }

    it('registers a tool_call handler', () => {
        const mock = setup();

        expect(mock.api.on).toHaveBeenCalledWith('tool_call', expect.any(Function));
    });

    it('ignores non-write/edit tool calls', async () => {
        const mock = setup();
        const result = await mock.emit('tool_call', { toolName: 'bash', input: { command: 'echo hello' } });

        expect(result).toBeUndefined();
    });

    it('blocks writes to protected paths', async () => {
        const mock = setup();
        const result = await mock.emit('tool_call', { toolName: 'write', input: { path: '/project/.env' } });

        expect(result).toEqual({ block: true, reason: expect.stringContaining('.env') });
    });

    it('blocks edits to protected paths', async () => {
        const mock = setup();
        const result = await mock.emit('tool_call', { toolName: 'edit', input: { path: '/project/.git/config' } });

        expect(result).toEqual({ block: true, reason: expect.stringContaining('.git') });
    });

    it('allows writes to unprotected paths', async () => {
        const mock = setup();
        const result = await mock.emit('tool_call', { toolName: 'write', input: { path: '/project/src/index.ts' } });

        expect(result).toBeUndefined();
    });

    it('shows a notification when not in silent mode', async () => {
        const mock = setup({ silentBlock: false });
        const ctx = createMockCtx();

        await mock.emit('tool_call', { toolName: 'write', input: { path: '/project/.env' } }, ctx);

        expect(ctx.ui.notify).toHaveBeenCalledWith(expect.stringContaining('.env'), 'warning');
    });

    it('does not notify in silent mode', async () => {
        const mock = setup({ silentBlock: true });
        const ctx = createMockCtx();

        await mock.emit('tool_call', { toolName: 'write', input: { path: '/project/.env' } }, ctx);

        expect(ctx.ui.notify).not.toHaveBeenCalled();
    });

    it('does not register when disabled', () => {
        const mock = setup({ enabled: false });

        expect(mock.api.on).not.toHaveBeenCalled();
    });
});

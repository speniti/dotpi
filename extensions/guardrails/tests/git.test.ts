import { describe, it, expect, vi } from 'vitest';
import { GitGuard, defaultConfig } from '../src/guards/git';
import type { GitConfig } from '../src/guards/git';
import { createMockPi, createMockCtx } from './fixtures/mocks';

describe('GitGuard', () => {
    function setup(overrides: Partial<GitConfig> = {}) {
        const config: GitConfig = { ...defaultConfig, ...overrides };
        const mock = createMockPi();

        new GitGuard(config).register(mock.api);

        return mock;
    }

    it('registers session_before_switch and session_before_fork handlers', () => {
        const mock = setup();

        expect(mock.api.on).toHaveBeenCalledWith('session_before_switch', expect.any(Function));
        expect(mock.api.on).toHaveBeenCalledWith('session_before_fork', expect.any(Function));
    });

    it('allows when repo is clean', async () => {
        const mock = setup();
        mock.api.exec = vi.fn().mockResolvedValue({ stdout: '', code: 0 });

        const result = await mock.emit('session_before_switch', { type: 'session_before_switch', reason: 'new' });

        expect(result).toBeUndefined();
    });

    it('allows when not a git repo', async () => {
        const mock = setup();
        mock.api.exec = vi.fn().mockResolvedValue({ stdout: '', code: 128 });

        const result = await mock.emit('session_before_switch', { type: 'session_before_switch', reason: 'new' });

        expect(result).toBeUndefined();
    });

    it('blocks without UI when repo is dirty', async () => {
        const mock = setup();
        mock.api.exec = vi.fn().mockResolvedValue({ stdout: 'M file.ts\n', code: 0 });

        const ctx = createMockCtx({ hasUI: false });
        const result = await mock.emit('session_before_switch', { type: 'session_before_switch', reason: 'new' }, ctx);

        expect(result).toEqual({ cancel: true });
    });

    it('blocks without override when allowOverride is false', async () => {
        const mock = setup({ allowOverride: false });
        mock.api.exec = vi.fn().mockResolvedValue({ stdout: 'M file.ts\n', code: 0 });

        const ctx = createMockCtx();
        const result = await mock.emit('session_before_switch', { type: 'session_before_switch', reason: 'new' }, ctx);

        expect(result).toEqual({ cancel: true });
        expect(ctx.ui.notify).toHaveBeenCalled();
    });

    it('cancels when user declines override', async () => {
        const mock = setup();
        mock.api.exec = vi.fn().mockResolvedValue({ stdout: 'M file.ts\n', code: 0 });

        const ctx = createMockCtx({
            ui: { ...createMockCtx().ui, select: vi.fn().mockResolvedValue('No, let me commit first') },
        });

        const result = await mock.emit('session_before_switch', { type: 'session_before_switch', reason: 'new' }, ctx);

        expect(result).toEqual({ cancel: true });
    });

    it('allows when user confirms override', async () => {
        const mock = setup();
        mock.api.exec = vi.fn().mockResolvedValue({ stdout: 'M file.ts\n', code: 0 });

        const ctx = createMockCtx({
            ui: { ...createMockCtx().ui, select: vi.fn().mockResolvedValue('Yes, proceed anyway') },
        });

        const result = await mock.emit('session_before_switch', { type: 'session_before_switch', reason: 'new' }, ctx);

        expect(result).toBeUndefined();
    });

    it('also checks on session_before_fork', async () => {
        const mock = setup();
        mock.api.exec = vi.fn().mockResolvedValue({ stdout: '', code: 0 });

        const result = await mock.emit('session_before_fork', { type: 'session_before_fork', entryId: 'entry-1' });

        expect(result).toBeUndefined();
    });

    it('does not register when disabled', () => {
        const mock = setup({ enabled: false });

        expect(mock.api.on).not.toHaveBeenCalled();
    });

    it('does not register when blockOnDirty is false', () => {
        const mock = setup({ blockOnDirty: false });

        expect(mock.api.on).not.toHaveBeenCalled();
    });
});

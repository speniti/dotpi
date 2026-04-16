import { describe, it, expect, vi } from 'vitest';
import type { ExtensionContext } from '@mariozechner/pi-coding-agent';
import { SessionGuard, defaultConfig } from '../src/guards/session';
import type { SessionConfig } from '../src/guards/session';
import { createMockPi, createMockCtx } from './fixtures/mocks';

describe('SessionGuard', () => {
    function setup(overrides: Partial<SessionConfig> = {}) {
        const config: SessionConfig = { ...defaultConfig, ...overrides };
        const mock = createMockPi();

        new SessionGuard(config).register(mock.api);

        return mock;
    }

    it('registers session_before_switch and session_before_fork handlers', () => {
        const mock = setup();

        expect(mock.api.on).toHaveBeenCalledWith('session_before_switch', expect.any(Function));
        expect(mock.api.on).toHaveBeenCalledWith('session_before_fork', expect.any(Function));
    });

    it('cancels new session when user declines', async () => {
        const mock = setup();

        const ctx = createMockCtx({
            ui: { ...createMockCtx().ui, confirm: vi.fn().mockResolvedValue(false) },
        });

        const result = await mock.emit('session_before_switch', { type: 'session_before_switch', reason: 'new' }, ctx);

        expect(result).toEqual({ cancel: true });
    });

    it('allows new session when user confirms', async () => {
        const mock = setup();

        const ctx = createMockCtx({
            ui: { ...createMockCtx().ui, confirm: vi.fn().mockResolvedValue(true) },
        });

        const result = await mock.emit('session_before_switch', { type: 'session_before_switch', reason: 'new' }, ctx);

        expect(result).toBeUndefined();
    });

    it('skips confirmation for new session when confirmNew is false', async () => {
        const mock = setup({ confirmNew: false });
        const ctx = createMockCtx();

        const result = await mock.emit('session_before_switch', { type: 'session_before_switch', reason: 'new' }, ctx);

        expect(ctx.ui.confirm).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    it('cancels resume when user declines', async () => {
        const mock = setup();

        const ctx = createMockCtx({
            sessionManager: {
                getEntries: vi.fn(() => [{ type: 'message', message: { role: 'user' } }]),
            } as unknown as ExtensionContext['sessionManager'],
            ui: { ...createMockCtx().ui, confirm: vi.fn().mockResolvedValue(false) },
        });

        const result = await mock.emit(
            'session_before_switch',
            { type: 'session_before_switch', reason: 'resume' },
            ctx,
        );

        expect(result).toEqual({ cancel: true });
    });

    it("cancels fork when user selects 'No'", async () => {
        const mock = setup();

        const ctx = createMockCtx({
            ui: { ...createMockCtx().ui, select: vi.fn().mockResolvedValue('No, stay here') },
        });

        const result = await mock.emit('session_before_fork', { type: 'session_before_fork', entryId: 'entry-1' }, ctx);

        expect(result).toEqual({ cancel: true });
    });

    it("allows fork when user selects 'Yes'", async () => {
        const mock = setup();

        const ctx = createMockCtx({
            ui: { ...createMockCtx().ui, select: vi.fn().mockResolvedValue('Yes, create fork') },
        });

        const result = await mock.emit('session_before_fork', { type: 'session_before_fork', entryId: 'entry-1' }, ctx);

        expect(result).toBeUndefined();
    });

    it('does nothing without UI', async () => {
        const mock = setup();
        const ctx = createMockCtx({ hasUI: false });

        const result = await mock.emit('session_before_switch', { type: 'session_before_switch', reason: 'new' }, ctx);

        expect(result).toBeUndefined();
    });

    it('does not register when disabled', () => {
        const mock = setup({ enabled: false });

        expect(mock.api.on).not.toHaveBeenCalled();
    });
});

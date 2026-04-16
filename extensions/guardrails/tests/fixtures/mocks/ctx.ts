/**
 * Mock for ExtensionContext.
 *
 * Uses createMockUi() for the ui property. Pass a partial context
 * to override specific fields.
 */

import type { ExtensionContext } from '@mariozechner/pi-coding-agent';
import { vi } from 'vitest';
import { createMockUi } from './ui';

export function createMockCtx(overrides: Partial<ExtensionContext> = {}): ExtensionContext {
    return {
        ui: createMockUi(),
        hasUI: true,
        cwd: '/test',
        sessionManager: {
            getEntries: vi.fn(() => []),
        } as unknown as ExtensionContext['sessionManager'],
        modelRegistry: {} as ExtensionContext['modelRegistry'],
        model: undefined,
        signal: undefined,
        isIdle: vi.fn(() => true),
        abort: vi.fn(),
        hasPendingMessages: vi.fn(() => false),
        shutdown: vi.fn(),
        getContextUsage: vi.fn(),
        compact: vi.fn(),
        getSystemPrompt: vi.fn(() => ''),
        ...overrides,
    } as ExtensionContext;
}

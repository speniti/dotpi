/**
 * Mock for ExtensionAPI.
 *
 * Captures all `pi.on()` calls so tests can invoke registered
 * handlers programmatically via `mock.emit()`.
 */

import type { ExtensionAPI, ExtensionContext } from '@mariozechner/pi-coding-agent';
import { vi } from 'vitest';
import { createMockCtx } from './ctx';

export function createMockPi() {
    const handlers = new Map<string, ((...args: unknown[]) => unknown)[]>();

    return {
        api: {
            on: vi.fn((event: string, handler: (...args: unknown[]) => unknown) => {
                const list = handlers.get(event) ?? [];
                list.push(handler);
                handlers.set(event, list);
            }),
            exec: vi.fn(),
            registerTool: vi.fn(),
            registerCommand: vi.fn(),
            registerShortcut: vi.fn(),
            registerFlag: vi.fn(),
            getFlag: vi.fn(),
            registerMessageRenderer: vi.fn(),
            sendMessage: vi.fn(),
            sendUserMessage: vi.fn(),
            appendEntry: vi.fn(),
            setSessionName: vi.fn(),
            getSessionName: vi.fn(),
            setLabel: vi.fn(),
            getActiveTools: vi.fn(() => []),
            getAllTools: vi.fn(() => []),
            setActiveTools: vi.fn(),
            getCommands: vi.fn(() => []),
            setModel: vi.fn(),
            getThinkingLevel: vi.fn(),
            setThinkingLevel: vi.fn(),
            registerProvider: vi.fn(),
            unregisterProvider: vi.fn(),
            events: {
                on: vi.fn(),
                off: vi.fn(),
                emit: vi.fn(),
            },
        } as unknown as ExtensionAPI,
        handlers,

        /**
         * Invoke all registered handlers for the given event.
         * Returns the first non-undefined result (mimics pi's behaviour).
         */
        async emit<T = unknown>(
            event: string,
            payload: Record<string, unknown>,
            ctx: ExtensionContext = createMockCtx(),
        ): Promise<T | undefined> {
            const list = handlers.get(event);
            if (!list) return undefined;

            for (const handler of list) {
                const result = await handler(payload, ctx);
                if (result !== undefined) return result as T;
            }
            return undefined;
        },
    };
}

/**
 * Mock for ExtensionUIContext.
 *
 * All methods are no-ops by default. Override individual methods
 * via the `overrides` parameter or with `vi.fn().mockResolvedValue()`.
 */

import type { ExtensionUIContext } from '@mariozechner/pi-coding-agent';
import { vi } from 'vitest';

export function createMockUi(overrides: Partial<ExtensionUIContext> = {}): ExtensionUIContext {
    return {
        select: vi.fn().mockResolvedValue(undefined),
        confirm: vi.fn().mockResolvedValue(false),
        input: vi.fn().mockResolvedValue(undefined),
        notify: vi.fn(),
        onTerminalInput: vi.fn(() => () => {}),
        setStatus: vi.fn(),
        setWorkingMessage: vi.fn(),
        setHiddenThinkingLabel: vi.fn(),
        setWidget: vi.fn(),
        setFooter: vi.fn(),
        setHeader: vi.fn(),
        setTitle: vi.fn(),
        custom: vi.fn(),
        pasteToEditor: vi.fn(),
        setEditorText: vi.fn(),
        getEditorText: vi.fn(() => ''),
        editor: vi.fn().mockResolvedValue(undefined),
        setEditorComponent: vi.fn(),
        theme: {} as ExtensionUIContext['theme'],
        getAllThemes: vi.fn(() => []),
        getTheme: vi.fn(),
        setTheme: vi.fn(),
        getToolsExpanded: vi.fn(() => false),
        setToolsExpanded: vi.fn(),
        ...overrides,
    } as ExtensionUIContext;
}

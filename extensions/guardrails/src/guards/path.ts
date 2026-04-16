/**
 * Path Guard
 *
 * Blocks write and edit operations targeting protected file paths
 * such as .env files, .git/, node_modules/, etc.
 */

import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';

export interface PathConfig {
    enabled: boolean;
    protectedPaths: string[];
    silentBlock: boolean;
}

export const defaultConfig: PathConfig = {
    enabled: true,
    protectedPaths: ['.env', '.env.local', '.env.production', '.git/', 'node_modules/', 'package-lock.json'],
    silentBlock: false,
};

export class PathGuard {
    constructor(private config: PathConfig = defaultConfig) {}

    register(pi: ExtensionAPI) {
        if (!this.config.enabled) return;

        pi.on('tool_call', async (event, ctx) => {
            if (event.toolName !== 'write' && event.toolName !== 'edit') return;

            const path = event.input.path as string;
            if (!path) return;

            const isProtected = this.config.protectedPaths.some((p) => path.includes(p));
            if (!isProtected) return;

            if (ctx.hasUI && !this.config.silentBlock) {
                ctx.ui.notify(`Blocked write to protected path: ${path}`, 'warning');
            }

            return { block: true, reason: `Path "${path}" is protected` };
        });
    }
}

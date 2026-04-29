/**
 * Bash Guard
 *
 * Intercepts bash tool calls that match dangerous patterns
 * and requires explicit user confirmation before execution.
 */

import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';

export interface BashConfig {
    enabled: boolean;
    dangerousPatterns: RegExp[];
    confirmTimeout: number;
}

export const defaultConfig: BashConfig = {
    enabled: true,
    dangerousPatterns: [
        /\brm\b/i,
        /\bsudo\b/i,
        /\b(chmod|chown)\b.*\b777\b/i,
        /\bgit\s+push\s+.*--force/i,
    ],
    confirmTimeout: 0,
};

export class BashGuard {
    constructor(private config: BashConfig = defaultConfig) {}

    register(pi: ExtensionAPI) {
        if (!this.config.enabled) return;

        pi.on('tool_call', async (event, ctx) => {
            if (event.toolName !== 'bash') return;

            const command = event.input.command as string;
            if (!command) return;

            const isDangerous = this.config.dangerousPatterns.some((p) => p.test(command));
            if (!isDangerous) return;

            if (!ctx.hasUI) {
                return { block: true, reason: 'Dangerous command blocked (no UI for confirmation)' };
            }

            const confirmOpts: { timeout?: number } = {};
            if (this.config.confirmTimeout > 0) {
                confirmOpts.timeout = this.config.confirmTimeout;
            }

            const choice = await ctx.ui.select(
                `⚠️  Dangerous command:\n\n  ${command}\n\nAllow execution?`,
                ['Yes, run it', 'No, block it'],
                confirmOpts,
            );

            if (choice !== 'Yes, run it') {
                ctx.ui.notify('Command blocked', 'warning');

                return { block: true, reason: 'Blocked by user' };
            }
        });
    }
}

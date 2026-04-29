/**
 * Push Guard
 *
 * Intercepts git push commands and requires user approval
 * before allowing the push to proceed.
 */

import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';

export interface PushConfig {
    enabled: boolean;
    confirmTimeout: number;
}

export const defaultConfig: PushConfig = {
    enabled: true,
    confirmTimeout: 0,
};

export class PushGuard {
    constructor(private config: PushConfig = defaultConfig) {}

    register(pi: ExtensionAPI) {
        if (!this.config.enabled) return;

        pi.on('tool_call', async (event, ctx) => {
            if (event.toolName !== 'bash') return;

            const command = event.input.command as string;
            if (!command) return;

            // Match git push commands (with or without flags)
            if (!/\bgit\s+push\b/.test(command)) return;

            if (!ctx.hasUI) {
                return { block: true, reason: 'Git push requires user approval (no UI available)' };
            }

            const confirmOpts: { timeout?: number } = {};
            if (this.config.confirmTimeout > 0) {
                confirmOpts.timeout = this.config.confirmTimeout;
            }

            const choice = await ctx.ui.select(
                `⚠️  Git push command detected:\n\n  ${command}\n\nApprove push?`,
                ['Yes, push it', 'No, cancel push'],
                confirmOpts,
            );

            if (choice !== 'Yes, push it') {
                ctx.ui.notify('Push cancelled', 'warning');

                return { block: true, reason: 'Push cancelled by user' };
            }
        });
    }
}

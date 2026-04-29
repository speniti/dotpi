/**
 * Commit Guard
 *
 * Intercepts git commit commands and requires user approval
 * before allowing the commit to proceed.
 */

import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';

export interface CommitConfig {
    enabled: boolean;
    confirmTimeout: number;
}

export const defaultConfig: CommitConfig = {
    enabled: true,
    confirmTimeout: 0,
};

export class CommitGuard {
    constructor(private config: CommitConfig = defaultConfig) {}

    register(pi: ExtensionAPI) {
        if (!this.config.enabled) return;

        pi.on('tool_call', async (event, ctx) => {
            if (event.toolName !== 'bash') return;

            const command = event.input.command as string;
            if (!command) return;

            // Match git commit commands (with or without flags)
            if (!/^\s*git\s+commit\b/.test(command)) return;

            if (!ctx.hasUI) {
                return { block: true, reason: 'Git commit requires user approval (no UI available)' };
            }

            const confirmOpts: { timeout?: number } = {};

            if (this.config.confirmTimeout > 0) {
                confirmOpts.timeout = this.config.confirmTimeout;
            }

            const choice = await ctx.ui.select(
                `⚠️  Git commit command detected:\n\n  ${command}\n\nApprove commit?`,
                ['Yes, commit it', 'No, cancel commit', 'Suggest changes'],
                confirmOpts,
            );

            if (choice === 'No, cancel commit') {
                ctx.ui.notify('Commit cancelled', 'warning');

                return { block: true, reason: 'Commit cancelled by user' };
            }

            if (choice === 'Suggest changes') {
                const suggestions = await ctx.ui.input('Enter your suggestions for changes:');
                ctx.ui.notify(`Suggestions noted: ${suggestions || '(no suggestions provided)'}`);

                return { block: true, reason: 'Commit cancelled - changes suggested by user' };
            }
        });
    }
}

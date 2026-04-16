/**
 * Git Guard
 *
 * Prevents session switch/fork when there are uncommitted git changes.
 * Optionally allows the user to override the block.
 */

import type { ExtensionAPI, ExtensionContext } from '@mariozechner/pi-coding-agent';

export interface GitConfig {
    enabled: boolean;
    blockOnDirty: boolean;
    allowOverride: boolean;
}

export const defaultConfig: GitConfig = {
    enabled: true,
    blockOnDirty: true,
    allowOverride: true,
};

export class GitGuard {
    constructor(private config: GitConfig = defaultConfig) {}

    register(pi: ExtensionAPI) {
        if (!this.config.enabled || !this.config.blockOnDirty) return;

        pi.on('session_before_switch', async (event, ctx) => {
            const action = event.reason === 'new' ? 'Start new session' : 'Switch session';

            return this.checkDirtyRepo(pi, ctx, action);
        });

        pi.on('session_before_fork', async (_event, ctx) => {
            return this.checkDirtyRepo(pi, ctx, 'Fork');
        });
    }

    private async checkDirtyRepo(
        pi: ExtensionAPI,
        ctx: ExtensionContext,
        action: string,
    ): Promise<{ cancel: boolean } | undefined> {
        const { stdout, code } = await pi.exec('git', ['status', '--porcelain']);

        if (code !== 0) return; // not a git repo, allow

        const hasChanges = stdout.trim().length > 0;
        if (!hasChanges) return;

        if (!ctx.hasUI) {
            return { cancel: true };
        }

        if (!this.config.allowOverride) {
            ctx.ui.notify(`Uncommitted changes detected. ${action} blocked.`, 'warning');

            return { cancel: true };
        }

        const changedFiles = stdout.trim().split('\n').filter(Boolean).length;

        const choice = await ctx.ui.select(`You have ${changedFiles} uncommitted file(s). ${action} anyway?`, [
            'Yes, proceed anyway',
            'No, let me commit first',
        ]);

        if (choice !== 'Yes, proceed anyway') {
            ctx.ui.notify('Commit your changes first', 'warning');

            return { cancel: true };
        }
    }
}

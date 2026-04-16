/**
 * Session Guard
 *
 * Requires confirmation before destructive session actions:
 * /new, /resume, /fork.
 */

import type { ExtensionAPI, SessionBeforeSwitchEvent, SessionMessageEntry } from '@mariozechner/pi-coding-agent';

export interface SessionConfig {
    enabled: boolean;
    confirmNew: boolean;
    confirmResume: boolean;
    confirmFork: boolean;
}

export const defaultConfig: SessionConfig = {
    enabled: true,
    confirmNew: true,
    confirmResume: true,
    confirmFork: true,
};

export class SessionGuard {
    constructor(private config: SessionConfig = defaultConfig) {}

    register(pi: ExtensionAPI) {
        if (!this.config.enabled) return;

        pi.on('session_before_switch', async (event: SessionBeforeSwitchEvent, ctx) => {
            if (!ctx.hasUI) return;

            if (event.reason === 'new' && this.config.confirmNew) {
                const confirmed = await ctx.ui.confirm(
                    'Clear session?',
                    'This will delete all messages in the current session.',
                );

                if (!confirmed) {
                    ctx.ui.notify('Clear cancelled', 'info');

                    return { cancel: true };
                }

                return;
            }

            if (event.reason === 'resume' && this.config.confirmResume) {
                const entries = ctx.sessionManager.getEntries();

                const hasWork = entries.some(
                    (e): e is SessionMessageEntry => e.type === 'message' && e.message.role === 'user',
                );

                if (hasWork) {
                    const confirmed = await ctx.ui.confirm(
                        'Switch session?',
                        'You have messages in the current session. Switch anyway?',
                    );

                    if (!confirmed) {
                        ctx.ui.notify('Switch cancelled', 'info');

                        return { cancel: true };
                    }
                }
            }
        });

        pi.on('session_before_fork', async (_event, ctx) => {
            if (!ctx.hasUI || !this.config.confirmFork) return;

            const choice = await ctx.ui.select('Fork this session?', ['Yes, create fork', 'No, stay here']);

            if (choice !== 'Yes, create fork') {
                ctx.ui.notify('Fork cancelled', 'info');

                return { cancel: true };
            }
        });
    }
}

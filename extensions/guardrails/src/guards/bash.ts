import type { ExtensionAPI, ExtensionContext, ToolCallEventResult } from '@earendil-works/pi-coding-agent';
import { parseBash, type ParsedCommand } from '../bash-parser';
import { matchDangerous, type DangerMatch } from '../matchers';

export interface BashConfig {
    enabled: boolean;
    confirmTimeout?: number;
}

export const defaultConfig: BashConfig = {
    enabled: true,
};

export class BashGuard {
    constructor(private config: BashConfig = defaultConfig) {}

    register(pi: ExtensionAPI) {
        if (!this.config.enabled) return;

        pi.on('tool_call', async (event, ctx) => {
            if (event.toolName !== 'bash') return;

            const command = event.input.command as string;
            if (!command) return;

            return this.analyseCommand(command, ctx);
        });
    }

    private async analyseCommand(command: string, ctx: ExtensionContext): Promise<ToolCallEventResult | undefined> {
        const commands = parseBash(command);
        if (!commands) return this.handleUnparseable(command, ctx);

        const danger = this.findDanger(commands);
        if (!danger) return;

        return this.confirmDangerous(command, danger, ctx);
    }

    private findDanger(commands: ParsedCommand[]): DangerMatch | undefined {
        for (const cmd of commands) {
            const match = matchDangerous(cmd);

            if (match) return match;
        }

        return undefined;
    }

    private async handleUnparseable(command: string, ctx: ExtensionContext): Promise<ToolCallEventResult | undefined> {
        if (!ctx.hasUI) {
            return { block: true, reason: 'Command blocked: unable to parse for safety checks' };
        }

        const choice = await ctx.ui.select(
            `⚠️  Unable to parse command for safety analysis:\n\n  ${command}\n\nAllow execution anyway?`,
            ['Yes, run it', 'No, block it'],
        );

        if (choice !== 'Yes, run it') {
            ctx.ui.notify('Command blocked', 'warning');

            return { block: true, reason: 'Blocked by user (unparseable command)' };
        }
    }

    private async confirmDangerous(
        command: string,
        danger: DangerMatch,
        ctx: ExtensionContext,
    ): Promise<ToolCallEventResult | undefined> {
        if (!ctx.hasUI) {
            return { block: true, reason: `Dangerous command blocked: ${danger.description}` };
        }

        const choice = await ctx.ui.select(
            `⚠️  Dangerous command (${danger.description}):\n\n  ${command}\n\nAllow execution?`,
            ['Yes, run it', 'No, block it', 'Suggest changes'],
            { timeout: this.config.confirmTimeout },
        );

        if (choice === 'No, block it') return this.blockedByUser(ctx);
        if (choice === 'Suggest changes') return this.suggestChanges(ctx);
    }

    private blockedByUser(ctx: ExtensionContext): ToolCallEventResult {
        ctx.ui.notify('Command blocked', 'warning');

        return { block: true, reason: 'Blocked by user' };
    }

    private async suggestChanges(ctx: ExtensionContext): Promise<ToolCallEventResult> {
        const suggestions = await ctx.ui.input('Enter your suggestions for changes:');
        ctx.ui.notify(`Suggestions noted: ${suggestions || '(no suggestions provided)'}`);

        return { block: true, reason: 'Command blocked - changes suggested by user' };
    }
}

import { CommandMatcher } from './command-matcher';
import type { ParsedCommand } from '../bash-parser';

export class ChownMatcher extends CommandMatcher {
    match(cmd: ParsedCommand) {
        if (cmd.name !== 'chown') return undefined;

        const hasRecursive = this.hasFlag(cmd.args, 'R') || this.hasLongOption(cmd.args, 'recursive');
        if (!hasRecursive) return undefined;

        return { description: 'recursive ownership change', pattern: 'chown -R' };
    }
}

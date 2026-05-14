import { CommandMatcher } from './command-matcher';
import type { ParsedCommand } from '../bash-parser';

export class RmMatcher extends CommandMatcher {
    match(cmd: ParsedCommand) {
        if (cmd.name !== 'rm') return undefined;

        const hasRecursive =
            this.hasFlag(cmd.args, 'r') ||
            this.hasFlag(cmd.args, 'R') ||
            this.hasLongOption(cmd.args, 'recursive') ||
            this.hasLongOption(cmd.args, 'dir');

        if (!hasRecursive) return undefined;

        const hasForce = this.hasFlag(cmd.args, 'f') || this.hasLongOption(cmd.args, 'force');

        if (hasForce) return { description: 'recursive force delete', pattern: 'rm -rf' };

        return { description: 'recursive delete', pattern: 'rm -r' };
    }
}

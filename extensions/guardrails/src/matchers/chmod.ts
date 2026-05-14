import { CommandMatcher } from './command-matcher';
import type { ParsedCommand } from '../bash-parser';

export class ChmodMatcher extends CommandMatcher {
    match(cmd: ParsedCommand) {
        if (cmd.name !== 'chmod') return undefined;

        const hasRecursive = this.hasFlag(cmd.args, 'R') || this.hasLongOption(cmd.args, 'recursive');
        if (!hasRecursive) return undefined;

        const hasWorldWritable = cmd.args.some(
            (a) => a === '777' || a === '0777' || a === 'a+rwx' || a === 'ugo+rwx' || a === '7777',
        );

        if (!hasWorldWritable) return undefined;

        return { description: 'insecure recursive permissions', pattern: 'chmod -R 777' };
    }
}

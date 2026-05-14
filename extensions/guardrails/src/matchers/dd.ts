import { CommandMatcher } from './command-matcher';
import type { ParsedCommand } from '../bash-parser';

export class DdMatcher extends CommandMatcher {
    match(cmd: ParsedCommand) {
        if (cmd.name !== 'dd') return undefined;

        if (this.hasArg(cmd.args, 'of=')) return { description: 'disk write operation', pattern: 'dd of=' };

        return undefined;
    }
}

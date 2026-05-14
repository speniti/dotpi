import { CommandMatcher } from './command-matcher';
import type { ParsedCommand } from '../bash-parser';

export class SudoMatcher extends CommandMatcher {
    match(cmd: ParsedCommand) {
        if (cmd.name !== 'sudo') return undefined;

        return { description: 'superuser command', pattern: 'sudo' };
    }
}

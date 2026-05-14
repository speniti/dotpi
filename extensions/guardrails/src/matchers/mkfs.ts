import { CommandMatcher } from './command-matcher';
import type { ParsedCommand } from '../bash-parser';

export class MkfsMatcher extends CommandMatcher {
    match(cmd: ParsedCommand) {
        if (cmd.name !== 'mkfs' && !cmd.name.startsWith('mkfs.')) return undefined;

        return { description: 'filesystem format', pattern: 'mkfs' };
    }
}

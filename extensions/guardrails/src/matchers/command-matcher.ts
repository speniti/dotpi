import type { ParsedCommand } from '../bash-parser';

export interface DangerMatch {
    description: string;
    pattern: string;
}

export abstract class CommandMatcher {
    abstract match(cmd: ParsedCommand): DangerMatch | undefined;

    protected hasFlag(args: string[], flag: string): boolean {
        return args.some((a) => a === `-${flag}` || (a.startsWith('-') && !a.startsWith('--') && a.includes(flag)));
    }

    protected hasLongOption(args: string[], option: string): boolean {
        return args.some((a) => a === `--${option}` || a.startsWith(`--${option}=`));
    }

    protected hasArg(args: string[], prefix: string): boolean {
        return args.some((a) => a.startsWith(prefix));
    }
}

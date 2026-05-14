import type { ParsedCommand } from '../bash-parser';
import type { DangerMatch } from './command-matcher';

import { RmMatcher } from './rm';
import { SudoMatcher } from './sudo';
import { ChmodMatcher } from './chmod';
import { ChownMatcher } from './chown';
import { DdMatcher } from './dd';
import { MkfsMatcher } from './mkfs';
import { ContainerMatcher } from './container';

export type { DangerMatch } from './command-matcher';

export function matchDangerous(cmd: ParsedCommand): DangerMatch | undefined {
    for (const matcher of [
        new RmMatcher(),
        new SudoMatcher(),
        new ChmodMatcher(),
        new ChownMatcher(),
        new DdMatcher(),
        new MkfsMatcher(),
        new ContainerMatcher(),
    ]) {
        const match = matcher.match(cmd);

        if (match) return match;
    }

    return undefined;
}

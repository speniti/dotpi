/**
 * Pi Guardrails — Entry point
 *
 * Combines all guard modules into a single extension.
 * Each guard owns its own config and default values.
 */

import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { initBashParser } from './src/bash-parser';
import { BashGuard } from './src/guards/bash';
import { PathGuard } from './src/guards/path';
import { SessionGuard } from './src/guards/session';
import { GitGuard } from './src/guards/git';
import { CommitGuard } from './src/guards/commit';
import { PushGuard } from './src/guards/push';

type Guard = { register(pi: ExtensionAPI): void };

export default async function (pi: ExtensionAPI) {
    // Initialise the bash parser (~100ms one-time WASM load)
    await initBashParser();

    const guards: Guard[] = [
        new BashGuard(),
        new PathGuard(),
        new SessionGuard(),
        new GitGuard(),
        new CommitGuard(),
        new PushGuard(),
    ];

    guards.forEach((g) => g.register(pi));
}

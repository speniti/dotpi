/**
 * Pi Guardrails — Entry point
 *
 * Combines all guard modules into a single extension.
 * Each guard owns its own config and default values.
 */

import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { BashGuard } from './src/guards/bash';
import { PathGuard } from './src/guards/path';
import { SessionGuard } from './src/guards/session';
import { GitGuard } from './src/guards/git';
import { CommitGuard } from './src/guards/commit';
import { PushGuard } from './src/guards/push';

type Guard = { register(pi: ExtensionAPI): void };

const guards: Guard[] = [new BashGuard(), new PathGuard(), new SessionGuard(), new GitGuard(), new CommitGuard(), new PushGuard()];

export default function (pi: ExtensionAPI) {
    guards.forEach((g) => g.register(pi));
}

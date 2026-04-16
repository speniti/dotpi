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

type Guard = { register(pi: ExtensionAPI): void };

const guards: Guard[] = [new BashGuard(), new PathGuard(), new SessionGuard(), new GitGuard()];

export default function (pi: ExtensionAPI) {
    guards.forEach((g) => g.register(pi));
}

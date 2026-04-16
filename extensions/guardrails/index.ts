/**
 * Pi Guardrails — Entry point
 *
 * Combines all guardrail modules into a single extension.
 * Edit config.ts to customise behaviour.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { config } from "./config";
import { registerBashGate } from "./bash-gate";
import { registerPathGate } from "./path-gate";
import { registerSessionGuard } from "./session-guard";
import { registerGitCheck } from "./git-check";

export default function (pi: ExtensionAPI) {
	registerBashGate(pi, config.bash);
	registerPathGate(pi, config.paths);
	registerSessionGuard(pi, config.session);
	registerGitCheck(pi, config.git);
}

/**
 * Protected Paths Gate
 *
 * Blocks write and edit operations targeting protected file paths
 * such as .env files, .git/, node_modules/, etc.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { GuardrailsConfig } from "./config";

export function registerPathGate(pi: ExtensionAPI, config: GuardrailsConfig["paths"]) {
	if (!config.enabled) return;

	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName !== "write" && event.toolName !== "edit") return;

		const path = event.input.path as string;
		if (!path) return;

		const isProtected = config.protectedPaths.some((p) => path.includes(p));
		if (!isProtected) return;

		if (ctx.hasUI && !config.silentBlock) {
			ctx.ui.notify(`Blocked write to protected path: ${path}`, "warning");
		}

		return { block: true, reason: `Path "${path}" is protected` };
	});
}

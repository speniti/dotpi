/**
 * Bash Permission Gate
 *
 * Intercepts bash tool calls that match dangerous patterns
 * and requires explicit user confirmation before execution.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { GuardrailsConfig } from "./config";

export function registerBashGate(pi: ExtensionAPI, config: GuardrailsConfig["bash"]) {
	if (!config.enabled) return;

	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName !== "bash") return;

		const command = event.input.command as string;
		if (!command) return;

		const isDangerous = config.dangerousPatterns.some((p) => p.test(command));
		if (!isDangerous) return;

		if (!ctx.hasUI) {
			return { block: true, reason: "Dangerous command blocked (no UI for confirmation)" };
		}

		const confirmOpts: { timeout?: number } = {};
		if (config.confirmTimeout > 0) {
			confirmOpts.timeout = config.confirmTimeout;
		}

		const choice = await ctx.ui.select(
			`⚠️  Dangerous command:\n\n  ${command}\n\nAllow execution?`,
			["Yes, run it", "No, block it"],
			confirmOpts,
		);

		if (choice !== "Yes, run it") {
			ctx.ui.notify("Command blocked", "warning");
			return { block: true, reason: "Blocked by user" };
		}
	});
}

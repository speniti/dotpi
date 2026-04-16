/**
 * Git Dirty Check
 *
 * Prevents session switch/fork when there are uncommitted git changes.
 * Optionally allows the user to override the block.
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { GuardrailsConfig } from "./config";

async function checkDirtyRepo(
	pi: ExtensionAPI,
	ctx: ExtensionContext,
	action: string,
	config: GuardrailsConfig["git"],
): Promise<{ cancel: boolean } | undefined> {
	const { stdout, code } = await pi.exec("git", ["status", "--porcelain"]);

	if (code !== 0) return; // not a git repo, allow

	const hasChanges = stdout.trim().length > 0;
	if (!hasChanges) return;

	if (!ctx.hasUI) {
		return { cancel: true };
	}

	if (!config.allowOverride) {
		ctx.ui.notify(`Uncommitted changes detected. ${action} blocked.`, "warning");
		return { cancel: true };
	}

	const changedFiles = stdout.trim().split("\n").filter(Boolean).length;

	const choice = await ctx.ui.select(
		`You have ${changedFiles} uncommitted file(s). ${action} anyway?`,
		["Yes, proceed anyway", "No, let me commit first"],
	);

	if (choice !== "Yes, proceed anyway") {
		ctx.ui.notify("Commit your changes first", "warning");
		return { cancel: true };
	}
}

export function registerGitCheck(pi: ExtensionAPI, config: GuardrailsConfig["git"]) {
	if (!config.enabled || !config.blockOnDirty) return;

	pi.on("session_before_switch", async (event, ctx) => {
		const action = event.reason === "new" ? "Start new session" : "Switch session";
		return checkDirtyRepo(pi, ctx, action, config);
	});

	pi.on("session_before_fork", async (_event, ctx) => {
		return checkDirtyRepo(pi, ctx, "Fork", config);
	});
}

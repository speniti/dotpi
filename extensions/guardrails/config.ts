/**
 * Guardrails configuration.
 *
 * Edit this file to customise which operations require confirmation
 * and which paths are protected. All sections can be enabled/disabled
 * independently.
 */

export interface GuardrailsConfig {
	bash: {
		enabled: boolean;
		dangerousPatterns: RegExp[];
		confirmTimeout: number;
	};
	paths: {
		enabled: boolean;
		protectedPaths: string[];
		silentBlock: boolean;
	};
	session: {
		enabled: boolean;
		confirmNew: boolean;
		confirmResume: boolean;
		confirmFork: boolean;
	};
	git: {
		enabled: boolean;
		blockOnDirty: boolean;
		allowOverride: boolean;
	};
}

export const config: GuardrailsConfig = {
	// ── Bash Permission Gate ──────────────────────────────────
	bash: {
		enabled: true,
		dangerousPatterns: [
			/\brm\s+(-[a-zA-Z]*f[a-zA-Z]*\s|--force\b)/i,
			/\brm\s+(-[a-zA-Z]*r[a-zA-Z]*\s|--recursive\b)/i,
			/\bsudo\b/i,
			/\b(chmod|chown)\b.*\b777\b/i,
			/\bgit\s+push\s+.*--force/i,
		],
		confirmTimeout: 0,
	},

	// ── Protected Paths ───────────────────────────────────────
	paths: {
		enabled: true,
		protectedPaths: [
			".env",
			".env.local",
			".env.production",
			".git/",
			"node_modules/",
			"package-lock.json",
		],
		silentBlock: false,
	},

	// ── Session Guard ─────────────────────────────────────────
	session: {
		enabled: true,
		confirmNew: true,
		confirmResume: true,
		confirmFork: true,
	},

	// ── Git Dirty Check ───────────────────────────────────────
	git: {
		enabled: true,
		blockOnDirty: true,
		allowOverride: true,
	},
};

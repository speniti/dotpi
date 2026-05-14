# Guardrails

Safety guardrails for pi — intercept destructive actions and require user confirmation.

## Guards

| Guard | Event | Behaviour |
|-------|-------|-----------|
| **Bash** | `tool_call` (bash) | Parses commands via tree-sitter AST for structural matching. Detects `rm -rf`, `sudo`, `chmod -R 777`, `dd of=`, `mkfs`, `chown -R`, dangerous `docker run` flags. Fail-closed: blocks on parse failure. |
| **Commit** | `tool_call` (bash) | Intercepts git commit commands and requires user approval before proceeding. |
| **Push** | `tool_call` (bash) | Intercepts git push commands and requires user approval before proceeding. |
| **Path** | `tool_call` (write/edit) | Blocks writes to protected paths (`.env`, `.git/`, `node_modules/`, `package-lock.json`). Silent mode available. |
| **Session** | `session_before_switch` / `session_before_fork` | Requires confirmation before clearing, switching, or forking a session. |
| **Git** | `session_before_switch` / `session_before_fork` | Prevents session switch/fork when there are uncommitted git changes. Optional override. |

## Bash Guard — Structural Matching

The BashGuard uses [tree-sitter](https://tree-sitter.github.io/tree-sitter/) via `web-tree-sitter` (WASM) to parse bash commands into an AST, then runs structural matchers against the parsed commands. This eliminates false positives that regex-based matching produces:

| Command | Regex `\brm\b` | Parser (structural) |
|---------|:-:|:-:|
| `rm -rf /` | ✅ Blocks | ✅ Blocks |
| `rm file.txt` | ✅ Blocks | ✅ Passes (no dangerous flags) |
| `echo 'use rm to remove files'` | ✅ Blocks | ✅ Passes (rm is in a string) |
| `git commit -m 'use rm -rf safely'` | ✅ Blocks | ✅ Passes (rm is in a message) |
| `sudo chmod -R 777 /var` | ✅ Blocks | ✅ Blocks (structural match) |

### Fail-closed policy

If the parser fails (WASM not loaded, malformed command), the guard **blocks the command** and prompts the user for explicit confirmation. Better safe than sorry.

### Detected patterns

| Pattern | Description |
|---------|-------------|
| `rm -rf` / `rm -r -f` | Recursive force delete |
| `rm -r` | Recursive delete (without force) |
| `sudo` | Superuser command |
| `chmod -R 777` | Insecure recursive permissions |
| `chown -R` | Recursive ownership change |
| `dd of=` | Disk write operation |
| `mkfs` / `mkfs.*` | Filesystem format |
| `docker run --privileged` | Container with privileged mode |
| `docker run --pid=host` | Container with host PID namespace |
| `docker run --network=host` | Container with host network |

## Configuration

Each guard owns its own config type and default values, exported from its source file. Override defaults by passing a config object to the constructor:

```ts
import { BashGuard } from './src/guards/bash';
import { defaultConfig } from './src/guards/bash';

new BashGuard({
    ...defaultConfig,
    confirmTimeout: 30,
});
```

Every config has an `enabled` field — set it to `false` to skip registration entirely.

## Architecture

```
extensions/guardrails/
  index.ts                     # Composition root — async init, registers all guards
  src/
    bash-parser.ts             # tree-sitter WASM wrapper (init + parse)
    dangerous-matchers.ts      # Structural matchers for parsed commands
    guards/
      bash.ts                  # BashConfig + defaultConfig + BashGuard
      commit.ts                # CommitConfig + defaultConfig + CommitGuard
      push.ts                  # PushConfig + defaultConfig + PushGuard
      path.ts                  # PathConfig + defaultConfig + PathGuard
      session.ts               # SessionConfig + defaultConfig + SessionGuard
      git.ts                   # GitConfig + defaultConfig + GitGuard
  tests/
    fixtures/mocks/            # SDK mock factories
    *.test.ts
```

### Dependencies

- `web-tree-sitter` — WASM runtime for tree-sitter (~4.4 MB)
- `tree-sitter-bash` — Bash grammar for tree-sitter (~1.3 MB WASM)

The parser is initialised once at extension startup (`await initBashParser()`) in ~100ms. Subsequent parses cost ~5-13µs per command.

## Adding a new dangerous pattern

Add a matcher in `src/dangerous-matchers.ts`:

```ts
const myMatcher: Matcher = (cmd) => {
    if (cmd.name !== 'dangerous-cmd') return undefined;
    if (cmd.args.some((a) => a === '--destructive')) {
        return { description: 'destructive operation', pattern: 'dangerous-cmd --destructive' };
    }
    return undefined;
};

// Add to MATCHERS array
const MATCHERS: Matcher[] = [
    rmMatcher,
    sudoMatcher,
    // ...
    myMatcher,
];
```

## Testing

```bash
# Run this extension's tests
npx vitest run extensions/guardrails

# Run with coverage
npx vitest run --coverage extensions/guardrails
```

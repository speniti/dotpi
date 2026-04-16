# Guardrails

Safety guardrails for pi — intercept destructive actions and require user confirmation.

## Guards

| Guard | Event | Behaviour |
|-------|-------|-----------|
| **Bash** | `tool_call` (bash) | Blocks commands matching dangerous patterns (`rm -rf`, `sudo`, `chmod 777`, `git push --force`). Prompts user for confirmation. |
| **Path** | `tool_call` (write/edit) | Blocks writes to protected paths (`.env`, `.git/`, `node_modules/`, `package-lock.json`). Silent mode available. |
| **Session** | `session_before_switch` / `session_before_fork` | Requires confirmation before clearing, switching, or forking a session. |
| **Git** | `session_before_switch` / `session_before_fork` | Prevents session switch/fork when there are uncommitted git changes. Optional override. |

## Configuration

Each guard owns its own config type and defaults. To customise, pass a config object to the constructor:

```ts
import { BashGuard } from './src/guards/bash';

new BashGuard({
    enabled: true,
    dangerousPatterns: [/\brm\s+/i],
    confirmTimeout: 30,
});
```

### Defaults

**Bash**

| Field | Default |
|-------|---------|
| `enabled` | `true` |
| `dangerousPatterns` | `rm -f`, `rm -r`, `sudo`, `chmod/chown 777`, `git push --force` |
| `confirmTimeout` | `0` (no timeout) |

**Path**

| Field | Default |
|-------|---------|
| `enabled` | `true` |
| `protectedPaths` | `.env`, `.env.local`, `.env.production`, `.git/`, `node_modules/`, `package-lock.json` |
| `silentBlock` | `false` |

**Session**

| Field | Default |
|-------|---------|
| `enabled` | `true` |
| `confirmNew` | `true` |
| `confirmResume` | `true` |
| `confirmFork` | `true` |

**Git**

| Field | Default |
|-------|---------|
| `enabled` | `true` |
| `blockOnDirty` | `true` |
| `allowOverride` | `true` |

## Architecture

```
extensions/guardrails/
  index.ts                 # Composition root — registers all guards
  src/guards/
    bash.ts                # BashConfig + defaultConfig + BashGuard
    path.ts                # PathConfig + defaultConfig + PathGuard
    session.ts             # SessionConfig + defaultConfig + SessionGuard
    git.ts                 # GitConfig + defaultConfig + GitGuard
  tests/
    fixtures/mocks/        # SDK mock factories
    *.test.ts
```

Each guard is fully self-contained: it declares its own config type, default values, and class. The entry point (`index.ts`) simply imports, instantiates, and registers all guards.

**Adding a new guard:**

1. Create `src/guards/<name>.ts` with config type, defaults, and class
2. Add one import + one line in `index.ts`
3. Add `tests/<name>.test.ts`

## Tests

```bash
npm test              # run tests
npm run test:coverage  # run with coverage (95%+ on src/)
```

Coverage tracks only `src/` — mocks and the composition root are excluded.

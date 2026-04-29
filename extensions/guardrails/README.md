# Guardrails

Safety guardrails for pi — intercept destructive actions and require user confirmation.

## Guards

| Guard | Event | Behaviour |
|-------|-------|-----------|
| **Bash** | `tool_call` (bash) | Blocks commands matching dangerous patterns (`rm -rf`, `sudo`, `chmod 777`, `git push --force`). Prompts user for confirmation. |
| **Commit** | `tool_call` (bash) | Intercepts git commit commands and requires user approval before proceeding. |
| **Push** | `tool_call` (bash) | Intercepts git push commands and requires user approval before proceeding. |
| **Path** | `tool_call` (write/edit) | Blocks writes to protected paths (`.env`, `.git/`, `node_modules/`, `package-lock.json`). Silent mode available. |
| **Session** | `session_before_switch` / `session_before_fork` | Requires confirmation before clearing, switching, or forking a session. |
| **Git** | `session_before_switch` / `session_before_fork` | Prevents session switch/fork when there are uncommitted git changes. Optional override. |

## Configuration

Each guard owns its own config type and default values, exported from its source file. Override defaults by passing a config object to the constructor:

```ts
import { BashGuard } from './src/guards/bash';
import { defaultConfig } from './src/guards/bash';

new BashGuard({
    ...defaultConfig,
    dangerousPatterns: [/\brm\s+/i],
    confirmTimeout: 30,
});
```

Every config has an `enabled` field — set it to `false` to skip registration entirely.

## Architecture

```
extensions/guardrails/
  index.ts                 # Composition root — registers all guards
  src/guards/
    bash.ts                # BashConfig + defaultConfig + BashGuard
    commit.ts              # CommitConfig + defaultConfig + CommitGuard
    push.ts                # PushConfig + defaultConfig + PushGuard
    path.ts                # PathConfig + defaultConfig + PathGuard
    session.ts             # SessionConfig + defaultConfig + SessionGuard
    git.ts                 # GitConfig + defaultConfig + GitGuard
  tests/
    fixtures/mocks/        # SDK mock factories
    *.test.ts
```

Each guard is fully self-contained: it declares its own config type, default values, and class. The entry point (`index.ts`) simply imports, instantiates, and registers all guards.

## Adding a new guard

1. Create `src/guards/<name>.ts` — export a config type, `defaultConfig`, and a class with a `register(pi)` method:

   ```ts
   import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';

   export interface MyConfig {
       enabled: boolean;
   }

   export const defaultConfig: MyConfig = {
       enabled: true,
   };

   export class MyGuard {
       constructor(private config: MyConfig = defaultConfig) {}

       register(pi: ExtensionAPI) {
           if (!this.config.enabled) return;
           pi.on('tool_call', async (event, ctx) => {
               // ...
           });
       }
   }
   ```

2. Add one import and one line in `index.ts`:

   ```ts
   import { MyGuard } from './src/guards/my';

   const guards: Guard[] = [
       // ...
       new MyGuard(),
   ];
   ```

3. Add `tests/<name>.test.ts` using the mock factories from `tests/fixtures/mocks`.

## Testing

```bash
# Run this extension's tests
npx vitest run extensions/guardrails

# Run with coverage
npx vitest run --coverage extensions/guardrails
```

> **Note:** Coverage tracks only files under `src/`. The composition root (`index.ts`), tests, and mocks are excluded.

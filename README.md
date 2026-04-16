# dotpi

Personal [pi](https://github.com/badlogic/pi-mono) coding agent setup — extensions, skills, themes, and prompts.

Like dotfiles, but for pi.

## Contents

| Directory | Description |
|-----------|-------------|
| `extensions/` | Extensions — add capabilities, intercept events, register tools |
| `themes/` | Custom TUI themes |
| `skills/` | Custom skills |
| `prompts/` | Custom prompt templates |

## Install

```bash
# Global install from git
pi install git:github.com/speniti/dotpi

# Per-project install — writes to .pi/settings.json so your team gets the same resources
pi install -l git:github.com/speniti/dotpi
```

### Try without installing

Clone the repo first, then point pi to the local copy:

```bash
git clone https://github.com/speniti/dotpi.git
pi -e ./dotpi
```

This loads the package into a temporary directory for the current run only.

## Adding new resources

### Extension

Create a new directory under `extensions/`:

```
extensions/
└── my-extension/
    └── index.ts       # Must export default function(pi: ExtensionAPI)
```

Pi auto-discovers all `.ts`/`.js` files recursively under `extensions/`.

### Skill

```
skills/
└── my-skill/
    └── SKILL.md
```

### Prompt template

```
prompts/
└── my-template.md
```

### Theme

```
themes/
└── my-theme.json
```

All resources are auto-discovered — no registration needed.

## License

[MIT](LICENSE)

## Development

### Tooling

| Command | Description |
|---------|-------------|
| `npm test` | Run test suite |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint with ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |

### Structure

Extensions follow a consistent layout:

```
extensions/<name>/
  index.ts               # Entry point (composition root)
  src/                   # Source code
  tests/
    <name>.test.ts
    fixtures/mocks/      # Optional — only when SDK mocks are needed
```

> **Note:** Vitest coverage tracks only files under `src/`. The composition root (`index.ts`), tests, and mocks are excluded.

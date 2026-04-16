# dotpi

Personal [pi](https://github.com/badlogic/pi-mono) coding agent setup — extensions, skills, themes, and prompts.

Like dotfiles, but for pi.

## Contents

| Directory | Description |
|-----------|-------------|
| `extensions/` | Extensions — add capabilities, intercept events, register tools |
| `themes/` | Rosé Pine dark, moon & dawn |
| `skills/` | Custom skills |
| `prompts/` | Custom prompt templates |

## Install

```bash
# From git
pi install git:github.com/speniti/dotpi

# Try without installing
pi -e ~/Code/dotpi
```

## Project-local install

```bash
pi install -l ~/Code/dotpi
```

This writes to `.pi/settings.json` so your team gets the same resources automatically.

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
  src/guards/            # or src/tools/, src/handlers/ etc.
  tests/
    <name>.test.ts
    fixtures/mocks/
```

Vitest coverage is configured to track only `src/` directories.

## License

MIT

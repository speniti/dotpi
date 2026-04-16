# dotpi

Personal [pi](https://github.com/badlogic/pi-mono) coding agent setup — extensions, skills, themes, and prompts.

Like dotfiles, but for pi.

## Contents

| Directory | Description |
|-----------|-------------|
| `extensions/guardrails/` | Safety guardrails — confirm destructive bash commands, protect sensitive paths, safeguard session actions, check dirty git repos |
| `themes/` | Rosé Pine dark, moon & dawn |
| `skills/` | Custom skills |
| `prompts/` | Custom prompt templates |

## Install

```bash
# From local path
pi install ~/Code/dotpi

# From git (after pushing to GitHub)
pi install git:github.com/<your-user>/dotpi

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

## License

MIT

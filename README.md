# pi-extensions

Personal [pi](https://github.com/badlogic/pi-mono) extensions, skills, themes, and prompts.

## Contents

| Directory | Description |
|-----------|-------------|
| `extensions/guardrails/` | Safety guardrails — confirm destructive bash commands, protect sensitive paths, safeguard session actions, check dirty git repos |
| `themes/` | Custom themes (Rosé Pine dark & dawn) |
| `skills/` | Custom skills |
| `prompts/` | Custom prompt templates |

## Install

```bash
# From local path
pi install ~/Code/pi-extensions

# From git (after pushing to GitHub)
pi install git:github.com/<your-user>/pi-extensions

# Try without installing
pi -e ~/Code/pi-extensions
```

## Project-local install

```bash
pi install -l ~/Code/pi-extensions
```

This writes to `.pi/settings.json` so your team gets the same extensions automatically.

## Adding new resources

### Extension

Create a new directory under `extensions/`:

```
extensions/
└── my-extension/
    └── index.ts       # Must export a default function(ExtensionAPI)
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

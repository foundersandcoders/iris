---
description: "=== IRIS {{ Haiku }} === Check all version number props and update them"
argument-hint: [version number]
model: claude-haiku-4-5
---

# Version Checker

Check the following properties and update to $ARGUMENTS (coercing type if necessary)

- `README.md` - `# Iris v`
- `package.json` - `"version"`
- `src/lib/types/config.ts` - `getConfig().submission.release`,
- `src/tui/utils/layout.ts` - `this.term.colorRgbHex(theme.textMuted)('$ARGUMENTS');`
- `src-tauri/tauri.conf.json` - `"version"`
- `src-tauri/Cargo.toml` - `[package] version`

If no args are passed, do not execute this command.

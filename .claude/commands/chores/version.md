---
description: check all version number props and update them
argument-hint: [version number]
# allowed-tools:
# model:
disable-model-invocation: false
---

# Version Checker

Check the following properties and update the value denoted to $ARGUMENTS (coercing type if necessary)

- `README.md` - `# Iris v$ARGUMENTS`
- `package.json` - `"version": "$ARGUMENTS"`
- `src-tauri/tauri.conf.json` - `"version": "$ARGUMENTS"`
- `src-tauri/Cargo.toml` - `[package] name = "app" version = "$ARGUMENTS"`
- `src/tui/utils/layout.ts` - `this.term.colorRgbHex(theme.textMuted)('$ARGUMENTS');`

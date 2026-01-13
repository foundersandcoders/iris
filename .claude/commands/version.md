---
description: check all version number props and update them
argument-hint: [version number]
# allowed-tools:
# model:
disable-model-invocation: false
---

# Version Checker

Check the following properties and update the value denoted by `this` to $ARGUMENTS (coercing type if necessary)

## package.json

- `"version": "this"`

## src-tauri/tauri.conf.json

- `"version": "this"`

## src-tauri/Cargo.toml

- `[package] name = "app" version = "this"`

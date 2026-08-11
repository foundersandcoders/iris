# Scripts

Automation scripts for development and release management.

## Testing: two runners, not one

`bun test` and `vitest` split the suite by directory, not by convention alone:

- `bunfig.toml` scopes `bun test` to `root = "tests/lib"`. Everything under `tests/tui/**` is vitest-authored (`vi.mock`, `importOriginal`), which Bun's runner has no equivalent for.
- **Never run `bun test tests/tui/...` with an explicit path.** An explicit path argument overrides `bunfig.toml`'s `root`, so Bun loads a vitest file anyway, and hangs rather than erroring (the vitest package loads bare, without the orchestrator handshake its worker expects).
- For a single TUI/component file: `bunx vitest run tests/tui/screens/mapping-editor.test.ts`.
- For all TUI/component tests: `bun run test:tui` (`vitest run tests/tui`).
- For the true full suite: `bun run test:all` (`test:core` + `test:svelte`, i.e. both runners, each scoped to what it owns).

## Version Management

### `update-version.ts`

Updates version across all project files from a single source of truth.

**Usage:**
```bash
# Manual version
bun run version:set 1.5.0

# Auto-detect from conventional commits (recommended)
bun run version:next

# Force specific bump type
bun run version:patch   # 1.4.0 -> 1.4.1
bun run version:minor   # 1.4.0 -> 1.5.0
bun run version:major   # 1.4.0 -> 2.0.0
```

**Files updated:**
- `package.json` - Source of truth
- `src-tauri/Cargo.toml` - Rust package version
- `src-tauri/tauri.conf.json` - Tauri app version
- `README.md` - Documentation header

**Files that auto-sync at runtime:**
- `src/lib/types/config.ts` - Imports from package.json
- `src/tui/utils/layout.ts` - Imports from package.json

**Validation:**
- Ensures semantic version format (X.Y.Z)
- Exits with error if format is invalid

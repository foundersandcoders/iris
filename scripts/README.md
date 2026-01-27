# Scripts

Automation scripts for development and release management.

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

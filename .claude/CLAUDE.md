# Iris

## Project Context

Iris is an ILR (Individualised Learner Record) toolkit that replaces Founders and Coders' existing Electron-based export tool. It converts learner data from CSV exports into ILR-compliant XML for ESFA submission, with explicit validation and transformation logic.

Key features:
- Header-based CSV parsing (tolerates column reordering)
- Semantic validation (beyond structural XML validation)
- Cross-submission consistency checking
- Dual interface: CLI for automation, desktop app for non-technical users
- Shared processing core ensures identical logic across both interfaces

## Tech Stack

- **Runtime:** Bun
- **Desktop Framework:** Tauri (Rust backend, no Rust code written)
- **Frontend:** SvelteKit with TypeScript
- **CLI:** TypeScript with bun runtime
- **Storage:** File-based (local filesystem, no database)
- **XML Generation:** Native TypeScript (no external XML libraries yet)

## Development Conventions

- **Package manager:** bun
- **Testing framework:** Vitest
- **Commit convention:** Conventional Commits with KSB extraction
- **Versioning:** Semantic versioning via `svu`

## Database

No database. File-based storage for:
- ILR XML outputs (saved to `~/.iris/submissions/`)
- Cross-submission history for validation
- User preferences and configuration

## Key Commands

```bash
# Development
bun install              # Install dependencies
bun dev                  # Run SvelteKit dev server
bun tauri dev            # Run Tauri desktop app in dev mode
bun run cli              # Run CLI tool locally
iris                     # Run globally installed CLI (after bun link)

# Building
bun tauri build          # Build desktop app (.app bundle for macOS)
bun run build            # Build SvelteKit for production

# Testing
bun test                 # Run Vitest tests
bun test:watch          # Run tests in watch mode

# CLI Global Install
bun link                 # Link for local development (iris command available)
bun install -g .         # Install globally from project
```

## Project Structure

```
iris/
├── src/
│   ├── lib/               # Shared core logic (used by both CLI and desktop)
│   │   ├── parser.ts      # CSV parsing with header-based matching
│   │   ├── validator.ts   # Semantic validation logic
│   │   ├── generator.ts   # ILR XML generation
│   │   └── storage.ts     # Filesystem abstraction for cross-submission data
│   ├── cli.ts             # CLI entry point (bun runtime)
│   └── routes/            # SvelteKit routes (desktop UI)
│       ├── +page.svelte   # Main desktop interface
│       └── api/           # Server endpoints (if needed)
├── src-tauri/             # Tauri Rust backend (generated, rarely touched)
│   ├── Cargo.toml         # Rust dependencies
│   ├── tauri.conf.json    # Tauri app configuration
│   └── src/main.rs        # Rust entry point (boilerplate)
├── docs/                  # Documentation
│   ├── roadmaps/          # Project roadmaps
│   ├── work-records/      # Development journal
│   ├── adrs/              # Architecture decisions
│   └── technical/         # Technical docs (ILR spec, validation rules)
├── tests/                 # Vitest test files
└── .claude/               # Claude Code configuration
```

## Development Workflow

1. **Start work:** Check current roadmap milestone
2. **During development:** Commit with conventional format
3. **Evidence tracking:** Automatic via `post-commit` hook
4. **Documentation:** Update work records regularly
5. **Testing:** Run tests before pushing (enforced by `pre-push` hook)

## Portfolio Evidence

This project uses automated evidence tracking via git hooks. Every commit with KSB-relevant work is automatically analyzed and added to `~/.claude/docs/evidence-tracker.md`.

## Getting Help

- **Claude Code:** Use `/project/init` to reconfigure
- **Roadmaps:** See `docs/roadmaps/mvp.md`
- **Architecture:** See `docs/adrs/`
- **Technical details:** See `docs/technical/`

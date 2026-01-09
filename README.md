# Iris

**ILR toolkit for apprenticeship data submission**

Iris converts learner data from CSV exports into ILR-compliant XML for ESFA submission, with explicit validation and cross-submission consistency checking.

## What It Does

- Parses CSV exports using header-based matching (tolerates column reordering)
- Generates ILR-compliant XML for ESFA submission
- Semantic validation beyond structural XML checks
- Cross-submission consistency checking using historical data
- Dual interface: CLI for automation, native desktop app for non-technical users

## Quick Start

```bash
# Install dependencies
bun install

# Run CLI locally
bun run src/cli.ts

# Link CLI globally
bun link
iris --help

# Run desktop app in development
bun tauri dev

# Run tests
bun test
```

## Architecture

Built on a shared TypeScript core with two interfaces:

- **CLI**: Bun runtime, direct filesystem access
- **Desktop**: Tauri + SvelteKit, native macOS app

Both interfaces use identical transformation and validation logic from `src/lib/`.

See [docs/proposal.md](docs/proposal.md) for detailed context.

## Project Structure

```
iris/
├── src/
│   ├── lib/           # Shared core (parser, validator, generator, storage)
│   ├── cli.ts         # CLI entry point
│   └── routes/        # SvelteKit desktop UI
├── src-tauri/         # Tauri Rust backend (generated)
├── docs/              # Documentation, roadmaps, ADRs
└── tests/             # Vitest tests
```

## Development

See [.claude/CLAUDE.md](.claude/CLAUDE.md) for detailed development conventions and commands.

## License

MIT

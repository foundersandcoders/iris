# Repository Guidelines

## Project Structure & Module Organization
- `src/lib/`: shared core (parser, validator, generator, storage) used by all interfaces.
- `src/tui/`: terminal UI screens, components, and workflows.
- `src/commands/`: direct command implementations for scripting.
- `src/routes/`: SvelteKit desktop UI routes.
- `src/cli.ts`: entry point that routes to the TUI or commands.
- `src-tauri/`: Tauri Rust backend for the desktop app.
- `tests/`: Vitest test suites and fixtures (see `tests/fixtures/`).
- `docs/`: ADRs, technical notes, and schemas.

## Build, Test, and Development Commands
- `bun install`: install dependencies.
- `bun run src/cli.ts`: run the TUI locally without linking.
- `bun link` then `iris`: link and launch the TUI globally.
- `bun run dev`: start the SvelteKit dev server (desktop UI).
- `bun run build`: build the SvelteKit frontend.
- `bun test`: run the Vitest suite once.
- `bun run test:watch`: run tests in watch mode.
- `bun run tauri:dev`: run the desktop app via Tauri.
- `bun run tauri:build`: build the desktop app bundle.

## Coding Style & Naming Conventions
- Formatting is enforced by Prettier (`.prettierrc`): tabs for indentation, single quotes, trailing commas (es5), print width 100.
- TypeScript is the primary language; keep modules small and focused.
- Test files use `*.test.ts` naming under `tests/`.
- Favor descriptive names aligned with domain language (e.g., `validator`, `schema`, `workflow`).

## Testing Guidelines
- Framework: Vitest.
- Place unit tests under `tests/lib/` and TUI tests under `tests/tui/`.
- Use fixtures from `tests/fixtures/` to keep test data consistent.
- Run targeted tests with `bun test tests/lib/parser.test.ts`.

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commits, as seen in history (e.g., `fix(tui): use calculated y instead of fixed value`).
- Keep commits scoped and intentional; include a brief rationale in the PR description.
- PRs should include: summary, testing notes, and screenshots for UI changes (TUI or desktop).
- Link related issues or ADRs when applicable.

## Configuration & References
- Primary config files: `svelte.config.js`, `vite.config.ts`, `tsconfig.json`.
- Architecture background: `docs/adrs/` and `docs/technical/`.

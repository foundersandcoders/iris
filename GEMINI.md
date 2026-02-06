# GEMINI.md

## Project Overview

This project, "iris," is an ILR (Individualised Learner Record) toolkit that replaces Founders and Coders' existing Electron-based export tool. Its primary function is to convert learner data from CSV exports into ILR-compliant XML suitable for submission to the ESFA (Education and Skills Funding Agency).

The project is built with a **TUI-first** philosophy, meaning the primary interface is a beautiful, full-screen interactive terminal application. This is complemented by scriptable direct commands for automation and a cross-platform desktop GUI for users who prefer it.

All interfaces are powered by a shared core TypeScript library, ensuring that all transformation, validation, and business logic is consistent across the TUI, CLI, and desktop app.

## Tech Stack

- **Runtime:** Bun
- **TUI Framework:** @opentui/core
- **Desktop Framework:** Tauri (with a Rust backend that requires no custom Rust code)
- **Frontend:** SvelteKit with TypeScript
- **Testing:** Vitest
- **Storage:** File-based (local filesystem, no database)
- **XML Generation:** Native TypeScript

## Architecture

The architecture is centered around a shared core library in `src/lib/` which handles all business logic (parsing, validation, generation, storage). This ensures consistency and avoids logic duplication.

As detailed in **ADR 002**, Iris follows a **TUI-First Interface Design**.
1.  **Primary Interface (TUI):** The default command (`iris`) launches a full-screen, interactive terminal application. This is the main UX for all users.
2.  **Automation Layer (Direct Commands):** Commands like `iris convert <file>` can be run directly from the shell for scripting and automation, providing pretty output without launching the TUI.
3.  **Secondary Interface (Desktop GUI):** A Tauri-based desktop app provides a familiar GUI experience, but its development follows the TUI.

This approach was chosen over a simple CLI or a GUI-first model to provide a rich, keyboard-centric user experience that is both powerful for technical users and discoverable for non-technical users, while being easier to distribute than a traditional desktop application.

## Key Commands

- **Install Dependencies:**
  ```bash
  bun install
  ```

- **Run the TUI (development):**
  ```bash
  bun run src/cli.ts
  # Or, after linking:
  iris
  ```

- **Run Direct Commands:**
  ```bash
  iris convert file.csv
  iris validate file.xml
  ```

- **Run Tests:**
  ```bash
  bun test
  ```

- **Run the Desktop App (Development Mode):**
  ```bash
  bun tauri dev
  ```

- **Build the Desktop App (Production):**
  ```bash
  bun tauri build
  ```

- **Link for global development access:**
  ```bash
  bun link
  ```

## Development Conventions

### Code Editing Preference
**IMPORTANT:** Do not edit files directly unless explicitly asked. Instead:
1. Show the proposed code to the user.
2. Wait for the user to make the edit themselves or explicitly approve the change.

### Git Workflow

- **Branch Naming:** ` <prefix>/<short-description>` (e.g., `feat/add-validation-rules`). Prefixes include `feat/`, `fix/`, `enhance/`, `refactor/`, `test/`, `docs/`, `config/`.
- **Granularity:** Branches and commits should represent minimal, tangible improvements. A single feature on the roadmap is often broken into many small, merge-ready branches.
- **Verification:** Never commit code that hasn't been verified to work. Run tests (`bun test`) or verify functionality manually before every commit.

### Versioning

- **Conventional Commits:** The project uses conventional commits for automatic semantic versioning via `svu`.
  - `fix:` bumps the patch version.
  - `feat:` bumps the minor version.
  - `feat!:` or a `BREAKING CHANGE` footer bumps the major version.
- **Process:** After merging to main, use `svu next` to determine the next version and `git tag` to apply it.

### Testing Conventions

- **Fixtures Pattern:** Test data is kept separate from test logic. For a module like `parser.ts`, test data lives in `tests/fixtures/parser.ts` and is imported using `import * as fixtures from '../fixtures/parser'`. This improves readability and reusability.

### Storage & Evidence
- **File-based Storage:** No database. Data is stored in `~/.iris/` (e.g., `~/.iris/submissions/`).
- **Portfolio Evidence:** Every commit with KSB-relevant work is automatically tracked via git hooks in `.claude/docs/evidence-tracker.md`.

## Project Structure

```
iris/
├── src/
│   ├── lib/           # Shared core logic (parser, validator, generator, storage)
│   ├── tui/           # TUI interface (screens, components, workflows)
│   ├── commands/      # Direct command implementations (non-TUI)
│   ├── cli.ts         # Entry point (routes to TUI or commands)
│   └── routes/        # SvelteKit desktop UI
├── src-tauri/         # Tauri Rust backend (mostly auto-generated)
├── docs/              # Documentation, roadmaps, ADRs, technical specs
│   ├── adrs/
│   ├── dev-log/
│   └── roadmaps/
├── tests/
│   ├── fixtures/      # Shared test data for different modules
│   └── lib/           # Unit tests for the core library
└── .claude/           # Internal configuration for the AI assistant
```

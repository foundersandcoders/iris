# Iris `v5.7.0`

**ILR toolkit for apprenticeship data submission**

Iris converts learner data from CSV exports into ILR-compliant XML for ESFA submission, with explicit validation and cross-submission consistency checking.

> [!NOTE]
> **Links**
> - [Roadmap](docs/roadmaps/mvp.md)

## What Iris Does

- Full-screen interactive terminal interface (primary UX)
- Parses CSV exports using header-based matching (tolerates column reordering)
- Generates ILR-compliant XML for ESFA submission
- Interactive error exploration and validation workflows
- Semantic validation beyond structural XML checks
- Cross-submission consistency checking using historical data
- Direct commands for automation and scripting
- Desktop app for users who prefer GUI

## Quick Start

```bash
# Install dependencies
bun install

# Run TUI locally
bun run src/cli.ts

# Link globally and use TUI
bun link
iris                      # Launch full-screen TUI

# Direct command invocation (not yet implemented)
iris convert file.csv     # Direct command (scriptable)
iris --help

# Run tests
bun test

# Desktop app
bun tauri dev
```

## Iris' Architecture

Built on a shared TypeScript core with multiple interfaces:

- **TUI** (primary): @opentui/core, full-screen interactive interface
- **Direct Commands**: Scriptable automation with beautiful output
- **Desktop**: Tauri + SvelteKit, cross-platform native app (macOS, Windows, Linux)

All interfaces use identical transformation and validation logic from `src/lib/`.

See [docs/adrs/](docs/adrs/) for architectural decisions and [docs/technical/tui-ux-design.md](docs/technical/tui-ux-design.md) for TUI design details.

## Project Structure

```
iris/
├── src/
│   ├── lib/           # Shared core (parser, validator, generator, storage)
│   ├── tui/           # TUI interface (screens, components, workflows)
│   ├── commands/      # Direct command implementations
│   ├── cli.ts         # Entry point (routes to TUI or commands)
│   └── routes/        # SvelteKit desktop UI
├── src-tauri/         # Tauri Rust backend
├── docs/              # Documentation, roadmaps, ADRs, technical specs
└── tests/             # Vitest tests
```

---

## Development

See [.claude/CLAUDE.md](.claude/CLAUDE.md) for detailed development conventions and commands. Primary runtime/tooling and test commands are exposed in [package.json](package.json) scripts.

### Demo recordings

![Hello, Iris](docs/assets/hello.gif)

Terminal recordings for the README and docs are scripted with [Charm VHS](https://github.com/charmbracelet/vhs). Tapes live in `tapes/` and share settings from `tapes/_common.tape` (dimensions, font, and a theme mirroring Iris' brand palette).

#### Workflows

A walkthrough of each recording, with fuller commentary, lives in [docs/tutorials/workflows.md](docs/tutorials/workflows.md).

**Convert** — CSV to ILR XML

![Convert workflow](docs/assets/convert.gif)

**Validate** — check a submitted XML file

![Validate workflow](docs/assets/validate.gif)

**Cross-Submission Check** — compare current against previous

![Cross-submission check workflow](docs/assets/check.gif)

**Mapping Builder** — browse and duplicate CSV→XSD mappings

![Mapping builder workflow](docs/assets/mapping-builder.gif)

**Prerequisites** (macOS/Homebrew):

```bash
brew install vhs ttyd ffmpeg
bun link
```

See the [VHS repo](https://github.com/charmbracelet/vhs) for other platforms. `bun link` puts the `iris` command on `PATH` — the tapes launch the app the same way a real user would, not via `bun run cli`.

**Regenerate all recordings:**

```bash
bun run demos
```

This renders every `tapes/*.tape` file (skipping shared includes prefixed with `_`) into `docs/assets/`. The recording font (Fira Code) is bundled at `assets/fonts/` and installed automatically on first run.

---

## Resources

- [MVP Roadmap](docs/roadmaps/mvp.md)
- [Architectural Decision Records](docs/adrs/)
- [TUI UX Design](docs/technical/tui-ux-design.md)
- [Work Records & Dev Log](docs/dev-log/work-records/)
- [Tests and Fixtures](tests/)
- [ESFA ILR Schema (Included)](docs/schemas/schemafile25.xsd)

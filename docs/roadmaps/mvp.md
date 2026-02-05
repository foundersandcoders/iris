# Iris: MVP Roadmap

> [!IMPORTANT]
> This roadmap has been restructured into three phases for better clarity and granularity.

---

## Current Roadmap Structure

The MVP development has been split into three distinct phases:

### [Phase 1: MVP Features](./phase-1-mvp-features.md)
**Core functionality for terminal users**

- **M2A:** OpenTUI Migration + Core TUI Screens (migrate terminal-kit → OpenTUI, then keyboard nav, workflows, validation explorer)
- **M2B:** Direct Commands (`iris convert`, `iris validate`, `iris check`)
- **M2C:** Advanced TUI + Polish + Docs (mapping builder, schema mgmt, settings, user guide)

**Status:** In progress (M2A — OpenTUI migration is the next task)

---

### [Phase 2: Production Features](./phase-2-production-features.md)
**Complete CLI and desktop application**

- **M3:** CLI Completion (help system, automation testing, interactive flag)
- **M4:** Desktop Interface (Tauri GUI with all workflows)
- **M5:** Production Docs (ILR XML docs, transformation reference)

**Status:** Blocked (awaiting Phase 1 completion)

---

### [Phase 3: Future Features](./phase-3-future-features.md)
**Exploratory enhancements beyond MVP**

- Post-submission error prediction
- Cross-submission analysis
- Declarative transformation layer
- Enhanced validation
- Multi-provider support
- Schema diff viewer and migration suggestions

**Status:** Exploratory (no concrete tasks yet)

---

## Quick Navigation

| Phase | Milestone | Focus | Link |
|-------|-----------|-------|------|
| **1** | M2A | OpenTUI Migration + Core TUI Screens | [Phase 1](./phase-1-mvp-features.md#m2a-core-tui-screens) |
| **1** | M2B | Direct Commands | [Phase 1](./phase-1-mvp-features.md#m2b-direct-commands) |
| **1** | M2C | Advanced TUI + Docs | [Phase 1](./phase-1-mvp-features.md#m2c-advanced-tui--polish--docs) |
| **2** | M3 | CLI Completion | [Phase 2](./phase-2-production-features.md#m3-cli-completion) |
| **2** | M4 | Desktop Interface | [Phase 2](./phase-2-production-features.md#m4-desktop-interface) |
| **2** | M5 | Production Docs | [Phase 2](./phase-2-production-features.md#m5-production-ready) |
| **3** | — | Future Features | [Phase 3](./phase-3-future-features.md) |

---

## Archive

The original combined roadmap (pre-restructure) has been archived at:
[`docs/archive/mvp-original.md`](../archive/mvp-original.md)

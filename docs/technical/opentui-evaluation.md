# OpenTUI Evaluation Report

**Date:** 2026-02-05
**Purpose:** Evaluate OpenTUI as a replacement for terminal-kit in Iris's TUI
**Context:** Alpha/pre-release tooling is acceptable for this project

---

## Executive Summary

**Verdict: Adopt OpenTUI. Migrate now.**

OpenTUI is a modern, Zig-powered, TypeScript-first TUI framework with Yoga flexbox layout, rich built-in components, and sub-millisecond rendering. It is pre-1.0 (v0.1.77) but battle-tested in real products (OpenCode, terminal.shop), actively maintained (627 commits, 65+ contributors, last release 3 days ago), and aligns perfectly with Iris's stack (Bun, TypeScript).

The current TUI is only 971 lines across 3 screens with 5 empty component stubs — this is the ideal moment to migrate before investing further in terminal-kit's manual positioning model. OpenTUI eliminates every current pain point and provides out-of-the-box everything Iris was planning to build by hand.

---

## 1. What Is OpenTUI?

- **TypeScript library** for building terminal UIs
- Created by the team behind **SST** (Serverless Stack)
- Powers **OpenCode** (AI coding assistant) and **terminaldotshop**
- Monorepo with three core packages:
  - `@opentui/core` — standalone imperative API with all primitives
  - `@opentui/react` — React reconciler
  - `@opentui/solid` — SolidJS reconciler

### Key Stats

| Metric | Value |
|--------|-------|
| GitHub stars | ~8,300 |
| npm weekly downloads | ~31,000 |
| Latest release | v0.1.77 (Feb 2, 2026) |
| Total commits | 627 |
| Contributors | 65+ |
| Open issues | 52 |
| License | MIT |

### Who's Using It

- **OpenCode** — full AI coding assistant TUI (migrated from Go/Bubble Tea specifically because of performance issues with the old stack)
- **terminal.shop** — e-commerce terminal interface
- 31k weekly npm downloads indicates meaningful adoption beyond these flagship apps

---

## 2. Technical Architecture

### Rendering Engine (Zig)

The critical differentiator. OpenTUI uses **Zig** for performance-critical native modules:
- Terminal rendering and text buffers
- Layout calculations
- Frame diffing (compares only changed cells)
- ANSI generation with run-length encoding

Result: **sub-millisecond frame times, 60+ FPS** for complex UIs.

Pre-compiled platform binaries ship for darwin-x64, darwin-arm64, linux-x64, linux-arm64, win32-x64, win32-arm64. Loaded at runtime via `Bun.dlopen()` — no Zig needed to consume the library.

### Layout System (Yoga/Flexbox)

Uses Facebook's **Yoga** layout engine (same as React Native). Every `Renderable` has a `yogaNode`:

```typescript
const container = new GroupRenderable(renderer, {
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  padding: 2,
  gap: 1,
});
```

This replaces all manual `term.moveTo(x, y)` positioning. Responsive layouts, automatic resize handling, and nested containers become trivial.

### Component System

Built-in components cover all of Iris's needs:

| Component | Iris Use Case |
|-----------|--------------|
| **Text** | Styled labels, status messages, headers |
| **Box** | Bordered panels, cards, sections |
| **ScrollBox** | File lists, validation error lists |
| **Input** | Future: search/filter, settings fields |
| **Select** | Dashboard menu, file picker, option lists |
| **TabSelect** | Future: tabbed views (validation categories) |
| **ASCIIFont** | Beautiful header/logo rendering |
| **Code** | Future: XML preview with syntax highlighting |
| **Diff** | Future: cross-submission comparison |

### Keyboard & Focus Management

Built-in focus system routes input to the active component:

```typescript
renderer.keyInput.on('keypress', (key: KeyEvent) => {
  if (key.ctrl && key.name === 'c') { /* exit */ }
});
selectMenu.focus(); // this component now receives key events
```

Eliminates Iris's current pattern of manual `term.on('key')` / `term.removeAllListeners('key')` per screen.

### Animation & Spinners

- Timeline API for smooth terminal animations
- `opentui-spinner` provides 80+ spinner animations with dynamic color effects (pulse, wave)
- Replaces `ora` dependency

### Debugging

Built-in console overlay captures `console.log/warn/error` and displays as a toggleable overlay positioned at any terminal edge. No need to pipe to a separate terminal during development.

---

## 3. Ecosystem

| Package | Purpose | Maturity |
|---------|---------|----------|
| `@opentui/core` | Core library, all primitives | Active, v0.1.77 |
| `@opentui/react` | React reconciler | Active |
| `@opentui/solid` | SolidJS reconciler | Active |
| `opentui-spinner` | 80+ animated spinners | Stable |
| `opentui-ui` | Dialog, Toast components | Early (v0.0.2) |
| `opentui-skill` | AI coding assistant docs | Available |
| `create-tui` | Project scaffolding | Available |

---

## 4. What Iris Gains

### Pain Points Eliminated

| Current Problem | OpenTUI Solution |
|----------------|------------------|
| Manual `term.moveTo(x, y)` positioning | Yoga flexbox layout |
| Resize handling TODO (unfixed) | Automatic — Yoga recalculates on resize |
| 5 empty component stubs to build | Built-in Select, Input, Box, ScrollBox, etc. |
| Manual scroll offset tracking | ScrollBox handles scrolling |
| Manual key listener attach/detach per screen | Focus system routes input automatically |
| Full-screen redraw on every state change | Retained mode — only changed cells update |
| Double async generator workaround | Property-update triggers automatic re-render |
| No animation system (stub) | Timeline API + opentui-spinner |
| No keyboard utilities (stub) | Built-in KeyEvent system with modifiers |

### Code Reduction

**Dashboard screen example:**
- terminal-kit: ~80 lines (manual index, scroll, positioning, highlight, cleanup)
- OpenTUI: ~40 lines (SelectRenderable + flexbox + event handler)

Roughly **50% less code** per screen, with more features (resize, scrolling, focus management) included automatically.

### Dependencies Eliminated

Migrating drops **5 dependencies** from the TUI stack:

| Drop | Replaced By |
|------|------------|
| `terminal-kit` | `@opentui/core` |
| `ora` | `opentui-spinner` |
| `boxen` | `BoxRenderable` |
| `cli-table3` | Flexbox layout + Text |
| `figures` | Unicode chars in TextRenderable |

**Keep** for non-TUI direct commands: `chalk`, `consola`, `listr2`, `gradient-string`

---

## 5. Migration Plan

### Scope

The current TUI is small — ideal migration target:
- 971 lines across 16 files
- 3 implemented screens (Dashboard, FilePicker, Processing)
- 2 utilities (Router, Layout)
- 1 theme file
- 5 empty component stubs (delete, not migrate)
- 4 empty utility stubs (delete, not migrate)

A detailed migration guide already exists at `docs/technical/opentui-migration-guide.md` with line-by-line code mappings.

### Phase 1: Foundation (Small effort)

| Task | Detail |
|------|--------|
| Install `@opentui/core` | `bun add @opentui/core` |
| Install `opentui-spinner` | `bun add opentui-spinner` |
| Install AI skill | `npx skills add msmps/opentui-skill` |
| Rewrite `app.ts` | `createCliRenderer()` replaces terminal-kit bootstrap |
| Adapt `theme.ts` | Hex strings work directly; optionally add RGBA helpers |
| Adapt `router.ts` | Stack logic stays, screen interface signature changes |
| Delete `layout.ts` | Yoga replaces manual header/status bar |
| Delete all empty stubs | 9 empty files removed |

### Phase 2: Screen Migration (Medium effort per screen)

| Screen | Key Changes |
|--------|------------|
| **Dashboard** | Menu → `SelectRenderable`, layout → flexbox, gradient header → `ASCIIFontRenderable` |
| **FilePicker** | File list → `SelectRenderable` + `ScrollBox`, path breadcrumb → `TextRenderable` |
| **Processing** | Step display → property-update model (no manual redraw), spinner → `opentui-spinner` |

### Phase 3: Cleanup

- Remove `terminal-kit`, `ora`, `boxen`, `cli-table3`, `figures` from dependencies
- Update test fixtures (mock renderer interface changes)
- Verify on target terminal environments

### New Screens (Built on OpenTUI from scratch)

The 2 stub screens that were never implemented become easier to build:

| Screen | OpenTUI Advantage |
|--------|------------------|
| **Validation** | `ScrollBox` for error list, `Code` for XML preview, `TabSelect` for error categories |
| **Success** | `Box` for summary card, `ASCIIFont` for completion banner |

---

## 6. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| API breaking changes in 0.1.x | **Medium** | Pin exact version; TUI is small so rework is bounded; active project means fixes come fast |
| Undiscovered bugs | **Medium** | Battle-tested in OpenCode/terminal.shop; 31k weekly downloads surface issues; Iris TUI is simple compared to those apps |
| Zig needed for contributing upstream | **Low** | Pre-built binaries cover runtime; only matters if we need to patch OpenTUI itself |
| Terminal compatibility (OSC 66) | **Low** | Test on target environments; most modern terminals supported |
| `console.log` interception | **Low** | Use the built-in console overlay; or configure to pass through |
| Community size | **Low** | AI skill fills the gap; SST team is responsive; codebase is well-documented TypeScript |

### Why the Alpha Risk Is Acceptable

1. **Real products depend on it** — OpenCode and terminal.shop run on OpenTUI in production
2. **Active development** — 627 commits, release 3 days ago, 65+ contributors
3. **Iris's TUI is not the critical path** — the core logic (parser, validator, generator) is independent; TUI is a presentation layer that can be swapped
4. **Small surface area** — 3 screens, ~1000 lines; worst case, a breaking change means a bounded rewrite
5. **The alternative is worse** — continuing to build on terminal-kit means hand-building components that OpenTUI provides for free, with manual positioning that Yoga eliminates

---

## 7. Implementation Recommendations

### Version Pinning

```jsonc
// package.json — pin exact version to control when you upgrade
"@opentui/core": "0.1.77",
"opentui-spinner": "0.0.8"  // or current version
```

### Upgrade Strategy

- Pin to exact versions (no `^` or `~`)
- Upgrade deliberately, one version at a time
- Test after each upgrade before committing
- Subscribe to releases: `gh api repos/sst/opentui/releases --jq '.[0].tag_name'`

### Development Tooling

- Install the AI skill: `npx skills add msmps/opentui-skill` — provides Claude Code with component decision trees and troubleshooting guides
- Use `bun create tui` to scaffold a throwaway prototype for learning
- OpenTUI's built-in console overlay replaces `console.log` debugging

### Architecture Decision

Use **`@opentui/core` directly** (imperative API), not the React or Solid reconcilers:
- Iris's TUI is simple enough that a declarative framework adds complexity without benefit
- Imperative API maps most closely to the existing screen-based architecture
- Avoids adding React/Solid as dependencies for a CLI tool
- Can always adopt a reconciler later if complexity warrants it

---

## Sources

- [OpenTUI GitHub Repository](https://github.com/anomalyco/opentui) — 8.3k stars, MIT license
- [OpenTUI npm Package](https://www.npmjs.com/package/@opentui/core) — 31k weekly downloads
- [OpenTUI Skill](https://github.com/msmps/opentui-skill) — AI coding assistant reference docs
- [OpenTUI UI Components](https://github.com/msmps/opentui-ui) — Dialog, Toast components
- [OpenTUI Spinner](https://github.com/msmps/opentui-spinner) — 80+ spinner animations
- [OpenTUI Multi-frontend Analysis](https://refft.com/en/sst_opentui.html) — Framework comparison
- [OpenCode TUI Migration Context](https://grokipedia.com/page/OpenTUI) — Bubble Tea → OpenTUI migration

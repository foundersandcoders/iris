# OpenTUI Evaluation Report

**Date:** 2026-02-05
**Purpose:** Evaluate OpenTUI as a replacement for terminal-kit in Iris's TUI

---

## Executive Summary

OpenTUI is a compelling, modern TUI framework with strong technical foundations (Zig rendering, Yoga layout, TypeScript-first). It aligns well with Iris's stack (Bun, TypeScript) and would be a significant upgrade over terminal-kit's low-level imperative API. However, **it is explicitly not production-ready** (per the maintainers themselves), which is the primary blocker for immediate adoption.

**Recommendation:** Strong candidate for migration, but **wait for a stable release** (v1.0 or an explicit "production-ready" declaration). Monitor the project closely. The existing migration guide (`opentui-migration-guide.md`) is already well-prepared for when that time comes.

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

---

## 2. Technical Architecture

### Rendering Engine (Zig)

The critical differentiator. OpenTUI uses **Zig** for performance-critical native modules:
- Terminal rendering
- Text buffers
- Layout calculations
- Frame diffing (compares only changed cells)
- ANSI generation with run-length encoding

Result: **sub-millisecond frame times, 60+ FPS** for complex UIs.

At runtime, `@opentui/core` loads the appropriate platform binary via `Bun.dlopen()`. Pre-compiled binaries exist for darwin-x64, darwin-arm64, linux-x64, linux-arm64, win32-x64, win32-arm64.

### Layout System (Yoga/Flexbox)

Uses Facebook's **Yoga** layout engine — the same flexbox implementation used by React Native. Every `Renderable` has a `yogaNode` for CSS-like positioning:

```typescript
const container = new GroupRenderable(renderer, {
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  padding: 2,
  gap: 1,
});
```

This is a massive improvement over terminal-kit's manual `term.moveTo(x, y)` positioning. Responsive layouts, automatic resize handling, and nested containers become trivial.

### Component System

Built-in components:
- **Text** — styled text with attributes (bold, italic, underline, etc.)
- **Box** — bordered containers with backgrounds
- **ScrollBox** — scrollable content areas
- **Input** — text input fields with focus management
- **TextArea** — multi-line text input
- **Select** — selection menus with keyboard navigation
- **TabSelect** — tab-style selection
- **ASCIIFont** — large text rendering with ASCII art fonts
- **Code** — syntax-highlighted code blocks (tree-sitter integration)
- **LineNumber** — line-numbered display
- **Diff** — diff rendering

### Keyboard & Focus Management

Built-in focus system. Components must be focused to receive input:

```typescript
renderer.keyInput.on('keypress', (key: KeyEvent) => {
  if (key.ctrl && key.name === 'c') { /* ... */ }
});
selectMenu.focus();
```

### Animation System

Timeline API for smooth terminal animations. The spinner library (`opentui-spinner`) provides 80+ pre-configured animations with color pulse/wave effects.

### Debugging

Built-in console overlay that captures all `console.log/warn/error` calls and displays them as a toggleable overlay — no need to pipe to a separate terminal.

---

## 3. Ecosystem Assessment

### Core Library (`@opentui/core`)
- **Maturity:** Pre-1.0, rapidly iterating (v0.1.77)
- **Quality:** High. Powers production apps (OpenCode, terminal.shop)
- **API stability:** Changing. Expect breaking changes between minor versions

### Component Library (`@opentui-ui`)
- **Packages:** Dialog, Toast (only 2 so far)
- **Maturity:** Very early (v0.0.2)
- **Useful but thin** — most components are in core already

### Spinner Library (`opentui-spinner`)
- **80+ spinner animations** from cli-spinners
- Dynamic color effects (pulse, wave)
- Works with core, React, and Solid
- Would replace Iris's current `ora` dependency

### AI Coding Skill (`opentui-skill`)
- Reference documentation packaged for Claude Code, Cursor, Copilot, etc.
- Decision trees for framework selection, component choice, troubleshooting
- Useful for development assistance during migration

### Scaffolding (`create-tui`)
- `bun create tui` — project templates for Core, React, and Solid

---

## 4. Fit Assessment for Iris

### Strong Alignment

| Iris Need | OpenTUI Solution |
|-----------|------------------|
| **Bun runtime** | OpenTUI is built for Bun (uses `Bun.dlopen()`) |
| **TypeScript** | TypeScript-first with excellent type safety |
| **Full-screen TUI** | `createCliRenderer()` handles fullscreen lifecycle |
| **Menu navigation** | `SelectRenderable` with built-in keyboard nav |
| **File browser** | `SelectRenderable` + `ScrollBox` for scrollable lists |
| **Progress display** | Property updates auto-trigger re-render |
| **Beautiful output** | Yoga layout, borders, colors, ASCII fonts, animations |
| **Responsive layout** | Flexbox handles terminal resize automatically |
| **Theme system** | `RGBA` class + hex string support maps directly to existing theme |

### Current Pain Points It Would Solve

1. **Manual positioning** (`term.moveTo`) → Flexbox layout
2. **No resize handling** (TODO in app.ts) → Yoga recalculates automatically
3. **Empty component stubs** → Built-in components (Select, Input, Box, etc.)
4. **Manual scroll tracking** → ScrollBox handles it
5. **Listener cleanup discipline** → Focus system manages input routing
6. **Double generator call workaround** → Property-update re-rendering eliminates manual redraw

### Concerns

| Concern | Severity | Detail |
|---------|----------|--------|
| **Not production-ready** | **High** | Maintainers explicitly state this in README and npm |
| **Pre-1.0 versioning** | **High** | v0.1.x — API will change, migrations may be needed |
| **Zig build dependency** | **Medium** | Contributors/CI need Zig installed (not needed for consumers using pre-built binaries, but development/debugging may require it) |
| **52 open issues** | **Medium** | Active project but unresolved bugs exist |
| **OSC 66 terminal compat** | **Low** | Some terminals show artifacts — test on target environments |
| **`console.log` capture** | **Low** | Built-in console overlay intercepts logs — minor adjustment |
| **No Vue reconciler** | **None** | Iris doesn't use Vue; irrelevant |

---

## 5. Comparison: Current Stack vs OpenTUI

### Code Complexity Comparison

**Dashboard menu (terminal-kit) — ~80 lines:**
- Manual index tracking, scroll offset, key handling
- Explicit `term.moveTo()` for each line
- Manual highlight drawing with `bgColorRgbHex` + `eraseLineAfter`
- Manual listener cleanup

**Dashboard menu (OpenTUI) — ~40 lines:**
- `SelectRenderable` handles selection, scrolling, highlighting
- Flexbox positions everything automatically
- Event-based selection (`ITEM_SELECTED`)
- Focus system manages input routing

### Rendering Model

| Aspect | terminal-kit | OpenTUI |
|--------|-------------|---------|
| Model | Immediate mode (redraw everything) | Retained mode (diff changed cells) |
| Layout | Manual coordinates | Yoga flexbox |
| Resize | Must implement manually | Automatic |
| Performance | Redraws full screen | Sub-ms diff-based updates |
| Components | DIY everything | Rich built-in set |

### Developer Experience

| Aspect | terminal-kit | OpenTUI |
|--------|-------------|---------|
| Types | @types/terminal-kit (community) | First-party TypeScript |
| Docs | Adequate but dated | Modern, with AI skill |
| Learning curve | Low (imperative) | Medium (retained mode + flexbox) |
| Debugging | Print to separate terminal | Built-in console overlay |
| Testing | Mock terminal manually | Testing utilities included |

---

## 6. Migration Effort Estimate

Iris's current TUI is **small** (971 lines, 3 implemented screens), making this an ideal time to migrate — before the codebase grows. The existing `opentui-migration-guide.md` in the repo already provides detailed code mappings.

### What Would Change

| File/Area | Effort | Notes |
|-----------|--------|-------|
| `app.ts` (bootstrap) | Small | `createCliRenderer()` replaces terminal-kit init |
| `theme.ts` | Small | Hex strings work directly; optional RGBA conversion |
| `router.ts` | Small | Stack navigation logic stays, screen interface adapts |
| `layout.ts` | **Removed** | Yoga replaces manual header/status bar positioning |
| `dashboard.ts` | Medium | Rewrite with SelectRenderable + flexbox layout |
| `file-picker.ts` | Medium | Rewrite with SelectRenderable + ScrollBox |
| `processing.ts` | Medium | Rewrite with property-update model |
| Component stubs | **Removed** | OpenTUI built-ins replace planned custom components |
| Dependencies | Small | Remove terminal-kit, ora, boxen, cli-table3; add @opentui/core |

### Dependencies That Could Be Dropped

- `terminal-kit` — replaced entirely by @opentui/core
- `ora` — replaced by opentui-spinner
- `boxen` — replaced by BoxRenderable
- `cli-table3` — replaced by flexbox layout + Text
- `figures` — Unicode symbols can be used directly in TextRenderable

### Dependencies That Would Remain

- `chalk` — still useful for non-TUI output (direct commands)
- `gradient-string` — no OpenTUI equivalent for gradient text (could keep or drop)
- `consola` — still useful for non-TUI logging
- `listr2` — still useful for direct command task lists

---

## 7. Risk Analysis

### If You Migrate Now

**Risks:**
- API breaking changes between 0.1.x versions force rework
- Undiscovered bugs in pre-release software
- Zig dependency complicates CI/CD pipeline
- Community is small (65 contributors) — less Stack Overflow/help available

**Mitigations:**
- Pin to exact version in package.json
- Iris TUI is small — rework effort is bounded
- Pre-built binaries eliminate Zig requirement for most use cases
- AI skill provides excellent reference docs for Claude Code assistance

### If You Wait

**Risks:**
- terminal-kit codebase grows larger, making future migration harder
- Miss out on productivity gains from better components/layout
- May need to build custom components that OpenTUI provides for free

**Mitigations:**
- Current TUI is functional for MVP
- Stub architecture anticipates migration (component slots are empty)
- The migration guide is already written and ready

---

## 8. Recommendation

### Short Term (Now)
**Do not migrate yet.** The "not ready for production use" label is the clearest possible signal from maintainers. Iris is being submitted for ILR compliance — stability matters.

### Medium Term (When OpenTUI reaches v1.0 or drops the warning)
**Migrate.** The alignment is strong:
- Bun-native, TypeScript-first
- Solves every current pain point
- Component library covers all Iris needs
- Small codebase = low migration cost
- Migration guide already exists in the repo

### What to Do Now
1. **Install the AI skill** for future development assistance: `npx skills add msmps/opentui-skill`
2. **Star/watch the repo** for release notifications
3. **Prototype optionally** — build one screen in OpenTUI to validate the migration guide
4. **Continue building** on terminal-kit for the MVP; avoid over-investing in custom components that OpenTUI provides out of the box
5. **Keep the migration guide updated** as OpenTUI's API evolves

---

## Sources

- [OpenTUI GitHub Repository](https://github.com/anomalyco/opentui) — 8.3k stars, MIT license
- [OpenTUI npm Package](https://www.npmjs.com/package/@opentui/core) — 31k weekly downloads
- [OpenTUI Skill](https://github.com/msmps/opentui-skill) — AI coding assistant reference docs
- [OpenTUI UI Components](https://github.com/msmps/opentui-ui) — Dialog, Toast components
- [OpenTUI Spinner](https://github.com/msmps/opentui-spinner) — 80+ spinner animations
- [OpenTUI Deep Analysis](https://deepwiki.com/sst/opentui) — Architecture breakdown
- [OpenTUI Multi-frontend Analysis](https://refft.com/en/sst_opentui.html) — Framework comparison

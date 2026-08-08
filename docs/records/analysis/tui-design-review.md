# TUI Design Review & Redesign Direction

**Version:** 1.0
**Last Updated:** 2026-06-15
**Status:** Proposal / review
**Related:** [tui-ux-design.md](./tui-ux-design.md) · [ADR 002](../adrs/002-tui-first-interface-design.md) · [TUI redesign roadmap](../roadmaps/tui-redesign.md)

---

## Table of Contents

1. [Why this review](#1-why-this-review)
2. [Verdict at a glance](#2-verdict-at-a-glance)
3. [Current-state audit](#3-current-state-audit)
4. [Gap table vs. the design vision](#4-gap-table-vs-the-design-vision)
5. [Design direction](#5-design-direction)
6. [Semantic colour vocabulary](#6-semantic-colour-vocabulary)
7. [The app shell](#7-the-app-shell)
8. [Before / after mockups](#8-before--after-mockups)
9. [Interaction grammar](#9-interaction-grammar)
10. [What we keep](#10-what-we-keep)

---

## 1. Why this review

The TUI is Iris's primary interface (ADR 002), and the stated ambition is a
*"beautiful full-screen terminal application"* in the class of **lazygit**,
**taproom**, and **wyrd-tui**. It is functionally complete: 12 screens, a clean
stack router, spinner-driven workflows, but visually and ergonomically it has
drifted from the vision documented in `tui-ux-design.md`. Today it renders as a
flat vertical stack of text lines: no panel borders, no persistent chrome, no
help overlay, ad-hoc per-screen keymaps, and status colours that don't read as
states.

This document audits the current state against that vision, then proposes a
concrete design direction. The sequenced, branch-by-branch execution plan lives
in [`tui-redesign.md`](../roadmaps/tui-redesign.md).

Scope priorities (confirmed): **UX & navigation, aesthetic polish,
understandability, quality of life**, all four.

---

## 2. Verdict at a glance

The bones are good. Three foundational primitives are missing, and almost every
visible weakness traces back to one of them:

1. **No framed panels.** The biggest single gap. lazygit's entire identity is
   bordered, titled panels with an accent border on the focused one. Iris draws
   none: `borders` in `assets/brand/theme.ts` is defined but never used.
2. **No persistent app chrome.** No global header, footer keybar, or breadcrumb.
   Each screen reinvents its own title and status line.
3. **No shared interaction grammar.** Every screen hand-rolls keypress handling;
   bindings diverge; the promised `?` help overlay and vim navigation don't
   exist.

Fix those three and the TUI moves from "works" to "polished". Everything in the
roadmap builds on them.

---

## 3. Current-state audit

Evidence is cited as `file:line`.

### 3.1 Aesthetic / UI

- **No panel framing anywhere.** `borders.heavy` / `borders.light`
  (`assets/brand/theme.ts:82`) are dead code. A grep for `border`, `borderStyle`,
  `title` across `src/tui/` returns **zero** structural usages: screens are
  flat `BoxRenderable` columns of `TextRenderable` lines (e.g. the dashboard is
  logo → spacer → "Quick Actions" → spacer → list → status line,
  `dashboard.ts:55-109`). Nothing visually separates regions.
- **No persistent app chrome.** Each screen hand-rolls a title line and a bespoke
  footer string (`dashboard.ts:106`, `validation-explorer.ts:148`). There is no
  global header (logo + working context such as provider / UKPRN / active
  schema) and no global footer keybar. `router.getBreadcrumbs()` exists
  (`router.ts:108`) but is **never rendered**, so users have no "where am I"
  signal.
- **Status colours don't read semantically** (`assets/brand/theme.ts:18-38`):
  - `success` = `#1E3A44` (blueglass dark), reads as near-black teal, not "good".
  - `warning` = `#A45A84` (tyrian lite), *identical to* `textMuted`
    (`assets/brand/theme.ts:35`), so warnings are indistinguishable from dimmed text.
  - `error` = `#3E1026` (scar), near-black maroon; on the `#FFF1F7` pink
    background it barely separates from normal `text` `#3A0F28`.
  - Net effect: the information hierarchy promised by the design doc
    (red/blocking > yellow/review > green/confirm) collapses into "everything is
    dark on pink".
- **Broken symbols.** `symbols.arrows.up`, `.down`, `.left` are **empty strings**
  (`assets/brand/theme.ts:59-61`); only `right` is set. Any UI that renders these draws
  nothing.
- **Dark theme defined but unused.** `THEMES.themeDark` (`assets/brand/theme.ts:39`) is
  a near-copy of light: its `background` stays the pink `#FFF1F7`, so it isn't
  actually dark, and nothing imports it; `theme` is hard-bound to
  `themeLight` (`assets/brand/theme.ts:144`).
- **Spacing is magic strings.** Vertical rhythm comes from empty
  `TextRenderable`s used as spacers (`dashboard.ts:72,83`); indentation is
  hard-coded `'    '` / `'      '` literals (`workflow.ts:461,474`). No spacing
  scale, so alignment drifts between screens.

### 3.2 UX / Navigation

- **No `?` help overlay.** A stated core principle, *"`?` for contextual help
  (always visible)"* (`tui-ux-design.md:51`), and roadmap item **2TI.12**, but
  not implemented. Discoverability rests entirely on the per-screen footer
  string.
- **Inconsistent keymaps, no central registry.** Each screen re-implements
  `keyInput.on('keypress', …)` (`dashboard.ts:170`). Bindings diverge and
  collide: `q` quits the dashboard (`dashboard.ts:171`) but saves & exits
  settings; `x` deletes in history/mapping-builder but is unbound elsewhere. The
  design doc advertises vim nav (`j/k/g/G`, `tui-ux-design.md`), **not
  implemented**.
- **No command palette / global jump.** Every screen is reachable only by
  walking the menu tree.
- **Awkward double-press confirms** for destructive deletes
  (`history.ts:436`, `mapping-builder.ts:373`), press `x` twice, instead of an
  explicit confirm affordance. Easy to mis-fire, easy to miss.
- **No transitions.** Screens snap on push/pop (roadmap **2TI.18**). The only
  motion in the whole app is the workflow spinner (`workflow.ts:408`).

### 3.3 Quality of life / Understandability

- **No toast / notification layer.** Transient feedback is inconsistent inline
  text (e.g. the brief delete message in `history.ts`), with nothing reusable.
- **No empty states.** Empty history or mapping lists render as bare/zero-row
  lists with no guidance toward the next action.
- **Weak multi-panel focus model.** Two-panel screens (mapping-editor) signal
  focus only by swapping `highlightFocused` (`#5FA3BA` blueglass lite) vs
  `highlightUnfocused` (`#D6A3BF` rosewash nav) backgrounds
  (`assets/brand/theme.ts:30-31`), two low-contrast tints that are hard to tell apart
  on the pink canvas. No focused-panel border.
- **Workflow lacks a progress bar and timing.** `progress.filled` / `.empty`
  symbols (`assets/brand/theme.ts:73-76`) are defined but unused; the processing screen
  shows step icons only, no overall progress bar and no elapsed time, both
  promised in `tui-ux-design.md`.

---

## 4. Gap table vs. the design vision

| Promised in `tui-ux-design.md` | Implemented? | Evidence |
|---|---|---|
| Bordered containers (`heavy`) + panels (`light`) | ❌ | `borders` unused; flat stacks |
| Persistent header / footer / status bar | ⚠️ Partial | per-screen footer string only |
| Breadcrumb / "where am I" | ❌ | `getBreadcrumbs()` never rendered |
| `?` contextual help overlay (always) | ❌ | 2TI.12 pending |
| `q`/`ESC` back everywhere (consistent) | ⚠️ Partial | `q` means different things per screen |
| Vim navigation (`j/k/g/G`) | ❌ | arrows only |
| Information hierarchy via colour | ❌ | status colours not legible as states |
| Progress bar + elapsed time on processing | ❌ | step icons only |
| Live log viewer with timestamps | ❌ | error sampling only (`workflow.ts:467`) |
| Loading states for async ops | ✅ | spinner per step |
| Progressive disclosure (summary → detail) | ✅ | validation explorer, success screen |
| Two-pane error explorer (list + detail) | ✅ | `validation-explorer.ts` |

---

## 5. Design direction

A lazygit-class look, built on the three primitives Iris lacks today.

### 5.1 Framed app shell
A persistent outer layout shared by every screen:
- **Header band**: wordmark + working context (provider / UKPRN / active
  schema / active mapping) pulled from config, plus a breadcrumb.
- **Content region**: one or more **bordered, titled panels**. The **focused**
  panel gets an accent border (vein); unfocused panels get the muted border.
- **Footer keybar**: the current screen's bindings, generated from the keymap
  registry (never a hand-typed string again).

### 5.2 Semantic colour vocabulary
Extend `PALETTE` with brand-coherent hues so states are instantly legible
(§6). We coin our own names in the existing poetic register rather than binding
to literal red/amber/green, but each colour is tuned to *read* as its state and
to clear contrast thresholds on both the light and a real dark background.

### 5.3 Consistent interaction grammar
One keymap registry per screen drives: the footer keybar, the `?` help overlay,
vim+arrow aliases, and consistent global keys (`?` help, `q`/`ESC` back,
`Ctrl+C` quit). Add overlay layers for **toasts** and a real **confirm modal**,
retiring double-press deletes.

OpenTUI `0.1.77` provides the building blocks: `BoxRenderable` border /
`borderStyle` / `borderColor` / `title`, `ScrollBoxRenderable`, and z-indexed
overlays. (Exact API to be confirmed against the installed version when Phase A
begins; dependencies are not installed in the review container.)

---

## 6. Semantic colour vocabulary

The brand is a **Tyrian purple** × **Blueglass teal** duo on a **rosewash pink**
ground. To make states legible without breaking that harmony, we add hues that
are *analogous or harmonious* with the existing wheel positions, each with a
**foreground tone** (dark, for text/icons on the light bg) and an **accent tone**
(brighter, for borders/fills/progress).

| Role | Name | FG tone (on light) | Accent tone | Colour-theory rationale |
|---|---|---|---|---|
| Valid / success | **Verdant** | `#2E6F4E` | `#4FAE7C` | Green nudged toward blueglass teal, analogous to the existing secondary, so it harmonises rather than clashing. Reads clearly as "good". |
| Caution / warning | **Ember** | `#B25A2A` | `#E0934A` | Warm terracotta, analogous to rosewash's warmth but far enough in chroma/value to be distinct from the pink `textMuted`. Reads as "review". |
| Blocking / error | **Flare** | `#B11A46` | `#D94E74` | Raises the chroma of `scar`/`vein` into a saturated crimson so it actually separates from body text. Reads as "stop". |
| Info | **Blueglass** (existing) | `#3E7F96` | `#5FA3BA` | Keep, already works as info. |
| Focus / accent | **Vein** (existing) | `#7A2A57` | n/a | Focused-panel border + selection accent. |

**Approximate contrast on `#FFF1F7` (target ≥ 4.5:1 for text):**
`Verdant #2E6F4E` ≈ 5.4:1 ✓ · `Ember #B25A2A` ≈ 4.7:1 ✓ · `Flare #B11A46` ≈
6.0:1 ✓ · `Blueglass #3E7F96` ≈ 4.3:1 (use bold / large) · `Vein #7A2A57` ≈
6.8:1 ✓. *(Estimates: verify with a WCAG tool during Phase A.)*

**Fixes this delivers:**
- `success` stops being dark teal; `warning` stops colliding with `textMuted`;
  `error` gains chroma so it separates from body text.
- Accent tones give borders/progress/fills a brighter register distinct from
  text.

**Real dark theme.** `themeDark` should sit on `chasm #220817` (or a slightly
lifted `#2A0E1C`) with lightened foregrounds (e.g. `text` → rosewash
`#FFF1F7`, `textMuted` → `#D6A3BF`) and the **accent** tones promoted to FG
(brighter colours read better on dark). This makes the existing-but-fake dark
theme genuinely dark and switchable (Phase D).

---

## 7. The app shell

```text
┌─ Iris ──────────────────── FAC · UKPRN 10001234 · ILR 2025-26 ─┐   header
│                                                                 │   (context + breadcrumb)
│  Dashboard ▸ Convert                                            │
├─────────────────────────────────────────────────────────────────┤
│ ╭─ Quick Actions ─────────────╮  ╭─ Recent Activity ─────────╮  │   content region:
│ │ ▸ 1  Convert CSV to ILR XML │  │ ✓ 15 Jun  submission_…06  │  │   bordered, titled panels
│ │   2  Validate XML           │  │ ⚠ 10 Jun  submission_…05  │  │   (focused panel = vein border)
│ │   3  Cross-Submission Check │  │ ✓ 02 Jun  submission_…04  │  │
│ │   …                         │  │                           │  │
│ ╰─────────────────────────────╯  ╰───────────────────────────╯  │
├─────────────────────────────────────────────────────────────────┤
│ ↑↓/jk move · enter select · ? help · q quit                      │   footer keybar
└─────────────────────────────────────────────────────────────────┘   (from keymap registry)
```

The header, footer, and panel chrome are **shared components** so every screen
inherits the same frame; screens only fill the content region.

---

## 8. Before / after mockups

### 8.1 Dashboard

**Before (today):**
```text
   ___      _
  |_ _|_ _ (_)___      ← ASCII logo
   | || '_|| (_-<
  |___|_|  |_/__/

Quick Actions

▌1  Convert CSV to ILR XML       ← single highlighted row, no frame
 2  Validate XML Submission
 3  Cross-Submission Check
 …
[↑↓/1-8] Select  [ENTER] Confirm  [q] Quit
```

**After:** the §7 shell, framed Quick Actions panel beside a Recent Activity
panel, context in the header, keybar in the footer.

### 8.2 Workflow / processing

**Before (today):**
```text
Converting

● Parse CSV
◐ Validate Data
    3 errors, 5 warnings
      • aimType (row 2): invalid code [value: "ZZ"]
● Generate XML
○ Save Output

Processing...
```

**After:**
```text
╭─ Converting · learners.csv ────────────────────────────────────╮
│ ✓ Parse CSV                                       1,204 rows    │
│ ◐ Validate Data                                                 │
│     ⚠ 5 warnings   ✗ 3 errors                                   │   ← Ember / Flare,
│       • aimType (row 2): invalid code  value "ZZ"               │     legible as states
│ ○ Generate XML                                                  │
│ ○ Save Output                                                   │
│                                                                 │
│ ████████████░░░░░░░░░░░░░░  48%            elapsed 0:02         │   ← progress bar + timer
╰─────────────────────────────────────────────────────────────────╯
 esc cancel · ? help
```

### 8.3 Validation explorer

**Before:** two stacked text regions (list, then detail), tabs as plain text.

**After:**
```text
╭─ Issues  [ Errors ·12 ] [ Warnings ·8 ] [ All ] ─╮ ╭─ Detail ──────────────╮
│ ✗ aimType        row 2                           │ │ Field    aimType       │
│ ✗ ukprn          row 5                  ▸focused │ │ Row      2             │
│ ⚠ postcode       row 9                           │ │ Code     INVALID_CODE  │
│ …                                                │ │ Value    "ZZ"          │
╰──────────────────────────────────────────────────╯ ╰───────────────────────╯
 ↑↓/jk move · ←→ filter · enter detail · esc back · ? help
```

Focused panel carries the vein border; severity icons use Verdant/Ember/Flare.

---

## 9. Interaction grammar

**Global (every screen):** `?` help overlay · `q`/`ESC` back (consistent) ·
`Ctrl+C` quit · `↑↓`+`j/k` move · `g`/`G` top/bottom · `enter` select/confirm.

**Keymap registry** (`src/tui/utils/keymap.ts`, Phase A): each screen declares
`{ keys, label, when?, handler }` entries. The registry is the **single source**
for the footer keybar, the `?` overlay, and dispatch, eliminating the
hand-typed footer strings and the per-screen `keypress` switch blocks.

**Overlays** (Phase C): a z-indexed layer above the current screen for the help
sheet, transient **toasts** (success/info/error, auto-dismiss), and a real
**confirm modal** (`enter` confirm / `esc` cancel) that replaces every
double-press delete.

---

## 10. What we keep

The architecture is sound: the redesign is additive, not a rewrite:
- **Stack `Router`** (push/pop/replace + data threading + `cleanup()` lifecycle,
  `router.ts`). The shell and overlays layer on top of it.
- **Centralised theme** (`assets/brand/theme.ts`): we extend the palette, not replace
  the system.
- **OpenTUI flexbox layout**: panels and shell are just composed `BoxRenderable`s.
- **Generic `WorkflowScreen`** (`workflow.ts`): one component already drives
  convert/validate/check; we enrich it (frame, progress, timer) in place.

Execution sequence: see [`tui-redesign.md`](../roadmaps/tui-redesign.md).

# TUI Redesign Roadmap

**Goal:** Take the Iris TUI from "functional" to a top-class, lazygit-class
terminal application — framed panels, persistent chrome, a coherent interaction
grammar, and a legible semantic colour system.

**Source analysis:** [tui-design-review.md](../technical/tui-design-review.md)
**Design vision:** [tui-ux-design.md](../technical/tui-ux-design.md)

Each item below is a **single, independently-mergeable branch** (per the project's
small-branch convention). Phases are ordered by dependency: foundations first,
because the shell rollout and signature features build on them.

| Phase | Focus | Status |
|-------|-------|--------|
| **A** | Foundations (theme, layout primitives, keymap) | Open |
| **B** | App-shell rollout across screens | Blocked (needs A) |
| **C** | Signature UX features (help, toasts, progress, transitions) | Blocked (needs A) |
| **D** | Polish (palette, command palette, dark mode, schema display) | Blocked (needs A/B) |

> [!NOTE]
> **Key** (new prefix `TR` = TUI Redesign; existing IDs cross-referenced where work overlaps)
> - TR = TUI redesign work

---

## Phase A — Foundations

> [!IMPORTANT]
> Confirm the OpenTUI `0.1.77` API (`BoxRenderable` `border`/`borderStyle`/
> `borderColor`/`title`, `ScrollBoxRenderable`, overlay z-index) against the
> installed package before starting — dependencies were not installed during the
> review.

- [ ] **TR.A1** `feat/extend-theme-semantic-palette` — Add the semantic colour
      vocabulary (Verdant / Ember / Flare + accent tones) to `PALETTE` in
      `brand/theme.ts`; remap `success`/`warning`/`error` so they read as states;
      fix the empty `symbols.arrows.up/down/left`; make `themeDark` a genuine
      dark variant on `chasm`. Update `tests/tui/theme.test.ts`.
- [ ] **TR.A2** `feat/add-tui-layout-primitives` — New `src/tui/components/` dir:
      `panel()` (bordered + titled box with focused/unfocused border colour) and
      `appShell()` (header band + content region + footer keybar). Add a spacing
      scale to `src/tui/utils/layout.ts`. Reuse `theme` + `borders`.
- [ ] **TR.A3** `feat/add-keymap-registry` — `src/tui/utils/keymap.ts`:
      declarative per-screen bindings (`{ keys, label, when?, handler }`),
      vim+arrow aliases, consistent globals (`?`/`q`/`ESC`/`Ctrl+C`). Drives the
      footer keybar. Refactor `dashboard` as the reference adopter.

## Phase B — App-shell rollout

One branch per screen cluster; each adopts the shell, bordered panels, the keymap
registry, and a header breadcrumb.

- [ ] **TR.B1** `refactor/dashboard-app-shell` — Dashboard onto shell + panels +
      keymap; add a **Recent Activity** panel sourced from submission history.
- [ ] **TR.B2** `refactor/file-picker-app-shell` — File picker; framed list +
      (later) preview panel; consistent nav keys.
- [ ] **TR.B3** `refactor/workflow-app-shell` — Processing screen into the frame
      (sets up TR.C3).
- [ ] **TR.B4** `refactor/results-screens-app-shell` — validation-explorer +
      check-results + success; two-pane framing with a real focused-panel border.
- [ ] **TR.B5** `refactor/mapping-screens-app-shell` — mapping-builder /
      -editor / -save; fixes the weak two-panel focus model.
- [ ] **TR.B6** `refactor/config-screens-app-shell` — settings + history + about.

## Phase C — Signature UX features

- [ ] **TR.C1** `feat/add-help-overlay` — *(roadmap 2TI.12)* Global `?` overlay
      rendered from the keymap registry, on a z-index layer over the current
      screen.
- [ ] **TR.C2** `feat/add-toast-and-confirm-overlays` — Transient toasts
      (success/info/error) + a real confirm modal; **replace the double-press
      deletes** in history & mapping-builder.
- [ ] **TR.C3** `feat/add-workflow-progress` — Progress bar
      (`progress.filled`/`empty`) + elapsed-time on `WorkflowScreen`.
- [ ] **TR.C4** `feat/add-screen-transitions` — *(roadmap 2TI.18)* Subtle
      fade/slide on push/pop via the OpenTUI Timeline; fast, with a reduce-motion
      config toggle.

## Phase D — Polish

- [ ] **TR.D1** `feat/add-command-palette` — Global fuzzy jump-to-screen/action.
- [ ] **TR.D2** `feat/add-theme-toggle` — Light/dark switch in settings, persisted
      to config (depends on TR.A1's real dark theme).
- [ ] **TR.D3** `feat/refine-schema-field-display` — *(roadmap 2TM.5 / 2TM.6)*
      Two-line + ancestor-grouped schema fields in mapping-editor.

---

## Per-branch definition of done

- Conventional-commit message (KSB-relevant where applicable).
- Update/extend the relevant `tests/tui/*` suite; `bun test` green.
- Manually launch `bun run cli` and verify the change in a real terminal.
- Keep each branch a minimal tangible improvement — when in doubt, split smaller.

## Cross-references to existing roadmap

| This roadmap | Existing ID (phase-1-mvp-features.md) |
|---|---|
| TR.C1 help overlay | 2TI.12 |
| TR.C4 transitions | 2TI.18 |
| TR.C3 workflow progress | 2TI.31 (validation proof) overlaps |
| TR.D3 schema field display | 2TM.5 / 2TM.6 |

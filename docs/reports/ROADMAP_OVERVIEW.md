# Iris TUI Redesign: Roadmap Overview

**25 tasks across 6 milestones.** Files: `.claude/roadmaps.json` (machine-readable), `docs/roadmaps/v5a-2606/enhanced.md` (full task list with Mermaid dependency diagram).

> Migrated from the old simple-format roadmap via `roadmap-migrate` — the narrative sections below are stubs synthesised from the original milestone goals, not yet fleshed out by the team.

---

## What we're building

Take the Iris TUI from "functional" to a top-class, lazygit-class terminal application: framed panels, persistent chrome, a coherent interaction grammar, and a legible semantic colour system. The work is organised as independently-mergeable branches, foundations first, because the shell rollout and signature features build on the theme/layout/keymap primitives established in Phase A.

_(Stub — flesh out with the reasoning behind the phase structure once reviewed.)_

## Milestone sequence and the reasoning behind it

- **M1 — Phase A (Foundations):** theme, layout primitives, and keymap registry that every later phase depends on.
- **M2 — Phase S (Security & dependency maintenance):** Dependabot housekeeping, tracked here since this is the active roadmap rather than as a separate concern.
- **M3 — Phase B (App-shell rollout):** every screen adopts the shell/panel/keymap primitives from Phase A, gated on the vite/vitest major bump (TR.S2) landing first.
- **M4 — Phase C (Signature UX features):** help overlay, toasts/confirm modal, workflow progress, and screen transitions — the redesign's headline user-facing wins.
- **M5 — Phase D (Polish):** command palette, theme toggle, and schema field display refinement.
- **M6 — Phase E (Tutorial & demo resources):** VHS-scripted terminal recordings, sequenced last so the demos show the polished UI rather than the pre-redesign one.

_(Stub — one paragraph per milestone with fuller reasoning, once reviewed.)_

## Decisions that shaped the structure

- Each task is scoped as a single, independently-mergeable branch per the project's small-branch convention.
- Security/dependency maintenance (Phase S) was folded into this roadmap rather than tracked separately, since it was the active roadmap at the time.
- Demo/tutorial work (Phase E) is sequenced last deliberately — recordings should show the polished UI (Phases B–C), not the pre-redesign flat one.

_(Stub — add any further non-obvious decisions once reviewed.)_

## External blockers (flag early)

None currently modelled as external gates. Several tasks cross-reference IDs in the separate `phase-1-mvp-features.md` roadmap (TR.C1 ↔ 2TI.12, TR.C4 ↔ 2TI.18, TR.C3 ↔ 2TI.31, TR.D3 ↔ 2TM.5/2TM.6, TR.E3 ↔ 2UD.1) — these are informational cross-links, not dependencies, and aren't tracked as gates here.

_(Stub — confirm whether any of these cross-references should become real external gates.)_

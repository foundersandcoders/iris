# TUI Redesign Roadmap

**Goal:** Take the Iris TUI from "functional" to a top-class, lazygit-class
terminal application — framed panels, persistent chrome, a coherent interaction
grammar, and a legible semantic colour system.

**Source analysis:** [tui-design-review.md](../technical/tui-design-review.md)
**Design vision:** [tui-ux-design.md](../technical/tui-ux-design.md)

Each item below is a **single, independently-mergeable branch** (per the project's
small-branch convention). Phases are ordered by dependency: foundations first,
because the shell rollout and signature features build on them.

| Phase | Focus                                                        | Status |
|-------|--------------------------------------------------------------|--------|
| **A** |        Foundations (theme, layout primitives, keymap)        | Complete |
| **S** |         Security & dependency maintenance (Dependabot)       | Complete |
| **B** |               App-shell rollout across screens               | In Progress (B1-B5 done) |
| **C** | Signature UX features (help, toasts, progress, transitions)  | Ready |
| **D** | Polish (palette, command palette, dark mode, schema display) | Blocked (needs B) |
| **E** |       Tutorial & demo resources (Charm VHS recordings)       | Blocked (needs B/C) |

> [!NOTE]
> **Key** (new prefix `TR` = TUI Redesign; existing IDs cross-referenced where work overlaps)
>
> - TR = TUI redesign work

---

## Phase A — Foundations

> [!IMPORTANT]
> Confirm the OpenTUI `0.1.77` API (`BoxRenderable` `border`/`borderStyle`/
> `borderColor`/`title`, `ScrollBoxRenderable`, overlay z-index) against the
> installed package before starting — dependencies were not installed during the
> review.

- [x] **TR.A1** `feat/extend-theme-semantic-palette` — Add the semantic colour
      vocabulary (Verdant / Ember / Flare + accent tones) to `PALETTE` in
      `assets/brand/theme.ts`; remap `success`/`warning`/`error` so they read as states;
      fix the empty `symbols.arrows.up/down/left`; make `themeDark` a genuine
      dark variant on `chasm`. Update `tests/tui/theme.test.ts`.
- [x] **TR.A2** `feat/add-tui-layout-primitives` — New `src/tui/components/` dir:
      `panel()` (bordered + titled box with focused/unfocused border colour) and
      `appShell()` (header band + content region + footer keybar). Add a spacing
      scale to `src/tui/utils/layout.ts`. Reuse `theme` + `borders`.
- [x] **TR.A3** `feat/add-keymap-registry` — `src/tui/utils/keymap.ts`:
      declarative per-screen bindings (`{ keys, label, when?, handler }`),
      vim+arrow aliases, consistent globals (`?`/`q`/`ESC`/`Ctrl+C`). Drives the
      footer keybar. Refactor `dashboard` as the reference adopter.
- [x] **TR.A4** `fix/isolate-tui-test-mocks` — The full `bun test` run had
      order-dependent failures: TUI test files (`tests/tui/**`) call `vi.mock()`
      to override `../../../src/lib/storage` (and friends), and the leaked
      module mock bled into later files — e.g. `tests/lib/types/config.test.ts`
      passed alone but failed in the full suite with `storage.init is not a
      function`. **Investigated and rejected:** `afterEach(() => mock.restore())`
      does not work — confirmed empirically and against the Bun docs
      (`mock.restore()` explicitly does not reset `mock.module()` overrides);
      `vi.restoreAllMocks()` / `vi.doUnmock()` + `vi.resetModules()` were also
      tested and don't un-register a module mock under Bun's runner. **Actual
      fix:** module mocks are permanent under `bun test`, so mock-based test
      files must never share a runner with non-mocked tests. Added
      `bunfig.toml` (`[test] root = "tests/lib"`) so bare `bun test` only walks
      core lib tests; the 8 `vi.mock`-based TUI files stay vitest-owned
      (`bun run test:svelte`). Also fixed two stale assertions in
      `tests/lib/utils/storage/paths.test.ts` (test predated a `paths.ts`
      change) and removed stray `crossCheck.test.ts.bak{2,3,4}` files. **Done:**
      `bun run test:core` is 462/462 green, verified stable across repeated
      runs regardless of execution order.
- [x] **TR.A5** `feat/add-node-storage-adapter` — `bunx vitest run` had ~20
      failing test files unrelated to TR.A4's mock leak: `createStorage()`
      (`src/lib/storage/create.ts`) unconditionally imported the Bun-only
      adapter (`src/lib/storage/adapters/bun.ts`, uses `Bun.file`/`Bun.write`),
      plus `create.ts` itself used `import.meta.dir` and a Bun-specific `.xsd`
      import assertion (`with { type: 'text' }`). There was no Node-compatible
      adapter, so any test calling `createStorage()` — `tests/lib/types/config.test.ts`,
      `tests/lib/workflows/csvConvert.test.ts`, `tests/lib/workflows/crossCheck.test.ts`,
      `tests/lib/storage/create.test.ts`, `tests/lib/mappings/compatibility.test.ts`,
      plus TUI screen tests that mock storage — could not run under vitest's
      Node environment ("Bun is not defined"). **Done:** added
      `src/lib/storage/adapters/node.ts` (a Node `fs/promises`-based
      `StorageAdapter`) with runtime detection in `create.ts`
      (`typeof Bun !== 'undefined' ? createBunAdapter() : createNodeAdapter()`);
      swapped the Bun-only `import.meta.dir` for `import.meta.dirname` (works
      under both runtimes); guarded the bundled-XSD text-import behind a
      `typeof Bun` check with a filesystem fallback under Node. Merged via
      PR #72. `bun run test:svelte` now runs all storage-dependent `lib`
      tests green — a cross-runtime test-assertion bug in
      `csvConvert.test.ts` (`fs.access()` resolves `null` under Bun,
      `undefined` under vitest/Node) was fixed alongside this. `bun run
      test:all` still exits non-zero, but only because of the pre-existing
      TUI/vitest incompatibility tracked as **TR.A6** below — unrelated to
      storage and out of scope for this task.
- [x] **TR.A6** `fix/vitest-tui-suite-compat` — All 12 `tests/tui/**` suites
      failed to *load* under `vitest` (0 tests collected, not test failures):
      a `vi.mock` factory hoisting `ReferenceError` in `app.test.ts`, plus
      `TypeError: Unknown file extension ".scm"` in the other 11 —
      `@opentui/core`'s bundled `highlights.scm`/`.wasm` tree-sitter assets,
      Bun-only `with { type: "file" }` imports vitest's Node loader can't
      resolve. **Investigated and rejected:** stubbing the `.scm`/`.wasm`
      imports via a Vite `load` plugin worked, but inlining `@opentui/core`
      (required so the plugin's transform applies) surfaced a harder wall —
      the same monolithic bundled chunk
      (`node_modules/@opentui/core/index-h3dbfsf6.js`) has unconditional
      top-level `import ... from "bun:ffi"` (the native Zig renderer
      binding). `bun:ffi` has no Node polyfill, so the real package cannot
      load under vitest at all, full stop — not a config problem. The
      official `@opentui/core/testing` subpath doesn't help either; it
      re-imports the same chunk. **Actual fix:** a hand-written shared test
      double, `tests/fixtures/tui/opentui.ts` — real named classes
      (`BoxRenderable`, `TextRenderable`, `SelectRenderable`, `RGBA`, etc.)
      matching opentui's actual behaviour where suites assert on it
      (constructor names, `RGBA.fromHex`/`.equals()` channel maths mirrored
      from opentui's real `hexToRgb`, `TextRenderable.content` string→
      StyledText coercion, colour-option coercion on both construction and
      reassignment). Each suite adds a one-line, hoisting-safe
      `vi.mock('@opentui/core', async () => import('.../opentui'))` —
      the async factory only calls `import()` and closes over nothing, so
      it's immune to the original hoisting trap. Also needed
      `test.server.deps.inline: ['opentui-spinner']` in `vite.config.ts`:
      that package's own nested `@opentui/core` import is externalised by
      default, which bypasses `vi.mock` entirely unless inlined. **Done:**
      `bunx vitest run` — 53 files, 596 tests green (14 TUI files, 134
      tests); `bun run test:core` — 474 pass, unaffected. `bun run
      test:all` is unified green.

## Phase S — Security & dependency maintenance

Housekeeping tasks raised by GitHub Dependabot (9 alerts, 8 open as of 2026-07-03).
Not TUI redesign work, but tracked here since this is the active roadmap.

- [x] **TR.S1** `fix/bump-vulnerable-rust-deps` — Bumped `tauri`
      (`2.9.5` → `2.11.5` in `src-tauri/Cargo.toml`, fixes CVE-2026-42184
      origin-confusion IPC bug) and ran `cargo update` for the transitive
      crates. **Done:** `bytes` → `1.12.0` (≥1.11.1 fixed), `rand 0.8.5` →
      `0.8.6` (fixed), `time` → `0.3.53` (≥0.3.47 fixed — this needs Rust
      ≥1.88.0; confirmed the installed toolchain is 1.96.1 and `cargo check`
      builds clean, so this was taken as a working build, but it means
      `src-tauri/Cargo.toml`'s declared `rust-version = "1.85.0"` is now
      **inaccurate** and out of sync with the real MSRV. Left unchanged
      pending a follow-up that bumps `rust-version` to `"1.88.0"` and
      confirms CI's toolchain meets it — don't treat this line's `1.85.0` as
      current). **Investigated and left
      open:** `rand@0.7.3` (a second, older `rand` in the tree) is
      unreachable via any dependency bump — it's pinned transitively through
      `kuchikiki 0.8.8-speedreader` (already the latest release) →
      `selectors 0.24.0` → `phf_codegen 0.8.0` → `phf_generator 0.8.0` →
      `rand 0.7.3`; no newer `kuchikiki` exists to break the chain. **Known
      regression, accepted:** the `tauri` bump itself pins `gtk ^0.18` on
      Linux, which requires `glib ^0.18` — this silently downgrades `glib`
      from the already-patched `0.20.0` back to the vulnerable `0.18.5`
      (medium severity, crash-only NULL-pointer soundness bug, not remotely
      exploitable). Confirmed via `cargo update -p glib --precise 0.20.0`
      that this is a hard constraint from `tauri 2.11.5`'s own `Cargo.toml`,
      not resolvable independently. Traded off deliberately: the
      origin-confusion CVE this bump fixes is remote-triggerable, the glib
      regression is not. Revisit `rand@0.7.3`/`glib` when Tauri raises its
      own `gtk`/`glib` floor upstream. Verified: `cargo check` clean,
      `bun run test:core` 474/474 green (unaffected).
- [x] **TR.S2** `fix/bump-vite-vitest-majors` — Upgraded `vite`
      (`^5.0.0` → `^6.4.3`) and `vitest` (`^2.0.0` → `^3.2.6`). Resolves 4
      Dependabot alerts: 1 critical (Vitest UI/browser-mode arbitrary file
      read via path traversal, Windows + exposed `api.host` only), 1 high
      (`vite` `server.fs.deny` bypass on Windows), 2 medium (`vite`'s bundled
      `launch-editor` leaks the dev's NTLMv2 hash via a crafted UNC path on
      Windows; `vite` optimized-deps `.map` path traversal). Also bumped
      `@sveltejs/vite-plugin-svelte` `^4.0.0` → `^6.1.4` (required for Vite 6
      peer compatibility; `@sveltejs/kit@2.49.4` already accepted it). No
      config changes needed — `vite.config.ts`'s `server.deps.inline` and the
      TR.A6 OpenTUI mock (`tests/fixtures/tui/opentui.ts`) worked unchanged.
      Verified: `bun test:core` 474/474, `test:svelte` 596/596 (all 12
      `tests/tui/**` suites green), `bun run build` clean. Pre-existing
      `svelte-check` errors (64, unrelated fixture typing gaps) confirmed
      present on `main` before this branch — not introduced by the bump.

## Phase B — App-shell rollout

One branch per screen cluster; each adopts the shell, bordered panels, the keymap
registry, and a header breadcrumb.

- [x] **TR.B1** `refactor/dashboard-app-shell` — Dashboard onto shell + panels +
      keymap; add a **Recent Activity** panel sourced from submission history.
      — **depends on TR.S2**. **Done:** rebuilt on `appShell()` + `panel()`
      (menu panel + Recent Activity panel side by side), `Keymap` drives the
      footer keybar (nav hint, number shortcuts, quit/back both resolve
      `quit` at root). Recent Activity shows the 5 most recent submissions
      from `createStorage().loadHistory()`, newest-first, with an
      "Unknown date" fallback for unparseable timestamps. Merged via PR #76.
- [x] **TR.B2** `refactor/file-picker-app-shell` — File picker; framed list +
      (later) preview panel; consistent nav keys. — **depends on TR.S2**.
      **Done:** replaced the hand-rolled root/header/footer/keypress-listener
      with `appShell()` + `panel()` + `Keymap`, following the TR.B1 dashboard
      as the reference adopter. Header breadcrumb shows the screen title
      (e.g. "Select CSV File"); the file-list panel's **border title shows
      the live current-directory path**, updating on both directory-entry
      navigation and Backspace-up. `Keymap` bindings: nav hint (bar-only,
      `SelectRenderable` owns arrows), Enter (`selectCurrent()`), Backspace
      (extracted into `goUpDirectory()`); both ESC and `q` pop (file-picker
      has no quit-to-desktop concept, unchanged from pre-refactor
      behaviour). All caller data contracts preserved unchanged: the
      `check-current`/`check-previous` two-step flow, `mapping-create`,
      default single-file workflows, and the `selectionMode: 'directory'` +
      `__select__` sentinel + `fieldKey` pop-back used by Settings. The
      "(later) preview panel" is deferred — the body is a row `BoxRenderable`
      wrapping the single file-list panel, so a second pane can be added
      alongside it without restructuring. Added two tests
      (`tests/tui/screens/file-picker.test.ts`) asserting the footer keybar
      and the panel-title path display; all other existing tests updated to
      match the new shell/keymap wiring where needed. Verified manually via
      `bun run cli` in a real terminal (tmux-driven): Convert flow, Settings'
      directory-mode picker (sentinel select + `fieldKey` round-trip),
      directory navigation in/out with live title updates, ESC/backspace
      behaviour. `bun run test:svelte` 53/53 files, 600/600 tests green;
      `bun run test:core` 474/474 unaffected; no new `tsc` diagnostics (the
      5 pre-existing `updateSelectOptions` possibly-undefined errors predate
      this branch, confirmed via `git stash` comparison).
- [x] **TR.B3** `refactor/workflow-app-shell` — Processing screen into the frame
      (sets up TR.C3). — **depends on TR.S2**. **Done:** rebuilt the
      processing/workflow screen on `appShell()` + `panel()` + `Keymap`,
      following the dashboard reference adopter. Merged via PR #78.
- [x] **TR.B4** `refactor/results-screens-app-shell` — validation-explorer +
      check-results + success; two-pane framing with a real focused-panel border.
      — **depends on TR.S2**. **Done:** migrated the three results screens
      (`validation-explorer`, `check-results`, `success`) onto `appShell()` +
      `panel()` + `Keymap`. The two-pane screens get a **real focused-panel
      border** via `panel.setFocused()` (accent vs muted), and `togglePanel()`
      blurs the leaving pane so border and keyboard focus stay in sync (fix
      commit `6ae7750`). Filter-tab selection aligned with the default
      `currentFilter` (`377ed0a`). Merged via PRs #79 (success), #80
      (check-results), #81 (validation-explorer).
- [x] **TR.B5** `refactor/mapping-screens-app-shell` — mapping-builder /
      -editor / -save; fixes the weak two-panel focus model. — **depends on TR.S2**.
      **Done:** migrated mapping-builder, mapping-editor, and mapping-save onto
      `appShell()` + `panel()` + `Keymap`; unified the mapping-editor focus
      authority on the app-shell, replacing the previous weak two-panel focus
      model. Merged via PR #82.
- [ ] **TR.B6** `refactor/config-screens-app-shell` — settings + history + about.
      — **depends on TR.S2**. **In progress:** about and history migrated onto
      `appShell()` + `panel()` + `Keymap`. History gets a two-pane layout
      (Submissions list + Detail) mirroring the check-results precedent, with
      the Validate/Cross-check/Delete keybar entries driven by `Keymap`
      `when` guards on the current selection. Along the way, found and fixed a
      real bug the migration surfaced: `SelectRenderable.selectedIndex` is
      write-only on the real `@opentui/core` API (setter only, no getter) —
      reading it always returns `undefined`; the read path is the
      `getSelectedIndex()` method instead. Fixed in history.ts and added
      `getSelectedIndex()` to the shared test double
      (`tests/fixtures/tui/opentui.ts`) so this class of bug fails tests going
      forward. **Not yet fixed:** `mapping-builder.ts:340,350` and
      `mapping-editor.ts:557,584` (merged in TR.B5) still read
      `.selectedIndex` directly and have the same latent bug — flagged for a
      follow-up fix, out of scope here. Settings remains for TR.B6.

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

## Phase E — Tutorial & demo resources

Use [Charm **VHS**](https://github.com/charmbracelet/vhs) to script reproducible
terminal recordings of the redesigned TUI for the README, docs, and onboarding.
VHS renders declarative `.tape` files (`Type`, `Enter`, `Sleep`, `Set`,
`Output`) to GIF / MP4 / WebM via `ttyd` + `ffmpeg`, so demos are version-
controlled and regenerable rather than hand-captured. Sequenced last because the
recordings should show the polished UI (Phases B–C), not the current flat one.

- [ ] **TR.E1** `build/add-vhs-tooling` — Add a `tapes/` directory, a
      `bun run demos` script (or `scripts/render-tapes.ts`) that runs `vhs` over
      every `.tape`, and document the `vhs` / `ttyd` / `ffmpeg` prerequisites in
      the README. A reusable `tapes/_common.tape` (`Source`d by the rest) sets
      width/height/font and a **VHS `Set Theme`** JSON mirroring the brand
      palette (§ semantic colours) so recordings match the in-app look.
- [ ] **TR.E2** `docs/add-workflow-demo-tapes` — One `.tape` per core workflow
      driving `bun run cli`: convert, validate, cross-submission check, and the
      mapping builder. Render GIFs into `docs/assets/` and embed them in the
      README + a new `docs/tutorials/` walkthrough.
- [ ] **TR.E3** `docs/add-quickstart-tutorial` — *(roadmap 2UD.1)* A
      getting-started tutorial for non-technical users, illustrated with the
      TR.E2 recordings (first launch → convert → resolve issues → submit).

---

## Per-branch definition of done

- Conventional-commit message (KSB-relevant where applicable).
- Update/extend the relevant `tests/tui/*` suite; `bun test` green.
- Manually launch `bun run cli` and verify the change in a real terminal.
- Keep each branch a minimal tangible improvement — when in doubt, split smaller.
- For Phase E demo branches (no test suite): regenerate the affected recordings,
  confirm the GIFs/MP4s render, and commit the generated assets alongside their
  `.tape` source.

## Cross-references to existing roadmap

| This roadmap               | Existing ID (phase-1-mvp-features.md) |
|----------------------------|---------------------------------------|
|     TR.C1 help overlay     |                2TI.12                 |
|     TR.C4 transitions      |                2TI.18                 |
|  TR.C3 workflow progress   |  2TI.31 (validation proof) overlaps   |
| TR.D3 schema field display |             2TM.5 / 2TM.6             |
| TR.E3 quickstart tutorial  |          2UD.1 (user guide)           |

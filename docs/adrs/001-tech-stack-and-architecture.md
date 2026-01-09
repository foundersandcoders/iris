# ADR 001: Tech Stack and Architecture

**Date:** 2026-01-09
**Status:** Accepted
**Deciders:** Jason Warren

---

## Context

Iris replaces an existing Electron-based ILR export tool at Founders and Coders. The current tool has several problems:

1. **Fragile transformations:** CSV column mappings rely on positional data rather than header matching, so reordering columns breaks the export
2. **Distribution friction:** macOS security and code signing requirements make Electron distribution complex
3. **Unmaintained dependencies:** Several components have known issues and are no longer maintained
4. **Poor inspectability:** Difficult to trace how transformation results are derived
5. **Validation gaps:** Only structural validation, no semantic checks or cross-submission consistency

The new tool needs to:
- Support both technical users (via CLI for automation) and non-technical users (via desktop app)
- Use identical transformation logic across both interfaces
- Support header-based CSV parsing that tolerates reordering
- Enable cross-submission consistency checking (requires persistent storage)
- Provide better distribution experience than Electron
- Serve as a strong apprenticeship portfolio piece

---

## Decision

We will build Iris using:

- **Runtime:** Bun
- **Desktop Framework:** Tauri
- **Frontend:** SvelteKit with TypeScript
- **Storage:** File-based (no database)
- **Testing:** Vitest
- **Architecture:** Shared TypeScript core library with two interfaces (CLI + desktop)

### Architecture Pattern

```
iris/
├── src/lib/           # Shared core (CSV → ILR transformation)
├── src/cli.ts         # CLI entry point (bun runtime)
└── src/routes/        # SvelteKit routes (desktop UI via Tauri)
```

Both interfaces import from `src/lib/` and use identical transformation logic.

---

## Alternatives Considered

### 1. Electron (Current Tool)
**Rejected:** Distribution complexity on macOS, large bundle size (~100MB), and unmaintained dependencies were explicit problems in the existing tool.

### 2. Pure CLI Tool (No Desktop Interface)
**Rejected:** Non-technical staff need a GUI. CLI-only would require training and reduce accessibility.

### 3. Local SvelteKit Web App (Browser-based, No Wrapper)
**Considered:** Simpler than Tauri, avoids Rust toolchain, works as localhost web app.

**Rejected for initial implementation:**
- Less impressive for portfolio (not a "real" native app)
- No file associations or dock integration
- Explaining "visit localhost:3000" to non-technical users adds friction
- Plan is to distribute beyond FaC eventually

**Note:** Could revisit this if Tauri proves too complex in practice.

### 4. Next.js Instead of SvelteKit
**Rejected:** Personal preference for Svelte's elegance, and Tauri works equally well with either. No compelling reason to use React here.

### 5. Node.js Runtime Instead of Bun
**Rejected:** Bun provides faster execution, built-in TypeScript support, and simpler tooling. Since this is a new project with no Node.js dependency constraints, Bun is the better choice.

---

## Consequences

### Positive

1. **Shared core ensures consistency:** CLI and desktop use identical logic, eliminating behaviour drift
2. **Bun simplifies tooling:** Native TypeScript support, fast execution, no separate compilation step
3. **Tauri solves Electron problems:** Smaller bundles (~3MB), better macOS code signing, active maintenance
4. **SvelteKit aligns with preferences:** Elegant framework with good Tauri support
5. **File-based storage is sufficient:** Cross-submission history doesn't need a database, filesystem is simpler
6. **Portfolio value:** Native desktop app + CLI + shared library architecture demonstrates range

### Negative

1. **Rust toolchain required:** Bun handles TypeScript, but Tauri requires Rust installed (though we write zero Rust code)
2. **Initial setup complexity:** Tauri adds more configuration than a pure web app would
3. **First build slower:** Rust compilation adds ~5-10 minutes to first build (subsequent builds ~30 seconds)
4. **Learning curve:** Tauri APIs differ from Node.js filesystem APIs (though minor)

### Risks

1. **Tauri proves unnecessarily complex:** If we discover Tauri overhead isn't worth it, we can fall back to local SvelteKit web app since the core library is framework-agnostic
2. **Distribution still problematic:** If macOS code signing remains painful, the Electron problem isn't fully solved (mitigated: Tauri's signing is reportedly better)
3. **Windows/Linux distribution out of scope:** Focusing on macOS only for MVP, but Tauri bundles for all platforms if needed later

---

## Notes

- CLI global command name: `iris` (via `bun link` during development, `bun install -g` for distribution)
- Desktop app bundle identifier: `uk.org.foundersandcoders.iris`
- SvelteKit uses static adapter (Tauri requires pre-rendered pages, no SSR)
- Vite dev server runs on port 1420 (Tauri convention)

---

## References

- [Project Proposal](../proposal.md)
- [Tauri Documentation](https://v2.tauri.app/)
- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Bun Documentation](https://bun.sh/docs)

# Phase 2: Production Features

| Milestone | Focus | Status |
|-----------|-------|--------|
| **M3** | CLI Completion | Blocked (depends on Phase 1) |
| **M4** | Desktop Interface | Blocked (depends on M3) |
| **M5** | Production Docs | Blocked (depends on M4) |

**Prerequisite:** [Phase 1: MVP Features](./phase-1-mvp-features.md) — All M2A, M2B, M2C tasks complete

---

## Colour Key

```mermaid
classDef must-open fill:#D6A3BF,color:#000;
classDef must-blocked fill:#F3D8E6,color:#000;
classDef should-open fill:#6F2A52,color:#fff;
classDef should-blocked fill:#A45A84,color:#fff;
classDef could-open fill:#3E7F96,color:#fff;
classDef could-blocked fill:#5FA3BA,color:#fff;
classDef mile fill:#E8EFF6,color:#000;
```

- **Must** (dark/light iris purple) — Non-negotiable core functionality
- **Should** (deep purple) — Important features that enhance UX
- **Could** (teal) — Nice-to-have features that add value

**Open** (darker shade) = Ready to start | **Blocked** (lighter shade) = Awaiting dependencies

---

## M3: CLI Completion

> [!IMPORTANT]
> **Goal:** Complete direct command interface with help system and automation testing

> [!NOTE]
> **Category:** DC (Direct Commands)

```mermaid
---
title: Milestone 3 — CLI Completion
---
graph TD

phase1{"`**Phase 1**<br/>Complete`"}:::mile --> 3DC.1 & 3DC.2

3DC.1["`*3DC.1*<br/>**DC**<br/>iris --help`"]:::open --> 3DC.2
3DC.2["`*3DC.2*<br/>**DC**<br/>test automation scenarios`"]:::blocked --> 3DC.3
3DC.3["`*3DC.3*<br/>**DC**<br/>--interactive flag`"]:::blocked --> m3

m3{"`**Milestone 3**<br/>CLI Complete`"}:::mile

classDef open fill:#ff9;
classDef blocked fill:#f9f;
classDef mile fill:#9ff;
```

### To Do

- [ ] **3DC.1** — Implement `iris --help` and command-specific help
- [ ] **3DC.2** — Test direct commands in automation/scripting scenarios — **depends on 3DC.1**
- [ ] **3DC.3** — Add `--interactive` flag to launch TUI for specific workflows — **depends on 3DC.2**

---

## M4: Desktop Interface

> [!IMPORTANT]
> **Goal:** Native cross-platform app via Tauri for users who prefer GUI over terminal

> [!NOTE]
> **Categories:**
> - GC (GUI Components)
> - NB (Native Builds)

```mermaid
---
title: Milestone 4 — Desktop Interface
---
graph TD

m3{"`**Milestone 3**<br/>CLI Complete`"}:::mile --> 4GC.1 & 4GC.3

4GC.1["`*4GC.1*<br/>**Component**<br/>File picker`"]:::open --> 4GC.4
4GC.2["`*4GC.2*<br/>**Component**<br/>Validation results`"]:::open --> 4GC.7
4GC.3["`*4GC.3*<br/>**Component**<br/>XML preview`"]:::open --> 4GC.4
4GC.4["`*4GC.4*<br/>**Component**<br/>Save dialog`"]:::blocked --> 4GC.6 & 4GC.8 & 4GC.9 & 4GC.10
4GC.5["`*4GC.5*<br/>**Component**<br/>Cross-Submission Warnings`"]:::blocked --> 4NB.1
4GC.6["`*4GC.6*<br/>**Component**<br/>Config UI`"]:::blocked --> 4NB.1
4GC.7["`*4GC.7*<br/>**Feat**<br/>Error Feedback`"]:::blocked --> 4NB.1
4GC.8["`*4GC.8*<br/>**Route**<br/>/convert`"]:::blocked --> 4GC.7
4GC.9["`*4GC.9*<br/>**Route**<br/>/validate`"]:::blocked --> 4GC.2
4GC.10["`*4GC.10*<br/>**Route**<br/>/check`"]:::blocked --> 4GC.5 & 4GC.7

4NB.1["`*4NB.1*<br/>**Build**<br/>.dmg`"]:::blocked --> 4NB.2 & 4NB.3
4NB.2["`*4NB.2*<br/>**Build**<br/>exe`"]:::blocked
4NB.3["`*4NB.3*<br/>**Build**<br/>appImage`"]:::blocked

4NB.2 & 4NB.3 --> m4{"`**Milestone 4**<br/>Desktop App`"}:::mile

classDef open fill:#ff9;
classDef blocked fill:#f9f;
classDef mile fill:#9ff;
```

### To Do

- [ ] **4GC.1** — Create file picker UI for CSV input
- [ ] **4GC.2** — Add validation results display panel
- [ ] **4GC.3** — Add XML preview panel (show output before saving)

### Blocked

- [ ] **4GC.4** — Implement output file save dialog — **depends on 4GC.1, 4GC.3**
- [ ] **4GC.6** — Add configuration UI (manage field mappings and preferences) — **depends on 4GC.4**
- [ ] **4GC.7** — Add basic error handling and user feedback — **depends on 4GC.2**
- [ ] **4GC.8** — Create `/convert` SvelteKit route — **depends on 4GC.4**
- [ ] **4GC.9** — Create `/validate` SvelteKit route — **depends on 4GC.4**
- [ ] **4GC.10** — Create `/check` SvelteKit route — **depends on 4GC.4**
- [ ] **4GC.5** — Show cross-submission warnings in UI — **depends on 4GC.10**
- [ ] **4NB.1** — Compile macOS `.app` build — **depends on 4GC.5, 4GC.6, 4GC.7**
- [ ] **4NB.2** — Compile Windows `.exe` build — **depends on 4NB.1**
- [ ] **4NB.3** — Compile Linux `.AppImage` build — **depends on 4NB.1**

---

## M5: Production Ready

> [!IMPORTANT]
> **Goal:** Comprehensive documentation for production deployment

> [!NOTE]
> **Category:** UD (User Documentation)

```mermaid
---
title: Milestone 5 — Production Ready
---
graph TD

m4{"`**Milestone 4**<br/>Desktop App`"}:::mile --> 5UD.1

5UD.1["`*5UD.1*<br/>**Doc**<br/>ILR XML`"]:::open --> 5UD.2
5UD.2["`*5UD.2*<br/>**Doc**<br/>Transformation reference`"]:::blocked --> m5

m5{"`**Milestone 5**<br/>Production Ready`"}:::mile

classDef open fill:#ff9;
classDef blocked fill:#f9f;
classDef mile fill:#9ff;
```

### To Do

- [ ] **5UD.1** — Document ILR XML structure and requirements

### Blocked

- [ ] **5UD.2** — Create transformation logic reference (Airtable formulas → TypeScript) — **depends on 5UD.1**

---

## Phase 2 Progress Map

```mermaid
---
title: Phase 2 — Complete Picture
---
graph TD

phase1{"`**Phase 1**`"}:::mile --> m3start

%% M3 %%
subgraph m3_group["`**M3: CLI Completion**`"]
    m3start[ ]:::hidden
    3DC.1["`*3DC.1* --help`"]:::open
    3DC.2["`*3DC.2* test automation`"]:::blocked
    3DC.3["`*3DC.3* --interactive`"]:::blocked
end

m3start --> 3DC.1
3DC.1 --> 3DC.2
3DC.2 --> 3DC.3
3DC.3 --> m3

m3{"`**M3**`"}:::mile --> m4start

%% M4 %%
subgraph m4_group["`**M4: Desktop Interface**`"]
    m4start[ ]:::hidden
    4GC.1["`*4GC.1* file picker`"]:::open
    4GC.2["`*4GC.2* validation results`"]:::open
    4GC.3["`*4GC.3* XML preview`"]:::open
    4GC.4["`*4GC.4* save dialog`"]:::blocked
    4GC.6["`*4GC.6* config UI`"]:::blocked
    4GC.7["`*4GC.7* error feedback`"]:::blocked
    4GC.8["`*4GC.8* /convert`"]:::blocked
    4GC.9["`*4GC.9* /validate`"]:::blocked
    4GC.10["`*4GC.10* /check`"]:::blocked
    4GC.5["`*4GC.5* warnings`"]:::blocked
    4NB.1["`*4NB.1* .dmg`"]:::blocked
    4NB.2["`*4NB.2* .exe`"]:::blocked
    4NB.3["`*4NB.3* .AppImage`"]:::blocked
end

m4start --> 4GC.1 & 4GC.2 & 4GC.3
4GC.1 --> 4GC.4
4GC.3 --> 4GC.4
4GC.4 --> 4GC.6 & 4GC.8 & 4GC.9 & 4GC.10
4GC.2 --> 4GC.7
4GC.7 --> 4NB.1
4GC.8 --> 4GC.7
4GC.9 --> 4GC.2
4GC.10 --> 4GC.5 & 4GC.7
4GC.5 --> 4NB.1
4GC.6 --> 4NB.1
4NB.1 --> 4NB.2 & 4NB.3
4NB.2 --> m4
4NB.3 --> m4

m4{"`**M4**`"}:::mile --> m5start

%% M5 %%
subgraph m5_group["`**M5: Production Docs**`"]
    m5start[ ]:::hidden
    5UD.1["`*5UD.1* ILR XML docs`"]:::open
    5UD.2["`*5UD.2* transform ref`"]:::blocked
end

m5start --> 5UD.1
5UD.1 --> 5UD.2
5UD.2 --> m5

m5{"`**M5**`"}:::mile

classDef open fill:#ff9;
classDef blocked fill:#f9f;
classDef mile fill:#9ff;
classDef hidden display:none;
```

---

**Next:** [Phase 3: Future Features](./phase-3-future-features.md)

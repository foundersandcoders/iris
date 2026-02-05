# Phase 1: MVP Features

| Sub-Milestone | Focus | Status |
|---------------|-------|--------|
| **M2A** | Core TUI Screens | In Progress |
| **M2B** | Direct Commands | To Do |
| **M2C** | Advanced TUI + Polish + Docs | Blocked (depends on M2A + M2B) |

**Prerequisite:** Milestone 1 (Shared Core Library) — ✅ Complete

---

## Colour Key

```mermaid
graph TD
    must_open[Must - Open]:::must-open
    must_blocked[Must - Blocked]:::must-blocked
    should_open[Should - Open]:::should-open
    should_blocked[Should - Blocked]:::should-blocked
    could_open[Could - Open]:::could-open
    could_blocked[Could - Blocked]:::could-blocked

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

## Note: New Categories

**DC (Direct Commands)** and **UD (User Documentation)** are new categories added to Milestone 2 (originally part of M3 and M5).

---

## Milestone 1: Shared Core Library

<details>
<summary><strong>✅ Complete</strong></summary>

> [!IMPORTANT]
> **Dynamic Schema Prerequisite**
> - Annual ESFA schema updates must not require code changes.
> - The dynamic schema system (Phases 1-4) enables loading new XSD files at runtime.
> - Phase 5 (TUI schema management) is deferred to Milestone 2.

> [!NOTE]
> **Key**
> - CL (base utils)
> - SG (schema system)
> - SS (schema/mapping storage)
> - WA (workflow abstractions)

- [x] 1CL.1. Implement CSV parser with header-based column matching
- [x] 1CL.2. Create ILR XML generator (minimal valid structure)
- [x] 1CL.3. Build semantic validator (beyond structural checks)
- [x] 1CL.4. Create XML parser module (`src/lib/xml-parser.ts`)
	- [x] 1CL.4a. Add XML parser library (fast-xml-parser or equivalent)
- [x] 1CL.5. Add unit tests for core transformations
- [x] 1SG.1. Implement **Dynamic Schema (Phase 1): XSD Parser & Schema Registry**
	- [x] 1SG.1a. Create schema type definitions (SchemaElement, SchemaConstraints, SchemaRegistry)
	- [x] 1SG.1b. Add fast-xml-parser dependency
	- [x] 1SG.1c. Implement XSD parser (parse XSD as XML, extract element definitions)
	- [x] 1SG.1d. Implement schema registry builder (transform XSD tree into queryable registry)
	- [x] 1SG.1e. Add tests against actual schemafile25.xsd
- [x] 1SG.2. Implement **Dynamic Schema (Phase 2): Schema-Driven Validator**
	- [x] 1SG.2a. Create schema validator module (validates data against registry constraints)
	- [x] 1SG.2b. Implement constraint validation (pattern, length, range, cardinality, enumeration)
	- [x] 1SG.2c. Migrate existing validator to use schema registry (remove hardcoded REQUIRED_FIELDS)
- [x] 1SG.3. Implement **Dynamic Schema (Phase 3): Schema-Driven Generator**
	- [x] 1SG.3a. Create schema generator module (generate XML by traversing registry)
	- [x] 1SG.3b. Implement element ordering from xs:sequence
	- [x] 1SG.3c. Migrate existing generator to use schema registry (remove hardcoded interfaces)
- [x] 1SG.4. Implement **Dynamic Schema (Phase 4): Column Mapping Configuration**
	- [x] 1SG.4a. Create column mapper module (CSV column → XSD path mapping)
	- [x] 1SG.4b. Define mapping configuration schema (ColumnMapping, MappingConfig types)
	- [x] 1SG.4c. Create default FaC Airtable mapping configuration
	- [x] 1SG.4d. Migrate convert workflow to use column mapper (remove hardcoded rowToLearner & rowToDelivery)
- [x] 1SS.1. Implement storage abstractions for cross-submission history (supports config, mappings, schemas, submissions, history)
- [x] 1SS.2. Configuration system (user preferences + custom field mappings in `~/.iris/config.json`)
- [x] 1SS.3. Load mapping config from file (read JSON, validate structure)
- [x] 1SS.4. Save mapping config to file (write JSON, handle errors)
- [x] 1SS.5. List available mapping configs (scan `~/.iris/mappings/` directory)
- [x] 1SS.6. Validate mapping config against active schema (verify XSD paths exist, builder paths)
- [x] 1SS.7. Document config file format and versioning (explain configVersion, mappingVersion, formatVersion, schemaVersion)
- [x] 1WA.1. Define workflow step interfaces (types, status, data, errors)
- [x] 1WA.2. Create workflow abstraction consumption layer (interface-agnostic generators)
- [x] 1WA.3. Implement `validateCsv` workflow (`load CSV → parse CSV → validate CSV → print report`)
- [x] 1WA.4. Implement `convertCsv` workflow (`load CSV parse → validate CSV → generate XML → save XML`)
- [x] 1WA.5. Implement `validateXml` workflow (`load/generate XML → parse XML → validate XML → print report`)
- [x] 1WA.7. Implement `check` workflow (`load XML → load XML or history → compare → print report`)
- [x] 1WA.8. Add unit tests for `validateCsv` (independent of UI)
- [x] 1WA.9. Add unit tests for `convertCsv` (independent of UI)
- [x] 1WA.10. Add unit tests for `validateXml` (independent of UI)
- [x] 1WA.11. Add unit tests for `check` (independent of UI)
- [x] 1WA.12. Add round-trip tests (`load CSV → validate CSV → create XML → validate XML → passes`)
- [x] 1WA.13. Refactor workflow to yield step copies (prevent reference mutation issues)
- [x] 1WA.14. Add helper to consume workflow generator and capture return value in single pass
- [x] 1WA.15. Add mapping config parameter to `convertCsv` workflow (select which mapping to use)
- [x] 1WA.16. Migrate `csvConvert` workflow to use storage (replace Bun.write + .keep hack)
- [x] 1WA.18. Migrate TUI processing screen to use storage for schema loading
- [x] 1WA.19. Migrate `configTypes.ts` to use storage (replace hardcoded defaults)
- [x] 2TI.1. Set up TUI libraries (terminal-kit, consola, chalk, ora, cli-table3, boxen, figures, gradient-string, listr2)
- [x] 2TI.2. Create TUI application scaffold and theme system
- [x] 2TI.3. Build dashboard with menu navigation (recent activity panel pending)
    - [x] 2TI.3a. Define screen routing and navigation architecture (Router class, screen stack, transitions)
    - [x] 2TI.3b. Implement consistent layout system (header, content, status bar, borders)
    - [x] 2TI.3c. Refactor dashboard to use layout system
- [x] 2TI.4. Implement interactive file picker for CSV selection
- [x] 2TI.5. Create processing screen with live progress and log viewer
- [x] 2TI.6. Live processing screen with progress and logs
- [x] 2TS.1. Create schema loader module (load/cache schemas from ~/.iris/schemas/) — exists in core lib (`storage.loadSchema()`)

</details>

---

## M2A: Core TUI Screens

> [!IMPORTANT]
> **Goal:** Beautiful, interactive terminal interface for core workflows

> [!NOTE]
> **Category:** TI (TUI Interface)

```mermaid
---
title: M2A — Core TUI Screens
---
graph TD

2TI.11["`*2TI.11*<br/>**MUST**<br/>keyboard navigation`"]:::must-open --> 2TI.13 & 2TI.7 & 2TI.12

2TI.13["`*2TI.13*<br/>**MUST**<br/>convert screen`"]:::must-blocked --> 2TI.14 & 2TI.8
2TI.7["`*2TI.7*<br/>**MUST**<br/>validation explorer`"]:::must-blocked --> 2TI.14 & 2TI.15 & 2TI.8

2TI.14["`*2TI.14*<br/>**MUST**<br/>validate screen`"]:::must-blocked --> 2TI.15 & 2TI.8
2TI.15["`*2TI.15*<br/>**MUST**<br/>check screen`"]:::must-blocked --> 2TI.17 & 2TI.8

2TI.12["`*2TI.12*<br/>**SHOULD**<br/>contextual help`"]:::should-blocked

2TI.8["`*2TI.8*<br/>**SHOULD**<br/>success screen`"]:::should-blocked

2TI.17["`*2TI.17*<br/>**MUST**<br/>test w/ real data`"]:::must-blocked --> m2a

m2a{"`**M2A Complete**`"}:::mile

classDef must-open fill:#D6A3BF,color:#000;
classDef must-blocked fill:#F3D8E6,color:#000;
classDef should-open fill:#6F2A52,color:#fff;
classDef should-blocked fill:#A45A84,color:#fff;
classDef could-open fill:#3E7F96,color:#fff;
classDef could-blocked fill:#5FA3BA,color:#fff;
classDef mile fill:#E8EFF6,color:#000;
```

### Must Have

- [ ] **2TI.11** — Implement keyboard navigation (arrows, vim-style, shortcuts)
- [ ] **2TI.13** — Build convert workflow screen (file select → process → results) — **depends on 2TI.11**
- [ ] **2TI.7** — Build validation results explorer (error/warning navigation) — **depends on 2TI.11**
- [ ] **2TI.14** — Build validate workflow screen (file select → validate → explore errors) — **depends on 2TI.13, 2TI.7**
- [ ] **2TI.15** — Build cross-submission check workflow — **depends on 2TI.14, 2TI.7**
- [ ] **2TI.17** — Test TUI with real CSV exports from Airtable — **depends on 2TI.15**

### Should Have

- [ ] **2TI.12** — Add help overlay system (contextual help) — **depends on 2TI.11**
- [ ] **2TI.8** — Implement success/completion screen with next actions — **depends on 2TI.7, 2TI.13, 2TI.14, 2TI.15**

---

## M2B: Direct Commands

> [!IMPORTANT]
> **Goal:** Scriptable commands for automation and power users

> [!NOTE]
> **Category:** DC (Direct Commands)

```mermaid
---
title: M2B — Direct Commands
---
graph TD

2DC.2["`*2DC.2*<br/>**SHOULD**<br/>iris convert`"]:::should-open --> 2DC.4
2DC.3["`*2DC.3*<br/>**SHOULD**<br/>iris validate`"]:::should-open --> 2DC.4

2DC.4["`*2DC.4*<br/>**COULD**<br/>iris check`"]:::could-blocked --> m2b

m2b{"`**M2B Complete**`"}:::mile

classDef must-open fill:#D6A3BF,color:#000;
classDef must-blocked fill:#F3D8E6,color:#000;
classDef should-open fill:#6F2A52,color:#fff;
classDef should-blocked fill:#A45A84,color:#fff;
classDef could-open fill:#3E7F96,color:#fff;
classDef could-blocked fill:#5FA3BA,color:#fff;
classDef mile fill:#E8EFF6,color:#000;
```

### Should Have

- [ ] **2DC.2** — Implement `iris convert <file>` (non-TUI execution with pretty output)
- [ ] **2DC.3** — Implement `iris validate <file>` (non-TUI validation)

### Could Have

- [ ] **2DC.4** — Implement `iris check` (non-TUI cross-submission check) — **depends on 2DC.2, 2DC.3**

---

## M2C: Advanced TUI + Polish + Docs

> [!IMPORTANT]
> **Goal:** Mapping builder, schema management, settings, and documentation
>
> **Prerequisite:** M2A + M2B must be complete

> [!NOTE]
> **Categories:**
> - TM (Mapping Builder TUI)
> - TS (Schema Management TUI)
> - UD (User Documentation)

```mermaid
---
title: M2C — Advanced TUI + Polish + Docs
---
graph TD

m2a{"`**M2A**`"}:::mile -.-> 2TM.2 & 2TI.10 & 2TS.2 & 2TI.18 & 2UD.1 & 2UD.2
m2b{"`**M2B**`"}:::mile -.-> 2TM.2 & 2TI.10 & 2TS.2 & 2TI.18 & 2UD.1 & 2UD.2

2TM.2["`*2TM.2*<br/>**MUST**<br/>CSV→XML mapping UI`"]:::must-open --> 2TM.3
2TM.3["`*2TM.3*<br/>**MUST**<br/>mapping preview`"]:::must-blocked --> 2TM.1
2TM.1["`*2TM.1*<br/>**MUST**<br/>mapping builder screen`"]:::must-blocked --> 2TM.4
2TM.4["`*2TM.4*<br/>**MUST**<br/>save mapping dialog`"]:::must-blocked --> 2TI.9 & 2TS.4

2TI.9["`*2TI.9*<br/>**SHOULD**<br/>settings screen`"]:::should-blocked --> 2TI.19

2TS.2["`*2TS.2*<br/>**COULD**<br/>schema manager screen`"]:::could-open --> 2TS.3 & 2TI.19
2TS.3["`*2TS.3*<br/>**COULD**<br/>schema version selector`"]:::could-blocked --> 2TS.4
2TS.4["`*2TS.4*<br/>**COULD**<br/>dynamic migration guidance`"]:::could-blocked

2TI.19["`*2TI.19*<br/>**COULD**<br/>schema settings integration`"]:::could-blocked

2TI.10["`*2TI.10*<br/>**MUST**<br/>submission history browser`"]:::must-open
2TI.18["`*2TI.18*<br/>**SHOULD**<br/>visual feedback/polish`"]:::should-open
2UD.1["`*2UD.1*<br/>**MUST**<br/>user guide`"]:::must-open
2UD.2["`*2UD.2*<br/>**COULD**<br/>validation rules docs`"]:::could-open

2TM.4 & 2TI.9 & 2TS.4 & 2TI.19 & 2TI.10 & 2TI.18 & 2UD.1 & 2UD.2 --> m2c

m2c{"`**M2C Complete**`"}:::mile

classDef must-open fill:#D6A3BF,color:#000;
classDef must-blocked fill:#F3D8E6,color:#000;
classDef should-open fill:#6F2A52,color:#fff;
classDef should-blocked fill:#A45A84,color:#fff;
classDef could-open fill:#3E7F96,color:#fff;
classDef could-blocked fill:#5FA3BA,color:#fff;
classDef mile fill:#E8EFF6,color:#000;
```

### Must Have

- [ ] **2TM.2** — Implement CSV column → XSD path mapping UI (interactive path selector)
- [ ] **2TM.3** — Add mapping preview/validation (show which fields will map, highlight issues) — **depends on 2TM.2**
- [ ] **2TM.1** — Build mapping builder screen (list available mappings, create new) — **depends on 2TM.3**
- [ ] **2TM.4** — Implement mapping save dialog (name, description, set as default) — **depends on 2TM.1**
- [ ] **2TI.10** — Create submission history browser
- [ ] **2UD.1** — Write user guide for non-technical users

### Should Have

- [ ] **2TI.9** — Add settings management screen — **depends on 2TM.4**
- [ ] **2TI.18** — Add visual feedback (animations, transitions, spinners)

### Could Have

- [ ] **2TS.2** — Build schema manager TUI screen (upload, list, select active schema)
- [ ] **2TS.3** — Add schema version selection to workflows — **depends on 2TS.2**
- [ ] **2TS.4** — Implement migration guidance when schema changes affect existing mappings — **depends on 2TS.3, 2TM.4, 2TI.12**
- [ ] **2TI.19** — Add schema management settings to settings screen — **depends on 2TS.2, 2TI.9**
- [ ] **2UD.2** — Document validation rules and error messages

---

## Phase 1 Progress Map

```mermaid
---
title: Phase 1 — Complete Picture
---
graph TD

%% M2A Tasks %%
2TI.11["`*2TI.11*<br/>feat<br/>keyboard nav`"]:::must-open
2TI.13["`*2TI.13*<br/>screen<br/>convert`"]:::must-blocked
2TI.7["`*2TI.7*<br/>component<br/>validation explorer`"]:::must-blocked
2TI.14["`*2TI.14*<br/>screen<br/>validate`"]:::must-blocked
2TI.15["`*2TI.15*<br/>screen<br/>check`"]:::must-blocked
2TI.17["`*2TI.17*<br/>test<br/>real data`"]:::must-blocked
2TI.12["`*2TI.12*<br/>component<br/>help`"]:::should-blocked
2TI.8["`*2TI.8*<br/>screen<br/>success`"]:::should-blocked

%% M2B Tasks %%
2DC.2["`*2DC.2*<br/>command<br/>convert`"]:::should-open
2DC.3["`*2DC.3*<br/>command<br/>validate`"]:::should-open
2DC.4["`*2DC.4*<br/>command<br/>check`"]:::could-blocked

%% M2C Tasks %%
2TM.2["`*2TM.2*<br/>component<br/>mapping UI`"]:::must-open
2TM.3["`*2TM.3*<br/>component<br/>mapping preview`"]:::must-blocked
2TM.1["`*2TM.1*<br/>screen<br/>builder`"]:::must-blocked
2TM.4["`*2TM.4*<br/>component<br/>save dialog`"]:::must-blocked
2TI.9["`*2TI.9*<br/>screen<br/>settings`"]:::should-blocked
2TS.2["`*2TS.2*<br/>feat<br/>schema mgr`"]:::could-open
2TS.3["`*2TS.3*<br/>component<br/>schema selector`"]:::could-blocked
2TS.4["`*2TS.4*<br/>component</br>migration`"]:::could-blocked
2TI.19["`*2TI.19*<br/>enhance<br/>schema settings`"]:::could-blocked
2TI.10["`*2TI.10*<br/>screen<br/>history`"]:::must-open
2TI.18["`*2TI.18*<br/>enhance<br/>polish`"]:::should-open
2UD.1["`*2UD.1*<br/>doc<br/>user guide`"]:::must-open
2UD.2["`*2UD.2*<br/>doc<br/>val rules`"]:::could-open

%% Milestone nodes %%
phase1{"`**Phase 1**<br/>Complete`"}:::mile

%% M2A Dependencies %%
2TI.11 --> 2TI.13 & 2TI.7 & 2TI.12
2TI.13 --> 2TI.14 & 2TI.8
2TI.7 --> 2TI.14 & 2TI.15 & 2TI.8
2TI.14 --> 2TI.15 & 2TI.8
2TI.15 --> 2TI.12 & 2TI.17 & 2TI.8
2TI.12 --> 2TI.17

%% M2B Dependencies %%
2TI.8 & 2TI.17 --> 2DC.2
2DC.2 --> 2DC.3
2DC.3 -.-> 2DC.4
2DC.3 --> 2TM.2 & 2TI.10 & 2TS.2 & 2TI.18 & 2UD.1

%% M2C Dependencies %%
2TM.2 --> 2TM.3
2TM.3 --> 2TM.1
2TM.1 --> 2TM.4
2TM.4 --> 2TI.9
2TS.3 --> 2TS.4
2TI.9 & 2TI.10 & 2TI.18 & 2UD.1 --> phase1

%% OPTIONAL %%
2UD.1 -.->| optional | 2UD.2
2TI.9 -.->| optional | 2TI.19
2TM.4 -.->| optional | 2TS.4
2DC.3 -.->| optional | 2TS.2
2TS.2 -.->| optional | 2TS.3 & 2TI.19
2DC.4 & 2TI.19 & 2TS.4 & 2UD.2 -.->| optional | phase1

classDef must-open fill:#D6A3BF,color:#000;
classDef must-blocked fill:#F3D8E6,color:#000;
classDef should-open fill:#6F2A52,color:#fff;
classDef should-blocked fill:#A45A84,color:#fff;
classDef could-open fill:#3E7F96,color:#fff;
classDef could-blocked fill:#5FA3BA,color:#fff;
classDef mile fill:#E8EFF6,color:#000;
```

---

**Next:** [Phase 2: Production Features](./phase-2-production-features.md)

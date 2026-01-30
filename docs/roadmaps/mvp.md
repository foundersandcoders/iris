# Iris: MVP

| Area | Status                                        | Next Up |
| ---- | --------------------------------------------- | ------- |
| Core | **Dynamic schema system complete** (Phases 1-4) | round-trip tests; cross-check workflow |
| CLI  | TUI launches                                  | direct commands |
| TUI  | Basic screens & navigation                    | validation explorer; workflows; schema manager |
| GUI  | SvelteKit configured                          | (blocked on TUI completion) |

---
## 1. Tasks
### 1a. Open Tasks
#### 1a1. Due Tasks
None

#### 1a2. Other Tasks
##### 1a2a. Core Processing Library
- [x] 1a2a1. Implement CSV parser with header-based column matching
- [x] 1a2a2. Create ILR XML generator (minimal valid structure)
- [x] 1a2a3. Build semantic validator (beyond structural checks)
- [ ] 1a2a4. Implement storage abstraction for cross-submission history (must support future ESFA response storage)
- [ ] 1a2a5. Add configuration system (user preferences + custom field mappings)
- [x] 1a2a6. Add unit tests for core transformations
- [x] 1a2a7. Create workflow abstraction layer (convert, validate, check as generators)
- [x] 1a2a8. Define workflow step interfaces (types, status, data, errors)
- [x] 1a2a9. Implement convert workflow (parse → validate → generate → save)
- [x] 1a2a10. Implement validate-csv workflow (load → parse → validate → report)
- [x] 1a2a10b. Add XML parser library (fast-xml-parser or equivalent)
- [x] 1a2a10c. Create XML parser module (src/lib/xml-parser.ts)
- [x] 1a2a10d. Implement validate-xml workflow (load → parse → validate → report)
- [ ] 1a2a10e. Add round-trip tests (CSV → XML → validate-xml → passes)
- [ ] 1a2a11. Implement cross-check workflow (load history → compare → report)
- [x] 1a2a12. Add unit tests for workflows (independent of UI)
- [ ] 1a2a13. Refactor workflow to yield step copies (prevent reference mutation issues)
- [ ] 1a2a14. Add helper to consume workflow generator and capture return value in single pass

##### 1a2a-schema. Dynamic Schema System (XSD-Driven)
> Replaces hardcoded ILR structure with runtime schema loading. Annual ESFA updates require only new XSD file.

**Phase 1: XSD Parser & Schema Registry**
- [x] 1a2a-schema1. Create schema type definitions (SchemaElement, SchemaConstraints, SchemaRegistry)
- [x] 1a2a-schema2. Add fast-xml-parser dependency
- [x] 1a2a-schema3. Implement XSD parser (parse XSD as XML, extract element definitions)
- [x] 1a2a-schema4. Implement schema registry builder (transform XSD tree into queryable registry)
- [x] 1a2a-schema5. Add tests against actual schemafile25.xsd

**Phase 2: Schema-Driven Validator**
- [x] 1a2a-schema6. Create schema validator module (validates data against registry constraints)
- [x] 1a2a-schema7. Implement constraint validation (pattern, length, range, cardinality, enumeration)
- [x] 1a2a-schema8. Migrate existing validator to use schema registry (remove hardcoded REQUIRED_FIELDS)

**Phase 3: Schema-Driven Generator**
- [x] 1a2a-schema9. Create schema generator module (generate XML by traversing registry)
- [x] 1a2a-schema10. Implement element ordering from xs:sequence
- [x] 1a2a-schema11. Migrate existing generator to use schema registry (remove hardcoded interfaces)

**Phase 4: Column Mapping Configuration**
- [x] 1a2a-schema12. Create column mapper module (CSV column → XSD path mapping)
- [x] 1a2a-schema13. Define mapping configuration schema (ColumnMapping, MappingConfig types)
- [x] 1a2a-schema14. Create default FaC Airtable mapping configuration
- [x] 1a2a-schema15. Migrate convert workflow to use column mapper (remove hardcoded rowToLearner/rowToDelivery)

**Phase 5: Schema & Mapping Storage**
- [ ] 1a2a-schema16. Create schema storage module (save/load/cache XSD files from ~/.iris/schemas/)
- [ ] 1a2a-schema17. Create mapping storage module (save/load mapping configs from ~/.iris/mappings/<name>.json)
- [ ] 1a2a-schema18. Add schema validation on load (verify XSD is parseable, warn on errors)
- [ ] 1a2a-schema19. Add mapping validation on load (verify CSV columns exist, XSD paths valid, transforms registered)
- [ ] 1a2a-schema20. Implement mapping preview generator (CSV sample row → XML fragment for testing)

##### 1a2b. TUI Interface (Primary)
- [x] 1a2b1. Set up TUI libraries (terminal-kit, consola, chalk, ora, cli-table3, boxen, figures, gradient-string, listr2)
- [x] 1a2b2. Create TUI application scaffold and theme system
- [x] 1a2b3. Build dashboard with menu navigation (recent activity panel pending)
    - [x] 1a2b3a. Define screen routing and navigation architecture (Router class, screen stack, transitions)
    - [x] 1a2b3b. Implement consistent layout system (header, content, status bar, borders)
    - [x] 1a2b3c. Refactor dashboard to use layout system
- [x] 1a2b4. Implement interactive file picker for CSV selection
- [x] 1a2b5. Create processing screen with live progress and log viewer
- [ ] 1a2b6. Build validation results explorer (error/warning navigation)
- [ ] 1a2b7. Implement success/completion screen with next actions
- [ ] 1a2b8. Add settings management screen
- [ ] 1a2b9. Create submission history browser
- [ ] 1a2b10. Implement keyboard navigation (arrows, vim-style, shortcuts)
- [ ] 1a2b11. Add help overlay system (contextual help)
- [ ] 1a2b12. Build convert workflow (file select → process → results)
- [ ] 1a2b13. Build validate workflow (file select → validate → explore errors)
- [ ] 1a2b14. Build cross-submission check workflow
- [ ] 1a2b15. Add visual feedback (animations, transitions, spinners)
- [ ] 1a2b16. Test TUI with real CSV exports from Airtable

**Schema Management (Phase 6 of Dynamic Schema System - TUI)**
- [ ] 1a2b17. Build schema manager TUI screen (list available schemas, import new XSD files)
- [ ] 1a2b18. Add schema version selection to convert workflow (choose which schema to validate against)
- [ ] 1a2b19. Implement migration guidance when schema changes affect existing mappings (show diff, suggest updates)
- [ ] 1a2b20. Add schema detail view (show schema metadata, element count, validation rules)

**Mapping Builder (Phase 7 of Dynamic Schema System - TUI)**
> Interactive wizard for users to create custom CSV→XSD mappings without editing code

- [ ] 1a2b21. Build mapping manager TUI screen (list, create, edit, delete, duplicate mapping configs)
- [ ] 1a2b22. Implement mapping wizard workflow (select CSV → select schema → map fields → save)
- [ ] 1a2b23. Build CSV column selector UI (parse CSV, show headers with sample data preview)
- [ ] 1a2b24. Build XSD path browser UI (tree navigation, show element constraints/types, pick target path)
- [ ] 1a2b25. Build field mapping editor (assign CSV column → XSD path, select transform, test with sample)
- [ ] 1a2b26. Implement transform selector UI (dropdown of available transforms with descriptions)
- [ ] 1a2b27. Add mapping preview panel (live preview: sample CSV row → generated XML fragment)
- [ ] 1a2b28. Implement validation during mapping creation (warn: missing columns, invalid paths, incompatible transforms)
- [ ] 1a2b29. Add nested element builder UI (wizard for FAM/AppFin/Employment template creation)
- [ ] 1a2b30. Add mapping selection to convert workflow (choose which mapping config to use before conversion)
- [ ] 1a2b31. Test mapping builder with non-FaC CSV exports (validate flexibility for other providers)

##### 1a2c. Direct Commands (Automation)
- [ ] 1a2c1. Implement `iris convert <file>` (non-TUI execution with pretty output)
- [ ] 1a2c2. Implement `iris validate <file>` (non-TUI validation)
- [ ] 1a2c3. Implement `iris check` (non-TUI cross-submission check)
- [ ] 1a2c4. Implement `iris --help` and command-specific help
- [ ] 1a2c5. Add `--interactive` flag to launch TUI for specific workflows
- [ ] 1a2c6. Test direct commands in automation/scripting scenarios

##### 1a2e. Desktop Interface
- [ ] 1a2e1. Create file picker UI for CSV input
- [ ] 1a2e2. Add validation results display panel
- [ ] 1a2e3. Add XML preview panel (show output before saving)
- [ ] 1a2e4. Implement output file save dialog
- [ ] 1a2e5. Show cross-submission warnings in UI
- [ ] 1a2e6. Add basic error handling and user feedback

**Desktop: Schema & Mapping Management (mirrors TUI Phase 6-7)**
- [ ] 1a2e7. Build schema manager UI (list schemas, import XSD, select active schema)
- [ ] 1a2e8. Build mapping manager UI (list, create, edit, delete mapping configs)
- [ ] 1a2e9. Implement mapping wizard (visual CSV→XSD mapper with drag-and-drop)
- [ ] 1a2e10. Add mapping preview panel (live CSV sample → XML output)

##### 1a2f. Documentation
- [ ] 1a2f1. Document ILR XML structure and requirements
- [ ] 1a2f2. Create transformation logic reference (Airtable formulas → TypeScript)
- [ ] 1a2f3. Write user guide for non-technical users
- [ ] 1a2f4. Document validation rules and error messages

### 1b. Blocked Tasks
None currently

---

## 2. MVP Milestones
### 2a. Milestone 1: Shared Core Library
> [!NOTE]
> **Goal:** Working transformation engine used by both interfaces

**Deliverables:**
- [x] CSV parser that tolerates column reordering
- [x] ILR XML generator producing valid output
- [x] Semantic validation beyond structural checks
- [ ] Workflow abstraction layer (interface-agnostic generators)
    - [x] convert (CSV → XML)
    - [x] validate-csv (pre-conversion validation)
    - [x] validate-xml (post-generation verification)
    - [ ] check (cross-submission consistency)
- [ ] File-based storage for cross-submission data (designed to support future ESFA response storage)
- [ ] Configuration system (user preferences + custom field mappings in `~/.iris/config.json`)
    - [ ] Phase 5: Schema & Mapping Storage (see 1a2a-schema16-20)
- [x] Test coverage for core transformations and workflows
- [x] **Dynamic Schema System (Phases 1-4)** — see [1a2a-schema tasks](#1a2a-schema-dynamic-schema-system-xsd-driven)
    - [x] XSD parser and schema registry
    - [x] Schema-driven validator (replaces hardcoded validation rules)
    - [x] Schema-driven generator (fully integrated: csvConvert uses generateFromSchema, legacy types removed)
    - [x] Column mapping configuration (CSV→XSD mapping without code changes)
        - [x] Column mapper module with types
        - [x] Default FaC Airtable mapping with nested element builders
        - [x] Workflow migration (mapCsvToSchemaWithAims integrated into csvConvert)

> [!IMPORTANT]
> **XML Validation Prerequisite:** Milestone 1 cannot be considered complete without XML parsing and validation capabilities. The transformation engine must be able to verify its own output to ensure ILR compliance. See [Architecture Decision 1c1](#1c1-workflow-boundaries-csv-vs-xml-validation) for details.

> [!IMPORTANT]
> **Dynamic Schema Prerequisite:** Annual ESFA schema updates must not require code changes. The dynamic schema system (Phases 1-4) enables loading new XSD files at runtime. Phase 5 (TUI schema management) is deferred to Milestone 2.

### 2b. Milestone 2: TUI Interface (Primary)
> [!NOTE]
> **Goal:** Beautiful, interactive terminal interface as the main user experience

**Deliverables:**
- [x] Full-screen TUI Application (`iris` launches dashboard)
- [x] Screen routing with navigation stack (back navigation, breadcrumbs)
- [x] Consistent layout wrapper for all screens (header, content, status bar)
- [x] Interactive file picker with preview
- [x] Live processing screen with progress and logs
- [ ] Validation results explorer (navigate errors/warnings)
- [ ] Settings management screen
- [ ] Submission history browser
- [ ] Complete Workflows
    - [ ] convert
    - [ ] validate
    - [ ] cross-check
- [ ] Keyboard navigation (arrows, vim-style, shortcuts)
- [ ] Help overlay system
- [ ] Visual polish (animations, gradients, transitions)
- [ ] Global installation via `bun link`
- [ ] **Schema & Mapping Management (Phases 6-7)** — see [1a2b17-31 tasks](#schema-management-phase-6-of-dynamic-schema-system---tui)
      - [ ] Schema manager TUI (import, list, select schemas)
      - [ ] Mapping builder TUI (interactive CSV→XSD mapping wizard)
      - [ ] Mapping preview (live CSV sample → XML output)
      - [ ] Transform selection UI

### 2c. Milestone 3: Direct Commands (Automation)
> [!NOTE]
> **Goal:** Scriptable commands for automation and power users

**Deliverables:**
- [ ] Full Command Suite
      - [ ] `iris convert <file>` (non-TUI)
      - [ ] `iris validate <file>` (existing XML files)
      - [ ] `iris check` (cross-submission consistency)
- [ ] Arguments
      - [ ] `--interactive` (launch TUI for specific workflows)
      - [ ] `--help`: comprehensive help text
- [ ] Beautiful console output (consola, spinners, progress)
- [ ] CI/CD compatibility

### 2d. Milestone 4: Desktop Interface
> [!NOTE]
> **Goal:** Native cross-platform app for users who prefer GUI over terminal

**Status:** Follows TUI implementation, informed by TUI user feedback
**Platforms:** macOS, Windows, Linux (via Tauri)

**Deliverables:**
- [ ] Cross-Platform Builds
      - [ ] macOS `.app`
      - [ ] Windows `.exe`
      - [ ] Linux `.AppImage`)
- [ ] SvelteKit Routing
      - [ ] `/convert`
      - [ ] `/validate`
      - [ ] `/check`
- [ ] File picker for CSV input
- [ ] XML preview panel
- [ ] Validation results display
- [ ] Cross-submission warnings display
- [ ] Output save location selection
- [ ] Complete Workflows (using shared workflow layer)
      - [ ] convert
      - [ ] validate
      - [ ] cross-check

### 2e. Milestone 5: Production Ready
> [!NOTE]
> **Goal:** Replaces existing Electron tool in production

**Deliverables:**
- [ ] Validation against real Airtable exports
- [ ] All transformation logic from existing tool replicated
- [ ] User acceptance testing with FaC staff
- [ ] Code signing/distribution setup for target platforms
- [ ] First production submission using Iris

---

## 3. Beyond MVP: Future Features
### 3a. Post-Submission Error Prediction
- Analyze ILR XML and predict ESFA validation errors before actual submission
- Requires: historical submission data + actual ESFA response storage
- Machine learning or rule-based prediction based on past submission outcomes
- Architecture support: Storage abstraction must handle ESFA response data (designed in Milestone 1)

### 3b. Cross-Submission Analysis
- Historical trend reporting (submission patterns over time)
- Anomaly detection across submission periods
- Statistical analysis of submission outcomes

### 3c. Declarative Transformation Layer
- Define transformation rules in JSON/YAML
- Make business logic configurable without code changes
- Allow FaC staff to adjust rules themselves

### 3d. Enhanced Validation
- Integration with ESFA validation API (if available)
- More sophisticated semantic checks
- Custom rule definitions for FaC-specific requirements

### 3e. Multi-Provider Support
- Export configuration for other training providers
- Template system for different submission patterns
- Shareable transformation rule sets

### 3f. Dynamic Schema Support
> [!NOTE]
> **Moved to MVP:** Core dynamic schema functionality is now part of Milestones 1-2. See [1a2a-schema tasks](#1a2a-schema-dynamic-schema-system-xsd-driven) (Phases 1-4, M1) and [Schema Management tasks](#schema-management-phase-5-of-dynamic-schema-system) (Phase 5, M2).

**Remaining future enhancements:**
- Desktop UI for schema management (mirrors TUI functionality)
- Schema diff viewer (compare two XSD versions)
- Automated mapping suggestions when schema changes
- Schema validation report export

---

## 4. Work Records
See [`docs/work-records/`](../work-records/) for detailed development history.

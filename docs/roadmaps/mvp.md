# Iris: MVP

| Area | Implemented                                   | Next Up |
| ---- | --------------------------------------------- | ------- |
| Core | CSV parser; XML generator; semantic validator |         |
| CLI  | `iris` opens TUI                              |         |
| TUI  | routing & layout architecture                 |         |
| GUI  | sveltekit configuration                       |         |

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
- [ ] 1a2a7. Create workflow abstraction layer (convert, validate, check as generators)
- [ ] 1a2a8. Define workflow step interfaces (types, status, data, errors)
- [ ] 1a2a9. Implement convert workflow (parse → validate → generate → save)
- [ ] 1a2a10. Implement validate workflow (load → validate → report)
- [ ] 1a2a11. Implement cross-check workflow (load history → compare → report)
- [ ] 1a2a12. Add unit tests for workflows (independent of UI)

##### 1a2b. TUI Interface (Primary)
- [x] 1a2b1. Set up TUI libraries (terminal-kit, consola, chalk, ora, cli-table3, boxen, figures, gradient-string, listr2)
- [x] 1a2b2. Create TUI application scaffold and theme system
- [x] 1a2b3. Build dashboard with menu navigation (recent activity panel pending)
    - [x] 1a2b3a. Define screen routing and navigation architecture (Router class, screen stack, transitions)
    - [x] 1a2b3b. Implement consistent layout system (header, content, status bar, borders)
    - [x] 1a2b3c. Refactor dashboard to use layout system
- [ ] 1a2b4. Implement interactive file picker for CSV selection
- [ ] 1a2b5. Create processing screen with live progress and log viewer
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
- [ ] 1a2e6. Add configuration UI (manage field mappings and preferences)
- [ ] 1a2e7. Add basic error handling and user feedback

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
      - [ ] convert
      - [ ] validate
      - [ ] check
- [ ] File-based storage for cross-submission data (designed to support future ESFA response storage)
- [ ] Configuration system (user preferences + custom field mappings in `~/.iris/config.json`)
- [x] Test coverage for core transformations and workflows

### 2b. Milestone 2: TUI Interface (Primary)
> [!NOTE]
> **Goal:** Beautiful, interactive terminal interface as the main user experience

**Deliverables:**
- [x] Full-screen TUI Application (`iris` launches dashboard)
- [x] Screen routing with navigation stack (back navigation, breadcrumbs)
- [x] Consistent layout wrapper for all screens (header, content, status bar)
- [ ] Interactive file picker with preview
- [ ] Live processing screen with progress and logs
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
- [ ] Configuration UI
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
- Parse uploaded XSD files to extract field definitions and constraints
- Generate types and validation rules dynamically from schema
- Schema-driven XML generator (adapts output structure to loaded schema)
- UI for uploading and managing schema versions (TUI + Desktop)
- Automatic migration guidance when schema changes affect existing data
- Store schema files in `~/.iris/schemas/` with version tracking

---

## 4. Work Records
See [`docs/work-records/`](../work-records/) for detailed development history.

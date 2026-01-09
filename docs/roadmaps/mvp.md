# Iris: MVP

> [!NOTE]
> Project initialized. Core architecture in place. Ready to implement shared processing core.

---

## 1. Tasks

### 1a. Open Tasks

#### 1a1. Due Tasks
None currently

#### 1a2. Other Tasks

**Core Processing Library**
- [ ] Implement CSV parser with header-based column matching
- [ ] Create ILR XML generator (minimal valid structure)
- [ ] Build semantic validator (beyond structural checks)
- [ ] Implement storage abstraction for cross-submission history (must support future ESFA response storage)
- [ ] Add configuration system (user preferences + custom field mappings)
- [ ] Add unit tests for core transformations

**CLI Interface**
- [ ] Add rich terminal UI libraries (chalk, ora, cli-table3, boxen, figures)
- [ ] Implement `iris convert` command (CSV → ILR XML with preview option)
- [ ] Implement `iris validate` command (validate existing XML)
- [ ] Implement `iris check` command (cross-submission consistency)
- [ ] Implement `iris compare <month1> <month2>` command (cross-month inconsistency detection)
- [ ] Implement `iris config` command (manage user configuration)
- [ ] Add preview mode (summary or full XML output before save)
- [ ] Add comprehensive CLI help and error messages
- [ ] Test CLI with real CSV exports from Airtable

**Desktop Interface**
- [ ] Create file picker UI for CSV input
- [ ] Add validation results display panel
- [ ] Add XML preview panel (show output before saving)
- [ ] Implement output file save dialog
- [ ] Show cross-submission warnings in UI
- [ ] Add configuration UI (manage field mappings and preferences)
- [ ] Add basic error handling and user feedback

**Documentation**
- [ ] Document ILR XML structure and requirements
- [ ] Create transformation logic reference (Airtable formulas → TypeScript)
- [ ] Write user guide for non-technical users
- [ ] Document validation rules and error messages

### 1b. Blocked Tasks
None currently

---

## 2. MVP Milestones

### Milestone 1: Shared Core Library
**Goal:** Working transformation engine used by both interfaces

**Deliverables:**
- CSV parser that tolerates column reordering
- ILR XML generator producing valid output
- Semantic validation beyond structural checks
- File-based storage for cross-submission data (designed to support future ESFA response storage)
- Configuration system (user preferences + custom field mappings in `~/.iris/config.json`)
- Test coverage for core transformations

### Milestone 2: CLI Interface
**Goal:** Functional CLI for technical users and automation

**Deliverables:**
- Rich terminal UI (colored output, spinners, progress bars, formatted tables)
- `iris convert` command working end-to-end with preview mode
- `iris validate` for existing XML files
- `iris check` for cross-submission consistency
- `iris compare <month1> <month2>` for cross-month inconsistency detection (warns but allows)
- `iris config` for managing user configuration
- Global installation via `bun link`
- Comprehensive error messages and help text

### Milestone 3: Desktop Interface
**Goal:** Accessible native app for non-technical users

**Deliverables:**
- macOS `.app` bundle
- File picker for CSV input
- XML preview panel (show output before saving)
- Validation results display
- Configuration UI (field mappings and preferences)
- Cross-submission warnings display
- Output save location selection
- Basic but clear error handling

### Milestone 4: Production Ready
**Goal:** Replaces existing Electron tool in production

**Deliverables:**
- Validation against real Airtable exports
- All transformation logic from existing tool replicated
- User acceptance testing with FaC staff
- Code signing for macOS distribution
- First production submission using Iris

---

## 3. Beyond MVP: Future Features

**Post-Submission Error Prediction**
- Analyze ILR XML and predict ESFA validation errors before actual submission
- Requires: historical submission data + actual ESFA response storage
- Machine learning or rule-based prediction based on past submission outcomes
- Architecture support: Storage abstraction must handle ESFA response data (designed in Milestone 1)

**Cross-Submission Analysis**
- Historical trend reporting (submission patterns over time)
- Anomaly detection across submission periods
- Statistical analysis of submission outcomes

**Declarative Transformation Layer**
- Define transformation rules in JSON/YAML
- Make business logic configurable without code changes
- Allow FaC staff to adjust rules themselves

**Enhanced Validation**
- Integration with ESFA validation API (if available)
- More sophisticated semantic checks
- Custom rule definitions for FaC-specific requirements

**Multi-Provider Support**
- Export configuration for other training providers
- Template system for different submission patterns
- Shareable transformation rule sets

---

## 4. Work Record

### 4a. Completed Milestones

**2026-01-09: Project Initialization**
- Created Tauri + SvelteKit + bun architecture
- Set up shared core library structure
- Configured both CLI and desktop entry points
- Established development workflow and conventions
- **Impact:** Foundation in place for dual-interface implementation

### 4b. Completed Tasks

#### 4b1. Record of Past Deadlines
None yet

#### 4b2. Record of Other Completed Tasks

**2026-01-09:**
- Configured CLAUDE.md with Iris project details
- Set up package.json with bun, SvelteKit, Tauri dependencies
- Created SvelteKit configuration (adapter-static for Tauri)
- Initialized Tauri project structure
- Created basic CLI entry point with command structure
- Updated README with project-specific information

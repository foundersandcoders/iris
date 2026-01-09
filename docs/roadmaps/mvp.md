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
- [ ] Implement storage abstraction for cross-submission history
- [ ] Add unit tests for core transformations

**CLI Interface**
- [ ] Implement `iris convert` command (CSV → ILR XML)
- [ ] Implement `iris validate` command (validate existing XML)
- [ ] Implement `iris check` command (cross-submission consistency)
- [ ] Add comprehensive CLI help and error messages
- [ ] Test CLI with real CSV exports from Airtable

**Desktop Interface**
- [ ] Create file picker UI for CSV input
- [ ] Add validation results display panel
- [ ] Implement output file save dialog
- [ ] Show cross-submission warnings in UI
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

### Milestone 1: Shared Core Library ✓
**Goal:** Working transformation engine used by both interfaces

**Deliverables:**
- CSV parser that tolerates column reordering
- ILR XML generator producing valid output
- Semantic validation beyond structural checks
- File-based storage for cross-submission data
- Test coverage for core transformations

### Milestone 2: CLI Interface
**Goal:** Functional CLI for technical users and automation

**Deliverables:**
- `iris convert` command working end-to-end
- `iris validate` for existing XML files
- `iris check` for cross-submission consistency
- Global installation via `bun link`
- Comprehensive error messages

### Milestone 3: Desktop Interface
**Goal:** Accessible native app for non-technical users

**Deliverables:**
- macOS `.app` bundle
- File picker for CSV input
- Validation results display
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

**Cross-Submission Analysis**
- Historical trend reporting
- Prediction of submission outcomes based on past data
- Anomaly detection across submission periods

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

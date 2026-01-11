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

**TUI Interface (Primary)**
- [ ] Set up TUI libraries (terminal-kit, consola, chalk, ora, cli-table3, boxen, figures, gradient-string, listr2)
- [ ] Create TUI application scaffold and theme system
- [ ] Build dashboard with menu navigation and recent activity
- [ ] Implement interactive file picker for CSV selection
- [ ] Create processing screen with live progress and log viewer
- [ ] Build validation results explorer (error/warning navigation)
- [ ] Implement success/completion screen with next actions
- [ ] Add settings management screen
- [ ] Create submission history browser
- [ ] Implement keyboard navigation (arrows, vim-style, shortcuts)
- [ ] Add help overlay system (contextual help)
- [ ] Build convert workflow (file select → process → results)
- [ ] Build validate workflow (file select → validate → explore errors)
- [ ] Build cross-submission check workflow
- [ ] Add visual feedback (animations, transitions, spinners)
- [ ] Test TUI with real CSV exports from Airtable

**Direct Commands (Automation)**
- [ ] Implement `iris convert <file>` (non-TUI execution with pretty output)
- [ ] Implement `iris validate <file>` (non-TUI validation)
- [ ] Implement `iris check` (non-TUI cross-submission check)
- [ ] Implement `iris --help` and command-specific help
- [ ] Add `--interactive` flag to launch TUI for specific workflows
- [ ] Test direct commands in automation/scripting scenarios

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

### Milestone 2: TUI Interface (Primary)
**Goal:** Beautiful, interactive terminal interface as the main user experience

**Deliverables:**
- Full-screen TUI application (`iris` launches dashboard)
- Interactive file picker with preview
- Live processing screen with progress and logs
- Validation results explorer (navigate errors/warnings)
- Settings management screen
- Submission history browser
- Complete workflows: convert, validate, cross-check
- Keyboard navigation (arrows, vim-style, shortcuts)
- Help overlay system
- Visual polish (animations, gradients, transitions)
- Global installation via `bun link`

### Milestone 3: Direct Commands (Automation)
**Goal:** Scriptable commands for automation and power users

**Deliverables:**
- `iris convert <file>` working end-to-end (non-TUI)
- `iris validate <file>` for existing XML files
- `iris check` for cross-submission consistency
- Beautiful console output (consola, spinners, progress)
- `--interactive` flag to launch TUI for specific workflows
- Comprehensive help text (`--help`)
- CI/CD compatibility

### Milestone 4: Desktop Interface
**Goal:** Native cross-platform app for users who prefer GUI over terminal
**Status:** Follows TUI implementation, informed by TUI user feedback
**Platforms:** macOS, Windows, Linux (via Tauri)

**Deliverables:**
- Cross-platform builds (macOS `.app`, Windows `.exe`, Linux `.AppImage`)
- File picker for CSV input
- XML preview panel
- Validation results display
- Configuration UI
- Cross-submission warnings display
- Output save location selection

### Milestone 5: Production Ready
**Goal:** Replaces existing Electron tool in production

**Deliverables:**
- Validation against real Airtable exports
- All transformation logic from existing tool replicated
- User acceptance testing with FaC staff
- Code signing/distribution setup for target platforms
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

**2026-01-11:**
- Designed TUI-first interface architecture (ADR 002)
- Created comprehensive TUI UX design document
- Updated roadmap to prioritize TUI over basic CLI
- Defined visual design language (colors, typography, layouts)
- Planned screen layouts for all major workflows
- Specified interaction patterns and keyboard navigation
- Documented component architecture and code structure
- **Impact:** TUI becomes primary interface, desktop GUI deprioritized to post-MVP

**2026-01-09:**
- Configured CLAUDE.md with Iris project details
- Set up package.json with bun, SvelteKit, Tauri dependencies
- Created SvelteKit configuration (adapter-static for Tauri)
- Initialized Tauri project structure
- Created basic CLI entry point with command structure
- Updated README with project-specific information

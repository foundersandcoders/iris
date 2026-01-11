# January 2026: TUI Design and Architecture

**Period:** 2026-01-11
**Focus:** TUI-first interface design and planning

---

## Summary

Completed comprehensive design work for Iris's TUI (Text User Interface), shifting from a basic CLI approach to a beautiful, full-screen interactive terminal application. This represents a significant architectural decision that positions the TUI as the primary interface, with the desktop GUI deprioritized to post-MVP.

---

## Decisions Made

### ADR 002: TUI-First Interface Design

**Key Decision:** Default behavior (`iris`) launches a full-screen TUI application, with direct commands (`iris convert file.csv`) available for automation.

**Rationale:**
- Modern TUIs (lazygit, k9s, btop) demonstrate that terminal interfaces can be primary, not fallback
- Better portfolio differentiation than basic CLI
- Single learning curve instead of CLI + desktop GUI
- Rich interaction for complex workflows (error exploration, validation)
- Maintains automation capabilities through direct commands

**Trade-offs:**
- More complex than basic CLI (more code, harder to test)
- Requires modern terminal with Unicode and color support
- Desktop GUI delayed until post-MVP

**Tool Stack:**
- Core: `terminal-kit` (full-featured, imperative)
- Visual: `consola`, `chalk`, `gradient-string`, `cli-table3`, `boxen`, `ora`, `listr2`, `figures`

---

## Design Work Completed

### 1. Visual Design Language

**Color Palette:**
- Status colors: success (green), warning (amber), error (red), info (blue)
- UI colors: primary (violet), secondary (indigo), accent (pink), highlight (teal)
- Neutral colors: text, muted text, borders, backgrounds

**Typography:**
- Heavy double-line borders for main containers (┏━━┓)
- Light single-line borders for panels (┌──┐)
- Unicode symbols: ✓ ✗ ⚠ → • ⋯ █ ░

**Layout Grid:**
- Header (1-2 lines) with title and metadata
- Main content area (flexible height) with panels
- Status bar with keyboard hints and context

### 2. Screen Layouts

Designed five core screens:

1. **Dashboard:** Main menu with recent activity
2. **File Selection:** Interactive file browser with preview
3. **Processing:** Live progress with multi-stage tracking and log viewer
4. **Validation Results:** Error/warning explorer with drill-down
5. **Success/Completion:** Results summary with next actions

Each screen includes:
- Clear visual hierarchy
- Keyboard shortcuts
- Context-sensitive help
- Escape hatches (ESC, q, Ctrl+C)

### 3. Interaction Patterns

**Keyboard Navigation:**
- Global: `q`/`ESC` (back), `Ctrl+C` (exit), `?` (help)
- Lists: `↑↓` or `jk` (vim-style), `g`/`G` (top/bottom), `/` (search)
- Panels: `TAB` (next), `Shift+TAB` (previous)

**Visual Feedback:**
- Keypress acknowledgment (brief flash)
- Loading states (spinners, progress bars)
- State transitions (fade in/out, slide panels)

### 4. Code Architecture

**Directory Structure:**
```
src/tui/
├── app.ts               # Main TUI application
├── theme.ts             # Colors, borders, symbols
├── screens/             # Full-screen views
├── components/          # Reusable UI components
├── workflows/           # Multi-step processes
└── utils/               # TUI utilities
```

**Key Classes:**
- `TUI` - Main application (entry point, screen management)
- `Dashboard`, `FilePicker`, `ProcessingScreen`, `ValidationScreen`, `SuccessScreen`
- `Panel`, `ProgressBar`, `Menu`, `Table`, `LogViewer` (components)
- `ConvertWorkflow`, `ValidateWorkflow`, `CheckWorkflow`

### 5. Workflows

**Convert Workflow:**
1. Interactive file selection with preview
2. Live processing with progress bar and log
3. Success screen with next actions (validate, open, copy path)

**Validate Workflow:**
1. File selection (or use previous output)
2. Validation execution
3. Error/warning explorer (navigate, drill down, export)

**Check Workflow:**
1. Select submissions to compare
2. Cross-submission consistency check
3. Inconsistency report

---

## Documentation Created

1. **ADR 002:** TUI-First Interface Design
   - Context, decision, alternatives, consequences
   - Implementation plan (4 phases)
   - Design principles and success metrics

2. **Technical Doc:** TUI UX Design and Architecture
   - Complete visual design language
   - All screen layouts with ASCII diagrams
   - Interaction patterns and keyboard shortcuts
   - Code architecture with directory structure
   - Component library specifications
   - Workflow implementations
   - Accessibility considerations
   - Animation examples
   - Testing strategy

3. **Updated Roadmap:**
   - Reprioritized tasks: TUI first, desktop GUI post-MVP
   - New Milestone 2: TUI Interface (Primary)
   - New Milestone 3: Direct Commands (Automation)
   - Updated Milestone 4: Desktop Interface (deprioritized)
   - 16 TUI-specific tasks added
   - 6 direct command tasks added

---

## Next Steps

### Phase 1: Foundation (Immediate)
- [ ] Install TUI dependencies
- [ ] Create TUI directory structure
- [ ] Build theme system (colors, borders, symbols)
- [ ] Implement basic dashboard with menu
- [ ] Set up keyboard event handling

### Phase 2: Core Workflows (Following)
- [ ] Build file picker component
- [ ] Create processing screen
- [ ] Implement convert workflow
- [ ] Build validation results explorer
- [ ] Add success/completion screen

### Phase 3: Polish (Final)
- [ ] Add animations and transitions
- [ ] Implement help overlay
- [ ] Create settings screen
- [ ] Build history browser
- [ ] User testing

---

## Learnings

1. **TUI vs CLI distinction:** Understanding the difference between simple CLI (basic colored output) and TUI (full-screen interactive) was crucial. TUI offers much richer UX without requiring a GUI.

2. **Modern TUI capabilities:** Tools like lazygit and k9s demonstrate that TUIs can be primary interfaces, not just fallbacks. This informed the TUI-first decision.

3. **Terminal-kit vs Blessed:** Chose terminal-kit for cleaner imperative API over blessed's DOM-like widget system. Better match for our workflow-based architecture.

4. **Avoiding React paradigms:** Explicitly rejected ink (React for CLI) to maintain non-React approach. Imperative TUI code is clearer for sequential workflows.

5. **Design-first approach:** Creating comprehensive visual design and screen layouts before coding will significantly speed implementation and ensure consistency.

---

## Portfolio Evidence

### KSBs Demonstrated

**K6 (Design patterns):**
- Designed component-based TUI architecture
- Created reusable UI components (Panel, ProgressBar, Menu)
- Implemented workflow pattern for multi-step processes

**K8 (User interface design):**
- Comprehensive UX design for terminal interface
- Visual design language (colors, typography, layouts)
- Interaction patterns and keyboard navigation
- Progressive disclosure and information hierarchy

**S3 (User experience analysis):**
- Analyzed modern TUI examples (lazygit, k9s, btop)
- Identified UX patterns that work for complex workflows
- Designed for both technical and non-technical users
- Planned accessibility features

**S4 (Design patterns):**
- Applied MVC-like separation (screens, components, workflows)
- Created consistent interaction patterns across screens
- Designed for extensibility (plugin system potential)

**S16 (Communicating technical information):**
- Created comprehensive technical documentation
- Visual diagrams for all screen layouts
- Clear code architecture documentation
- ADR documenting architectural decision

**B3 (Professional attitude):**
- Researched modern TUI best practices before designing
- Created thorough documentation before implementation
- Considered trade-offs and alternatives
- Planned for testing and accessibility

---

## Time Investment

- Research (modern TUI examples, libraries): ~1 hour
- Design work (screens, interactions, architecture): ~2 hours
- Documentation (ADR, technical doc, roadmap updates): ~2 hours
- **Total:** ~5 hours

---

## References

- [ADR 002: TUI-First Interface Design](../adrs/002-tui-first-interface-design.md)
- [TUI UX Design and Architecture](../technical/tui-ux-design.md)
- [MVP Roadmap](../roadmaps/mvp.md)

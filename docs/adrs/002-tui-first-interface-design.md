# ADR 002: TUI-First Interface Design

**Date:** 2026-01-11
**Status:** Accepted
**Deciders:** Jason Warren
**Supersedes:** Parts of ADR 001 (CLI interface approach)

---

## Context

ADR 001 established a dual-interface architecture with a CLI and desktop GUI. The CLI was initially conceptualized as a simple command-line tool with basic colored output. However, this undersells the potential of the terminal interface and creates an awkward gap between "simple CLI" and "full desktop app."

Modern terminal applications demonstrate that TUIs (Text User Interfaces) can provide rich, interactive experiences that rival GUIs while maintaining the efficiency and accessibility of terminal-based tools. Examples include:

- **lazygit:** Full-screen interactive Git client with panels, menus, and real-time updates
- **k9s:** Kubernetes dashboard with live metrics, navigation, and resource management
- **btop:** System monitor with beautiful visualizations and interactivity
- **htop:** Process viewer with interactive filtering and management

These tools show that terminal interfaces can be:
1. **Primary interfaces** (not just power-user shortcuts)
2. **Beautiful and polished** (gradients, animations, thoughtful typography)
3. **Discoverable** (menus, help panels, visual feedback)
4. **Accessible** (no GUI knowledge required, keyboard-first)

For Iris, a TUI-first approach offers several advantages:
- **Portfolio differentiation:** Demonstrates advanced terminal UI skills beyond basic CLI scripting
- **Better UX for CSV workflows:** Interactive file browsing, live validation feedback, error exploration
- **Automation compatibility:** Direct commands still available for scripting
- **Single learning curve:** Users learn one rich interface instead of two different paradigms
- **Reduced scope:** Full-screen TUI is more impressive than basic CLI, potentially delaying desktop GUI need

---

## Decision

We will implement a **TUI-first interface** for Iris where:

1. **Default behavior** (`iris` with no args) launches a full-screen TUI application
2. **Direct commands** (`iris convert file.csv`) execute with pretty output and exit
3. **Interactive mode flag** (`iris convert --interactive`) launches TUI for specific workflows
4. **Desktop GUI** remains in the architecture but is deprioritized until post-MVP

### Tool Stack

**Core TUI Framework:**
- `terminal-kit` (^3.0.1) - Full-featured, imperative, powerful widget library

**Visual Enhancement:**
- `consola` (^3.2.3) - Beautiful prompts, logging, gradients
- `chalk` (^5.3.0) - Color utilities
- `gradient-string` (^3.0.0) - Color gradients for headers
- `cli-table3` (^0.6.3) - Beautiful tables
- `boxen` (^8.0.1) - Bordered boxes
- `ora` (^8.0.1) - Elegant spinners
- `listr2` (^8.0.0) - Task lists with subtasks
- `cli-progress` (^3.12.0) - Customizable progress bars
- `figures` (^6.0.1) - Unicode symbols (✓, ✗, →, ⚠)

### Interface Modes

**Mode 1: Full TUI (Default)**
```bash
iris                    # Launch interactive TUI dashboard
```
- Full-screen application
- File browsing, validation exploration, settings management
- Visual feedback, progress indicators, error details
- Primary interface for both technical and non-technical users

**Mode 2: Direct Commands**
```bash
iris convert file.csv   # Execute and exit with pretty output
iris validate file.xml  # Quick validation check
iris --help            # Standard help text
```
- Single-purpose execution
- Beautiful output using consola/chalk
- No persistent TUI session
- Scriptable and automation-friendly

**Mode 3: Interactive Workflow**
```bash
iris convert --interactive   # Launch TUI for conversion workflow
iris validate --interactive  # Launch TUI for validation exploration
```
- Hybrid: jump directly to specific TUI workflow
- Best of both worlds for repeated operations

---

## Alternatives Considered

### 1. Simple CLI (Original Plan from ADR 001)
**Rejected:** Underutilizes terminal capabilities. Basic colored output and progress bars don't differentiate the project or provide compelling UX for complex workflows like error exploration.

### 2. CLI + Desktop GUI (No TUI)
**Rejected:** Creates two parallel learning curves. The gap between "type commands" and "use GUI buttons" is significant. A well-designed TUI bridges this gap.

### 3. TUI-Only (No Direct Commands)
**Rejected:** Removes automation capabilities. Direct commands are essential for scripting, CI/CD integration, and power users.

### 4. Blessed/Neo-Blessed Instead of Terminal-Kit
**Considered:** Blessed is the most mature TUI library for Node.js.

**Rejected for initial implementation:**
- More complex widget system with DOM-like API
- Terminal-kit provides cleaner imperative API for our use cases
- Easier to create custom layouts without fighting a widget hierarchy
- Better documentation and active maintenance

**Note:** Could migrate to blessed if we need advanced widget composition later.

### 5. Ink (React for CLI)
**Rejected:** Explicitly avoiding React paradigms per project requirements. Ink forces component-based thinking when imperative is clearer for TUI flows.

---

## Consequences

### Positive

1. **Portfolio impact:** TUI demonstrates advanced terminal skills beyond basic CLI scripting
2. **Single learning curve:** One interface instead of two (CLI commands + desktop GUI)
3. **Better workflows:** Interactive file browsing, live validation, error exploration
4. **Reduced initial scope:** Defer desktop GUI to post-MVP without losing UX quality
5. **Automation preserved:** Direct commands still available for scripting
6. **Beautiful output:** Modern terminal aesthetics match quality of desktop apps
7. **Accessibility:** No GUI framework knowledge required, works over SSH

### Negative

1. **Increased complexity:** Full TUI is more code than basic CLI
2. **Testing challenges:** TUI interactions harder to unit test than pure functions
3. **Terminal requirements:** Needs modern terminal with Unicode and color support
4. **Learning curve:** Users unfamiliar with TUI apps may need brief orientation

### Risks

1. **Terminal compatibility issues:** Some terminals may not support all features
   - **Mitigation:** Test on macOS Terminal, iTerm2, and common Linux terminals
   - **Fallback:** Direct commands always available

2. **TUI proves too complex:** If implementation takes too long, we could simplify
   - **Mitigation:** Build iteratively, starting with basic navigation
   - **Fallback:** Keep direct commands fully functional

3. **Users prefer GUI:** Non-technical staff may still want desktop app
   - **Mitigation:** Desktop GUI still in roadmap, just deprioritized
   - **Note:** TUI user testing will inform whether GUI is actually needed

---

## Implementation Plan

### Phase 1: Foundation (Week 1)
- Set up terminal-kit and visual libraries
- Create TUI application scaffold
- Build dashboard with menu navigation
- Implement basic file picker

### Phase 2: Core Workflows (Week 2)
- Convert workflow (CSV → XML with progress)
- Validate workflow (error exploration UI)
- Settings management screen

### Phase 3: Polish (Week 3)
- Animations and transitions
- Keyboard shortcuts and help panel
- Error handling and edge cases
- Cross-submission history viewer

### Phase 4: Direct Commands (Week 4)
- Implement non-TUI command execution
- Beautiful output with consola
- Help text and documentation

---

## Design Principles

1. **TUI is primary, not fallback:** Design for full-screen experience first
2. **Progressive disclosure:** Summary → details on demand
3. **Immediate feedback:** Visual acknowledgment of every interaction
4. **Escape hatches:** Always clear how to go back or quit (ESC, q)
5. **Information hierarchy:** Errors → warnings → success → help
6. **Keyboard-first:** Mouse support optional, not required
7. **Beautiful defaults:** Gradients, borders, thoughtful spacing

---

## Success Metrics

- [ ] TUI can complete all core workflows without direct commands
- [ ] New users can navigate TUI without documentation (discoverability)
- [ ] Direct commands work in CI/CD for automation
- [ ] Visual quality matches or exceeds modern TUI examples (lazygit, k9s)
- [ ] Non-technical users prefer TUI over waiting for desktop GUI

---

## References

- [ADR 001: Tech Stack and Architecture](./001-tech-stack-and-architecture.md)
- [TUI UX Design and Architecture](../technical/tui-ux-design.md)
- [terminal-kit Documentation](https://www.npmjs.com/package/terminal-kit)
- [Modern TUI Examples](https://github.com/rothgar/awesome-tuis)
- [lazygit](https://github.com/jesseduffield/lazygit) - Reference implementation

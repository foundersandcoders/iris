# TUI UX Design and Architecture

**Version:** 1.0
**Last Updated:** 2026-01-11
**Related ADR:** [002-tui-first-interface-design.md](../adrs/002-tui-first-interface-design.md)

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Visual Design Language](#visual-design-language)
3. [Screen Layouts](#screen-layouts)
4. [Interaction Patterns](#interaction-patterns)
5. [Code Architecture](#code-architecture)
6. [Component Library](#component-library)
7. [Workflows](#workflows)
8. [Accessibility](#accessibility)

---

## Design Philosophy

### Core Principles

1. **TUI is home base, commands are express lanes**
   - Default behavior launches full TUI
   - Direct commands for automation and quick operations
   - Users should naturally gravitate to TUI for exploration

2. **Progressive disclosure**
   - Summary first, details on demand
   - Don't overwhelm with information
   - Drill down for specifics when needed

3. **Immediate visual feedback**
   - Every keypress acknowledged
   - State changes visible immediately
   - Loading states for async operations

4. **Information hierarchy**
   - Critical errors (red, blocking) → highest priority
   - Warnings (yellow, review) → medium priority
   - Success states (green) → confirmation
   - Contextual help (dimmed) → always available

5. **Escape hatches everywhere**
   - `q` or `ESC` to go back (always)
   - `?` for contextual help (always visible)
   - `Ctrl+C` emergency exit
   - Never trap users in a state

---

## Visual Design Language

### Color Palette

```javascript
export const theme = {
  // Status colors
  success: '#10b981',    // Emerald 500
  warning: '#f59e0b',    // Amber 500
  error: '#ef4444',      // Red 500
  info: '#3b82f6',       // Blue 500

  // UI colors
  primary: '#8b5cf6',    // Violet 500 (brand)
  secondary: '#6366f1',  // Indigo 500
  accent: '#ec4899',     // Pink 500
  highlight: '#14b8a6',  // Teal 500

  // Neutral colors
  text: '#f3f4f6',       // Gray 100 (light text)
  textMuted: '#9ca3af',  // Gray 400 (dimmed text)
  border: '#4b5563',     // Gray 600 (borders)
  background: '#1f2937', // Gray 800 (backgrounds)
};
```

### Typography Hierarchy

**Borders:**
```
┏━━━━━━━━━━━━┓  // Heavy double-line borders (main containers)
┃            ┃
┗━━━━━━━━━━━━┛

┌────────────┐  // Light single-line borders (panels, sections)
│            │
└────────────┘

─────────────   // Horizontal dividers
```

**Symbols:**
```
✓  Success indicator
✗  Error indicator (blocking)
⚠  Warning indicator (non-blocking)
→  Selection indicator / navigation arrow
•  List bullets
⋯  Loading / in-progress indicator
█  Progress bar fill
░  Progress bar empty
```

**Text Styles:**
```
BOLD UPPERCASE     // Screen titles
Title Case         // Section headers
Sentence case      // Body text
  Indented         // Nested items
  →  Selected      // Active selection
```

### Layout Grid

All screens follow a consistent grid:

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Header (1-2 lines)              Info  ┃  ← Title bar
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                        ┃
┃  Main content area (flexible height)   ┃  ← Primary content
┃                                        ┃
┃  ┌─ Panel 1 ──────────────────────┐   ┃
┃  │                                 │   ┃
┃  └─────────────────────────────────┘   ┃
┃                                        ┃
┃  ┌─ Panel 2 ──────────────────────┐   ┃
┃  │                                 │   ┃
┃  └─────────────────────────────────┘   ┃
┃                                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  [Keys] Help text          Status     ┃  ← Status bar
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Screen Layouts

### 1. Dashboard (Entry Screen)

**Purpose:** Main menu and recent activity overview

**Layout:**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ██╗██████╗ ██╗███████╗                        v0.1.0  ┃
┃  ██║██╔══██╗██║██╔════╝                        Session  ┃
┃  ██║██████╔╝██║███████╗                         Active  ┃
┃  ██║██╔══██╗██║╚════██║                                 ┃
┃  ██║██║  ██║██║███████║    ILR Toolkit                 ┃
┃  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝                                 ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                           ┃
┃  ┌─ Quick Actions ────────────────────────────────────┐  ┃
┃  │                                                     │  ┃
┃  │  → 1  Convert CSV to ILR XML                       │  ┃
┃  │    2  Validate XML Submission                      │  ┃
┃  │    3  Cross-Submission Check                       │  ┃
┃  │    4  Browse Submission History                    │  ┃
┃  │    5  Settings & Configuration                     │  ┃
┃  │                                                     │  ┃
┃  └─────────────────────────────────────────────────────┘  ┃
┃                                                           ┃
┃  ┌─ Recent Activity ──────────────────────────────────┐  ┃
┃  │                                                     │  ┃
┃  │  ✓  2026-01-10  learners-jan.csv → 2026-01.xml    │  ┃
┃  │  ✓  2026-01-08  apprentices.csv → 2025-12.xml     │  ┃
┃  │  ⚠  2026-01-05  outcomes.csv (3 warnings)          │  ┃
┃  │                                                     │  ┃
┃  └─────────────────────────────────────────────────────┘  ┃
┃                                                           ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  [1-5] Select  [?] Help  [q] Quit              ~/.iris/ ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Interactions:**
- Number keys `1-5` → Launch workflow
- Arrow keys `↑↓` → Navigate menu (alternative to numbers)
- `ENTER` → Confirm selection
- `?` → Show help overlay
- `q` → Quit application

---

### 2. File Selection Screen

**Purpose:** Browse and select CSV files

**Layout:**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Select CSV File                                     [1/4] ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                           ┃
┃  ┌─ ~/Downloads ─────────────────────────────────────┐   ┃
┃  │                                                     │   ┃
┃  │  📁  ..                                             │   ┃
┃  │  📄  apprentices-2024.csv           2.3 MB  Jan 10 │   ┃
┃  │→ 📄  learners-feb-2026.csv          1.8 MB  Jan 09 │   ┃
┃  │  📄  outcomes.csv                   456 KB  Jan 05 │   ┃
┃  │  📄  previous-submission.csv        3.1 MB  Dec 20 │   ┃
┃  │  📁  archive/                                       │   ┃
┃  │                                                     │   ┃
┃  └─────────────────────────────────────────────────────┘   ┃
┃                                                           ┃
┃  ┌─ File Preview ──────────────────────────────────────┐  ┃
┃  │                                                     │   ┃
┃  │  learners-feb-2026.csv                             │   ┃
┃  │  ─────────────────────────────────────────         │   ┃
┃  │  Size: 1.8 MB                                      │   ┃
┃  │  Modified: 2026-01-09 14:32                        │   ┃
┃  │  Lines: ~147 (estimated)                           │   ┃
┃  │                                                     │   ┃
┃  └─────────────────────────────────────────────────────┘   ┃
┃                                                           ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  [↑↓] Navigate  [ENTER] Select  [TAB] Type path  [ESC]   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Interactions:**
- Arrow keys `↑↓` → Navigate file list
- `ENTER` → Select file
- `TAB` → Switch to path input mode (type path directly)
- `/` → Quick search/filter
- `ESC` → Cancel, return to dashboard

---

### 3. Processing Screen

**Purpose:** Show live progress during CSV parsing and XML generation

**Layout:**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Converting: learners-feb-2026.csv                   [2/4] ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                           ┃
┃  ┌─ Parsing CSV ───────────────────────────────────────┐  ┃
┃  │  ✓  Read file                           1.8 MB      │  ┃
┃  │  ✓  Parse headers                       25 columns  │  ┃
┃  │  ⋯  Parse records                       98/147      │  ┃
┃  │                                                     │  ┃
┃  │  ████████████████████████░░░░░░░  67%              │  ┃
┃  └─────────────────────────────────────────────────────┘  ┃
┃                                                           ┃
┃  ┌─ Live Log ──────────────────────────────────────────┐  ┃
┃  │                                                     │  ┃
┃  │  14:35:02  Matched column: LearnRefNumber          │  ┃
┃  │  14:35:02  Matched column: UKPRN                   │  ┃
┃  │  14:35:03  ⚠ Row 42: Missing postcode (optional)    │  ┃
┃  │  14:35:04  ⚠ Row 89: Future start date - verify    │  ┃
┃  │  14:35:05  Processing learning aims...             │  ┃
┃  │  14:35:05  ⋯ Current: Learner LRN098                │  ┃
┃  │                                                     │  ┃
┃  └─────────────────────────────────────────────────────┘  ┃
┃                                                           ┃
┃  ┌─ Summary ───────────────────────────────────────────┐  ┃
┃  │  Learners: 98/147  │  Aims: 234  │  Warnings: 3    │  ┃
┃  └─────────────────────────────────────────────────────┘  ┃
┃                                                           ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  Processing...                          Elapsed: 00:03s   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Features:**
- Real-time progress updates
- Live log scrolling (auto-scrolls to bottom)
- Multi-stage progress tracking
- Warnings displayed as they occur

---

### 4. Validation Results Screen

**Purpose:** Explore validation errors and warnings

**Layout:**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Validation Results: 2026-01.xml                     [3/4] ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                           ┃
┃  Status: ✗ FAILED                                         ┃
┃                                                           ┃
┃  ┌─ Errors (3 blocking) ──────────────────────────────┐   ┃
┃  │                                                     │   ┃
┃  │→ ✗  Missing UKPRN                    12 records    │   ┃
┃  │  ✗  Invalid ULN format               Learner #45   │   ┃
┃  │  ✗  Overlapping learning aims        Learner #23   │   ┃
┃  │                                                     │   ┃
┃  └─────────────────────────────────────────────────────┘   ┃
┃                                                           ┃
┃  ┌─ Warnings (7 non-blocking) ─────────────────────────┐  ┃
┃  │                                                     │   ┃
┃  │  ⚠  Missing ethnicity data           18 records    │   ┃
┃  │  ⚠  Missing prior attainment          9 records    │   ┃
┃  │  ⚠  Unusual funding model             Learner #67  │   ┃
┃  │  ...and 4 more                                      │   ┃
┃  │                                                     │   ┃
┃  └─────────────────────────────────────────────────────┘   ┃
┃                                                           ┃
┃  ┌─ Error Detail ──────────────────────────────────────┐  ┃
┃  │                                                     │   ┃
┃  │  Field: UKPRN (UK Provider Reference Number)       │   ┃
┃  │  Severity: BLOCKING                                │   ┃
┃  │  Affected: 12 learner records                      │   ┃
┃  │                                                     │   ┃
┃  │  This mandatory field is missing. ESFA submissions │   ┃
┃  │  will be rejected without valid UKPRN values.      │   ┃
┃  │                                                     │   ┃
┃  │  Affected learners:                                │   ┃
┃  │  LRN001, LRN007, LRN023, LRN034, LRN056...         │   ┃
┃  │                                                     │   ┃
┃  └─────────────────────────────────────────────────────┘   ┃
┃                                                           ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  [↑↓] Navigate  [ENTER] Details  [E] Export  [ESC] Back  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Interactions:**
- Arrow keys `↑↓` → Navigate errors/warnings list
- `ENTER` → Show full error details
- `E` → Export error list to CSV
- `TAB` → Toggle between errors and warnings
- `ESC` → Return to dashboard

---

### 5. Success/Completion Screen

**Purpose:** Confirm successful operation and offer next actions

**Layout:**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  Conversion Complete                                 [4/4] ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                           ┃
┃                          ✓                                ┃
┃                                                           ┃
┃              Successfully created ILR XML                 ┃
┃                                                           ┃
┃  ┌─ Output ────────────────────────────────────────────┐  ┃
┃  │                                                     │  ┃
┃  │  File: ~/.iris/submissions/2026-02.xml             │  ┃
┃  │  Size: 2.3 MB                                      │  ┃
┃  │  Records: 147 learners, 342 aims                   │  ┃
┃  │  Warnings: 3 (non-blocking)                        │  ┃
┃  │                                                     │  ┃
┃  └─────────────────────────────────────────────────────┘  ┃
┃                                                           ┃
┃  ┌─ Next Actions ──────────────────────────────────────┐  ┃
┃  │                                                     │  ┃
┃  │  → O  Open in editor                                │  ┃
┃  │    V  Validate now                                  │  ┃
┃  │    C  Copy path to clipboard                        │  ┃
┃  │    R  Return to main menu                           │  ┃
┃  │                                                     │  ┃
┃  └─────────────────────────────────────────────────────┘  ┃
┃                                                           ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  [O/V/C/R] Select action  [ESC] Back to menu              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Interaction Patterns

### Keyboard Navigation

**Global Shortcuts:**
- `q` or `ESC` → Go back / quit (context-dependent)
- `Ctrl+C` → Emergency exit (always)
- `?` → Help overlay (always available)
- `Ctrl+L` → Refresh screen

**List Navigation:**
- `↑` / `k` → Move up
- `↓` / `j` → Move down
- `g` → Go to top (vim-style)
- `G` → Go to bottom (vim-style)
- `ENTER` → Select / confirm
- `/` → Search / filter

**Tabbed Panels:**
- `TAB` → Next panel
- `Shift+TAB` → Previous panel

### Visual Feedback

**Keypress Acknowledgment:**
```javascript
// Brief flash on selection
term.saveCursor();
term.bgBrightCyan(' Selected Item ');
setTimeout(() => {
  term.restoreCursor();
  term(' Selected Item ');
}, 100);
```

**Loading States:**
```javascript
// Spinner for indeterminate progress
const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// Progress bar for determinate progress
████████████░░░░░░░░  60%
```

**State Transitions:**
```javascript
// Fade out old screen, fade in new screen
// Slide panels in from right
// Pulse effect for warnings (cycle through amber shades)
```

---

## Code Architecture

### Directory Structure

```
src/
├── tui/
│   ├── app.ts                 # Main TUI application
│   ├── theme.ts               # Colors, borders, symbols
│   │
│   ├── screens/               # Full-screen views
│   │   ├── dashboard.ts       # Main menu
│   │   ├── file-picker.ts     # File selection
│   │   ├── processing.ts      # Progress screen
│   │   ├── validation.ts      # Validation results
│   │   └── success.ts         # Completion screen
│   │
│   ├── components/            # Reusable UI components
│   │   ├── panel.ts           # Bordered panel
│   │   ├── menu.ts            # Interactive menu
│   │   ├── progress-bar.ts    # Progress indicator
│   │   ├── table.ts           # Data table
│   │   └── log-viewer.ts      # Scrolling log
│   │
│   ├── workflows/             # Multi-step processes
│   │   ├── convert.ts         # CSV → XML workflow
│   │   ├── validate.ts        # Validation workflow
│   │   └── check.ts           # Cross-submission check
│   │
│   └── utils/                 # TUI utilities
│       ├── keyboard.ts        # Keyboard handling
│       ├── layout.ts          # Layout calculations
│       └── animations.ts      # Transition effects
│
├── commands/                  # Direct command implementations
│   ├── convert.ts             # Non-TUI convert
│   ├── validate.ts            # Non-TUI validate
│   └── check.ts               # Non-TUI check
│
├── lib/                       # Shared core (unchanged)
│   ├── parser.ts
│   ├── validator.ts
│   ├── generator.ts
│   └── storage.ts
│
└── cli.ts                     # Entry point (router)
```

### Application Entry Point

```typescript
// src/cli.ts
#!/usr/bin/env bun

import { parseArgs } from 'util';
import { TUI } from './tui/app';
import { commands } from './commands';
import consola from 'consola';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
    interactive: { type: 'boolean', short: 'i' },
  },
});

// No command = Launch TUI
if (positionals.length === 0 && !values.version && !values.help) {
  const tui = new TUI();
  await tui.start();
  process.exit(0);
}

// Handle --version, --help
if (values.version) {
  consola.info('iris v0.1.0');
  process.exit(0);
}

if (values.help) {
  showHelp();
  process.exit(0);
}

// Execute direct command
const command = positionals[0];
const args = positionals.slice(1);

if (values.interactive) {
  // Launch TUI but jump to specific workflow
  const tui = new TUI({ startCommand: command, args });
  await tui.start();
} else {
  // Direct command execution with pretty output
  await commands[command]?.execute(args);
}
```

### TUI Application Class

```typescript
// src/tui/app.ts
import terminalKit from 'terminal-kit';
import { Dashboard } from './screens/dashboard';
import { ConvertWorkflow } from './workflows/convert';
import { ValidateWorkflow } from './workflows/validate';
import { theme } from './theme';

const term = terminalKit.terminal;

export class TUI {
  private currentWorkflow: any = null;

  constructor(private options: { startCommand?: string; args?: string[] } = {}) {}

  async start() {
    this.initialize();

    if (this.options.startCommand) {
      // Jump directly to workflow
      await this.launchWorkflow(this.options.startCommand);
    } else {
      // Show dashboard
      await this.showDashboard();
    }
  }

  private initialize() {
    // Full-screen mode
    term.fullscreen(true);
    term.hideCursor();
    term.grabInput({ mouse: 'button' });

    // Graceful shutdown
    term.on('key', (key) => {
      if (key === 'CTRL_C') {
        this.cleanup();
        process.exit(0);
      }
    });

    // Handle window resize
    process.stdout.on('resize', () => {
      this.refresh();
    });
  }

  async showDashboard() {
    const dashboard = new Dashboard(term);
    const selection = await dashboard.render();

    await this.launchWorkflow(selection);
  }

  async launchWorkflow(command: string) {
    switch (command) {
      case 'convert':
        this.currentWorkflow = new ConvertWorkflow(term);
        break;
      case 'validate':
        this.currentWorkflow = new ValidateWorkflow(term);
        break;
      case 'check':
        // ... other workflows
        break;
      case 'quit':
        this.cleanup();
        process.exit(0);
        return;
    }

    const result = await this.currentWorkflow.execute();

    // Return to dashboard after workflow completes
    await this.showDashboard();
  }

  private cleanup() {
    term.fullscreen(false);
    term.showCursor();
    term.grabInput(false);
  }

  private refresh() {
    // Re-render current screen on terminal resize
    if (this.currentWorkflow) {
      this.currentWorkflow.render();
    }
  }
}
```

---

## Component Library

### Panel Component

```typescript
// src/tui/components/panel.ts
import terminalKit from 'terminal-kit';
import { theme } from '../theme';

export class Panel {
  constructor(
    private term: any,
    private options: {
      title?: string;
      x: number;
      y: number;
      width: number;
      height: number;
      style?: 'single' | 'double';
    }
  ) {}

  render(content: string[]) {
    const { x, y, width, height, title, style = 'single' } = this.options;

    // Draw box
    this.term.drawBox({
      x, y, width, height,
      style: style === 'double' ? 'heavy' : 'light',
      title: title ? ` ${title} ` : undefined,
    });

    // Render content inside box
    content.forEach((line, i) => {
      if (i < height - 2) {
        this.term.moveTo(x + 2, y + i + 1);
        this.term(line.slice(0, width - 4));
      }
    });
  }
}
```

### Progress Bar Component

```typescript
// src/tui/components/progress-bar.ts
export class ProgressBar {
  constructor(
    private term: any,
    private options: {
      x: number;
      y: number;
      width: number;
    }
  ) {}

  update(progress: number) {
    const { x, y, width } = this.options;
    const filled = Math.floor((progress / 100) * width);
    const empty = width - filled;

    this.term.moveTo(x, y);
    this.term.bgGreen(' '.repeat(filled));
    this.term.bgGray(' '.repeat(empty));
    this.term.styleReset();
    this.term(` ${progress}%`);
  }
}
```

---

## Workflows

### Convert Workflow

```typescript
// src/tui/workflows/convert.ts
import { parse } from '../../lib/parser';
import { generate } from '../../lib/generator';
import { FilePicker } from '../screens/file-picker';
import { ProcessingScreen } from '../screens/processing';
import { SuccessScreen } from '../screens/success';

export class ConvertWorkflow {
  constructor(private term: any) {}

  async execute() {
    // Step 1: Select file
    const filePicker = new FilePicker(this.term);
    const csvPath = await filePicker.show();

    if (!csvPath) {
      return { cancelled: true };
    }

    // Step 2: Process with live updates
    const processingScreen = new ProcessingScreen(this.term);
    processingScreen.show('Converting CSV to XML');

    const parseResult = await parse(csvPath, {
      onProgress: (p) => processingScreen.updateProgress(p),
      onWarning: (w) => processingScreen.addLog(w),
    });

    if (!parseResult.success) {
      // Show error screen
      return { success: false, errors: parseResult.errors };
    }

    const xmlResult = await generate(parseResult.data, {
      onProgress: (p) => processingScreen.updateProgress(p),
    });

    // Step 3: Show success
    const successScreen = new SuccessScreen(this.term);
    const action = await successScreen.show(xmlResult);

    return { success: true, action };
  }
}
```

---

## Accessibility

### Terminal Compatibility

**Minimum Requirements:**
- 256-color support
- Unicode/UTF-8 support
- Terminal width: 80 columns minimum, 120 recommended
- Terminal height: 24 rows minimum

**Tested Terminals:**
- macOS Terminal.app
- iTerm2
- Alacritty
- VS Code integrated terminal
- Warp

**Graceful Degradation:**
- Detect color support, fall back to 16 colors if needed
- Detect Unicode support, fall back to ASCII box drawing
- Responsive layout adapts to terminal size

### Keyboard-Only Navigation

All functionality accessible without mouse:
- Arrow keys for navigation
- Vim-style hjkl alternative
- Tab for panel switching
- Single-key shortcuts for common actions
- Always-visible keyboard hints

### Screen Reader Compatibility

While TUIs have inherent screen reader challenges:
- Use semantic text where possible
- Provide text alternatives for symbols
- Clear status announcements for state changes

---

## Animation Examples

### Screen Transitions

```typescript
// Fade out old screen
for (let opacity = 100; opacity >= 0; opacity -= 10) {
  term.colorGrayscale(opacity / 100);
  // Re-render screen
  await sleep(20);
}

// Fade in new screen
for (let opacity = 0; opacity <= 100; opacity += 10) {
  term.colorGrayscale(opacity / 100);
  // Render new screen
  await sleep(20);
}
```

### Spinner Animation

```typescript
const spinners = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
};

let frame = 0;
const interval = setInterval(() => {
  term.moveTo(x, y);
  term(spinners.dots[frame % spinners.dots.length]);
  frame++;
}, 80);
```

### Pulse Effect

```typescript
// Pulse warning symbol
const colors = ['#f59e0b', '#fbbf24', '#fcd34d', '#fbbf24'];
let i = 0;

setInterval(() => {
  term.moveTo(x, y);
  term.colorRgbHex(colors[i % colors.length]);
  term('⚠');
  i++;
}, 300);
```

---

## Testing Strategy

### Unit Tests

Test pure functions in isolation:
- Layout calculations
- Theme utilities
- Keyboard event parsing

### Integration Tests

Test workflows without terminal output:
- Mock terminal interface
- Test workflow state machines
- Verify correct screen transitions

### Manual Testing

Use test fixtures:
- Sample CSV files (valid, invalid, edge cases)
- Pre-generated XML files
- Simulated user input sequences

---

## Performance Considerations

1. **Minimize redraws:** Only redraw changed regions
2. **Debounce rapid updates:** Aggregate log messages
3. **Lazy rendering:** Don't render off-screen content
4. **Efficient diffing:** Track what changed, redraw only deltas
5. **Progress throttling:** Update progress max 10x/second

---

## Future Enhancements

1. **Mouse support:** Click to select menu items
2. **Split panes:** Multiple simultaneous views
3. **Tabs:** Switch between multiple files
4. **Search:** Fuzzy search in error lists
5. **Themes:** Dark/light mode, custom color schemes
6. **Macros:** Record and replay action sequences
7. **Plugins:** Extensible command system

---

## References

- [terminal-kit Documentation](https://github.com/cronvel/terminal-kit)
- [consola Documentation](https://github.com/unjs/consola)
- [Awesome TUIs](https://github.com/rothgar/awesome-tuis)
- [lazygit Source](https://github.com/jesseduffield/lazygit) - Reference implementation
- [The Art of CLI Design](https://clig.dev/)

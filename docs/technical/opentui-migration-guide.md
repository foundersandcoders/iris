# OpenTUI Migration Guide

This guide explains how to migrate Iris's TUI implementation from terminal-kit to [OpenTUI](https://github.com/sst/opentui), a modern TypeScript library for building terminal user interfaces.

## Table of Contents

1. [Overview](#overview)
2. [Architecture Comparison](#architecture-comparison)
3. [Installation & Setup](#installation--setup)
4. [Core Concepts Mapping](#core-concepts-mapping)
5. [Migration Strategy](#migration-strategy)
6. [Detailed Migration Examples](#detailed-migration-examples)
7. [Component Migration Reference](#component-migration-reference)
8. [Testing Considerations](#testing-considerations)

---

## Overview

### Why Migrate?

OpenTUI offers several advantages over terminal-kit:

- **TypeScript-first**: Built with TypeScript from the ground up with excellent type safety
- **Yoga Layout Engine**: Flexbox-like layout system for complex UIs
- **Component Model**: Both imperative and declarative patterns (React/Solid reconcilers available)
- **Performance**: Zig-powered rendering for sub-millisecond frame times
- **Modern API**: Cleaner abstractions for renderables, input handling, and state

### Current Stack vs Target Stack

| Aspect | Current (terminal-kit) | Target (OpenTUI) |
|--------|------------------------|------------------|
| Rendering | Direct cursor positioning (`term.moveTo()`) | Yoga-based flexbox layout |
| Components | Custom class-based screens | `Renderable` classes + Constructs |
| Input | Event listeners (`term.on('key')`) | `KeyEvent` emitter |
| Colors | `term.colorRgbHex()` | `RGBA` class |
| State | Instance variables | Same, with optional framework reconcilers |

---

## Architecture Comparison

### Current Architecture (terminal-kit)

```
TUI Application
├── app.ts (bootstrap, fullscreen, input capture)
├── Router (stack-based navigation)
└── Screens (Promise-based render loops)
    ├── Dashboard
    ├── FilePicker
    └── Processing
```

**Key Pattern**: Each screen is a class that:
1. Draws the entire screen on each state change (immediate mode)
2. Returns a Promise that resolves when navigation occurs
3. Handles keyboard input via `term.on('key', handler)`

### Target Architecture (OpenTUI)

```
TUI Application
├── CliRenderer (manages rendering + input)
├── Router (can remain similar)
└── Screens (Renderable trees)
    ├── Dashboard (GroupRenderable + SelectRenderable)
    ├── FilePicker (GroupRenderable + SelectRenderable)
    └── Processing (GroupRenderable + TextRenderables)
```

**Key Pattern**: Each screen:
1. Creates a tree of Renderable components
2. Uses Yoga layout for automatic positioning
3. Handles input via `renderer.keyInput.on('keypress', handler)`
4. Updates by modifying renderable properties (re-renders automatically)

---

## Installation & Setup

### Prerequisites

OpenTUI requires Zig installed on your system for building native bindings.

```bash
# macOS
brew install zig

# Linux (Ubuntu/Debian)
snap install zig --classic

# Or download from https://ziglang.org/download/
```

### Install OpenTUI

```bash
bun install @opentui/core
```

### Optional: Framework Reconcilers

```bash
# For React-like declarative patterns
bun install @opentui/react

# For SolidJS-like patterns
bun install @opentui/solid
```

---

## Core Concepts Mapping

### 1. Application Bootstrap

**Current (terminal-kit)**:
```typescript
// src/tui/app.ts
import { terminal as term } from 'terminal-kit';

export class TUI {
  async start() {
    term.fullscreen(true);
    term.hideCursor(true);
    term.grabInput(true);

    term.on('key', (key: string) => {
      if (key === 'CTRL_C') {
        this.cleanup();
        process.exit(0);
      }
    });

    await this.router.push("dashboard");
  }

  cleanup() {
    term.grabInput(false);
    term.hideCursor(false);
    term.fullscreen(false);
  }
}
```

**Target (OpenTUI)**:
```typescript
// src/tui/app.ts
import { createCliRenderer, type KeyEvent } from '@opentui/core';

export class TUI {
  private renderer!: Awaited<ReturnType<typeof createCliRenderer>>;

  async start() {
    this.renderer = await createCliRenderer();

    this.renderer.keyInput.on('keypress', (key: KeyEvent) => {
      if (key.ctrl && key.name === 'c') {
        this.cleanup();
        process.exit(0);
      }
    });

    await this.router.push("dashboard");
    this.renderer.start(); // Begin render loop
  }

  cleanup() {
    this.renderer.stop();
  }
}
```

### 2. Color System

**Current (terminal-kit)**:
```typescript
// Direct hex strings
term.colorRgbHex('#6F2A52')('Hello');
term.bgColorRgbHex('#FFF1F7');
```

**Target (OpenTUI)**:
```typescript
import { RGBA } from '@opentui/core';

// RGBA class provides multiple creation methods
const primary = RGBA.fromHex('#6F2A52');
const background = RGBA.fromHex('#FFF1F7');

// Or with explicit values
const red = RGBA.fromInts(255, 0, 0, 255);
const blue = RGBA.fromValues(0.0, 0.0, 1.0, 1.0);
```

### 3. Text Rendering

**Current (terminal-kit)**:
```typescript
term.moveTo(10, 5);
term.colorRgbHex('#6F2A52').bold('Dashboard');
term.styleReset();
```

**Target (OpenTUI)**:
```typescript
import { TextRenderable, TextAttributes } from '@opentui/core';

const title = new TextRenderable(renderer, {
  id: 'title',
  content: 'Dashboard',
  fg: '#6F2A52',
  attributes: TextAttributes.BOLD,
  position: 'absolute',
  left: 10,
  top: 5,
});

renderer.root.add(title);
```

### 4. Keyboard Input

**Current (terminal-kit)**:
```typescript
term.on('key', (key: string) => {
  if (key === 'UP') { /* ... */ }
  else if (key === 'DOWN') { /* ... */ }
  else if (key === 'ENTER') { /* ... */ }
  else if (key === 'ESCAPE') { /* ... */ }
});

// Cleanup
term.removeAllListeners('key');
```

**Target (OpenTUI)**:
```typescript
import { type KeyEvent } from '@opentui/core';

const handler = (key: KeyEvent) => {
  if (key.name === 'up') { /* ... */ }
  else if (key.name === 'down') { /* ... */ }
  else if (key.name === 'return') { /* ... */ }
  else if (key.name === 'escape') { /* ... */ }

  // Check modifiers
  if (key.ctrl && key.name === 'c') { /* ... */ }
};

renderer.keyInput.on('keypress', handler);

// Cleanup
renderer.keyInput.off('keypress', handler);
```

### 5. Layout System

**Current (terminal-kit)** - Manual positioning:
```typescript
// src/tui/utils/layout.ts
const width = term.width;
const height = term.height;

// Header at row 2
term.moveTo(1, 2);
term.bold.colorRgbHex(theme.primary)(title);

// Content starts at row 4
let currentY = 4;
items.forEach((item, i) => {
  term.moveTo(4, currentY + i);
  term(item.label);
});

// Status bar at bottom
term.moveTo(1, height);
term.colorRgbHex(theme.textMuted)(statusText);
```

**Target (OpenTUI)** - Yoga flexbox:
```typescript
import { GroupRenderable, TextRenderable, BoxRenderable } from '@opentui/core';

// Container with vertical flex layout
const container = new GroupRenderable(renderer, {
  id: 'container',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
});

// Header
const header = new TextRenderable(renderer, {
  id: 'header',
  content: title,
  fg: theme.primary,
  attributes: TextAttributes.BOLD,
  height: 3,
});

// Content area (grows to fill)
const content = new GroupRenderable(renderer, {
  id: 'content',
  flexGrow: 1,
  flexDirection: 'column',
  padding: 2,
});

// Status bar (fixed at bottom)
const statusBar = new TextRenderable(renderer, {
  id: 'status',
  content: statusText,
  fg: theme.textMuted,
  height: 1,
});

container.add(header);
container.add(content);
container.add(statusBar);
renderer.root.add(container);
```

---

## Migration Strategy

### Phase 1: Setup & Parallel Structure

1. Install OpenTUI alongside terminal-kit
2. Create new directory structure:
   ```
   src/tui/
   ├── legacy/          # Move existing terminal-kit code here
   └── opentui/         # New OpenTUI implementation
       ├── app.ts
       ├── screens/
       ├── components/
       └── utils/
   ```
3. Update `cli.ts` to allow switching between implementations

### Phase 2: Core Infrastructure

1. Migrate `app.ts` (bootstrap, lifecycle)
2. Create OpenTUI theme adapter (convert existing theme to RGBA)
3. Update router to work with OpenTUI screens
4. Implement base screen class/pattern

### Phase 3: Screen-by-Screen Migration

1. **Dashboard** - Uses menu selection (maps to `SelectRenderable`)
2. **FilePicker** - Uses scrollable list (maps to `SelectRenderable` with custom rendering)
3. **Processing** - Uses progress display (maps to `TextRenderable` updates)

### Phase 4: Cleanup

1. Remove terminal-kit dependency
2. Delete legacy code
3. Update tests

---

## Detailed Migration Examples

### Example 1: Dashboard Screen

**Current Implementation** (`src/tui/screens/dashboard.ts`):

```typescript
import { terminal as term, Terminal } from 'terminal-kit';
import { Layout } from '../utils/layout';
import { theme } from '../theme';
import gradient from 'gradient-string';

export class Dashboard implements Screen {
  readonly name = 'dashboard';
  private selectedIndex = 0;
  private layout: Layout;
  private keyHandler: ((key: string) => void) | null = null;

  private menuItems = [
    { key: 'convert', label: 'Convert CSV to ILR XML', desc: '...', implemented: true },
    { key: 'validate', label: 'Validate XML Submission', desc: '...', implemented: false },
    // ...
  ];

  constructor(private term: Terminal) {
    this.layout = new Layout(term);
  }

  async render(): Promise<ScreenResult> {
    return new Promise((resolve) => {
      this.drawScreen();

      this.keyHandler = (key: string) => {
        if (key === 'UP' && this.selectedIndex > 0) {
          this.selectedIndex--;
          this.drawScreen();
        } else if (key === 'DOWN' && this.selectedIndex < this.menuItems.length - 1) {
          this.selectedIndex++;
          this.drawScreen();
        } else if (key === 'ENTER') {
          const selected = this.menuItems[this.selectedIndex];
          if (selected.implemented) {
            this.cleanup();
            resolve({ action: 'push', screen: selected.key });
          }
        } else if (key === 'q') {
          this.cleanup();
          resolve({ action: 'exit' });
        }
      };

      this.term.on('key', this.keyHandler);
    });
  }

  private drawScreen(): void {
    const region = this.layout.draw({
      title: 'Dashboard',
      statusBar: '[↑↓] Navigate  [ENTER] Select  [q] Quit',
    });

    // Draw gradient title
    const titleGradient = gradient(['#6F2A52', '#3E7F96']);
    this.term.moveTo(4, region.contentTop);
    console.log(titleGradient('IRIS - ILR Toolkit'));

    // Draw menu items
    this.menuItems.forEach((item, index) => {
      const y = region.contentTop + 3 + index * 2;
      const isSelected = index === this.selectedIndex;

      this.term.moveTo(4, y);

      if (isSelected) {
        this.term.bgColorRgbHex(theme.highlight);
        this.term.eraseLineAfter();
      }

      const prefix = isSelected ? '▸ ' : '  ';
      const number = `${index + 1}. `;

      this.term.colorRgbHex(isSelected ? theme.primary : theme.text);
      this.term(prefix + number + item.label);
      this.term.styleReset();
    });
  }

  cleanup(): void {
    if (this.keyHandler) {
      this.term.removeListener('key', this.keyHandler);
    }
  }
}
```

**Migrated to OpenTUI**:

```typescript
import {
  createCliRenderer,
  GroupRenderable,
  TextRenderable,
  SelectRenderable,
  SelectRenderableEvents,
  BoxRenderable,
  TextAttributes,
  RGBA,
  type KeyEvent,
} from '@opentui/core';
import type { Screen, ScreenResult, RenderContext } from '../types';
import { theme } from '../theme';

export class Dashboard implements Screen {
  readonly name = 'dashboard';

  private container!: GroupRenderable;
  private menu!: SelectRenderable;
  private keyHandler!: (key: KeyEvent) => void;

  private menuItems = [
    { name: 'Convert CSV to ILR XML', description: 'Transform learner data', key: 'convert', implemented: true },
    { name: 'Validate XML Submission', description: 'Check for errors', key: 'validate', implemented: false },
    { name: 'Cross-Submission Check', description: 'Compare submissions', key: 'check', implemented: false },
    { name: 'View History', description: 'Past conversions', key: 'history', implemented: false },
    { name: 'Settings', description: 'Configure Iris', key: 'settings', implemented: false },
    { name: 'Exit', description: 'Quit application', key: 'exit', implemented: true },
  ];

  constructor(private ctx: RenderContext) {}

  async render(): Promise<ScreenResult> {
    return new Promise((resolve) => {
      this.buildUI();

      // Handle menu selection
      this.menu.on(SelectRenderableEvents.ITEM_SELECTED, (index, option) => {
        const item = this.menuItems[index];
        if (item.implemented) {
          this.cleanup();
          if (item.key === 'exit') {
            resolve({ action: 'exit' });
          } else {
            resolve({ action: 'push', screen: item.key });
          }
        }
      });

      // Handle quit shortcut
      this.keyHandler = (key: KeyEvent) => {
        if (key.name === 'q') {
          this.cleanup();
          resolve({ action: 'exit' });
        }
      };

      this.ctx.renderer.keyInput.on('keypress', this.keyHandler);
    });
  }

  private buildUI(): void {
    const { renderer } = this.ctx;

    // Main container (full screen, vertical layout)
    this.container = new GroupRenderable(renderer, {
      id: 'dashboard-container',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      backgroundColor: theme.background,
    });

    // Header section
    const header = new GroupRenderable(renderer, {
      id: 'header',
      height: 5,
      paddingLeft: 4,
      paddingTop: 1,
    });

    const title = new TextRenderable(renderer, {
      id: 'title',
      content: 'IRIS - ILR Toolkit',
      fg: theme.primary,
      attributes: TextAttributes.BOLD,
    });

    const subtitle = new TextRenderable(renderer, {
      id: 'subtitle',
      content: 'Individualised Learner Record Management',
      fg: theme.textMuted,
      marginTop: 1,
    });

    header.add(title);
    header.add(subtitle);

    // Menu section (grows to fill available space)
    const menuContainer = new GroupRenderable(renderer, {
      id: 'menu-container',
      flexGrow: 1,
      paddingLeft: 4,
      paddingTop: 2,
    });

    this.menu = new SelectRenderable(renderer, {
      id: 'main-menu',
      options: this.menuItems.map(item => ({
        name: item.name,
        description: item.description,
        disabled: !item.implemented,
      })),
      width: 50,
      selectedFg: theme.primary,
      selectedBg: theme.highlight,
      disabledFg: theme.textMuted,
    });

    menuContainer.add(this.menu);

    // Status bar (fixed at bottom)
    const statusBar = new TextRenderable(renderer, {
      id: 'status-bar',
      content: '[↑↓/jk] Navigate  [ENTER] Select  [q] Quit',
      fg: theme.textMuted,
      height: 1,
      paddingLeft: 2,
    });

    // Assemble layout
    this.container.add(header);
    this.container.add(menuContainer);
    this.container.add(statusBar);

    renderer.root.add(this.container);
  }

  cleanup(): void {
    this.ctx.renderer.keyInput.off('keypress', this.keyHandler);
    this.ctx.renderer.root.remove(this.container);
  }
}
```

### Example 2: File Picker Screen

**Key Changes**:

| Current (terminal-kit) | OpenTUI |
|------------------------|---------|
| Manual scroll tracking | `SelectRenderable` handles scrolling |
| `term.moveTo()` positioning | Yoga flexbox layout |
| Custom highlight drawing | `selectedBg`/`selectedFg` props |
| `term.on('key')` | `renderer.keyInput.on('keypress')` |

**Current Implementation** (simplified):

```typescript
export class FilePicker implements Screen {
  private entries: FileEntry[] = [];
  private selectedIndex = 0;
  private scrollOffset = 0;

  private drawScreen(): void {
    const region = this.layout.draw({ title: 'Select CSV File' });

    const visibleItems = this.entries.slice(
      this.scrollOffset,
      this.scrollOffset + region.contentHeight
    );

    visibleItems.forEach((item, index) => {
      const y = region.contentTop + index;
      const isSelected = (this.scrollOffset + index) === this.selectedIndex;

      this.term.moveTo(1, y);
      if (isSelected) {
        this.term.bgColorRgbHex(theme.highlight);
        this.term.eraseLineAfter();
      }

      const icon = item.isDirectory ? '📁' : '📄';
      this.term('  ' + icon + '  ' + item.name);
      this.term.styleReset();
    });
  }
}
```

**Migrated to OpenTUI**:

```typescript
import {
  GroupRenderable,
  TextRenderable,
  SelectRenderable,
  SelectRenderableEvents,
  type KeyEvent,
} from '@opentui/core';

export class FilePicker implements Screen {
  private container!: GroupRenderable;
  private pathDisplay!: TextRenderable;
  private fileList!: SelectRenderable;
  private currentPath: string;
  private entries: FileEntry[] = [];

  async render(data?: ScreenData): Promise<ScreenResult> {
    this.currentPath = data?.startPath || process.cwd();
    await this.loadDirectory();

    return new Promise((resolve) => {
      this.buildUI();

      this.fileList.on(SelectRenderableEvents.ITEM_SELECTED, async (index) => {
        const entry = this.entries[index];

        if (entry.isDirectory) {
          // Navigate into directory
          this.currentPath = entry.path;
          await this.loadDirectory();
          this.updateFileList();
        } else {
          // File selected
          this.cleanup();
          resolve({
            action: 'push',
            screen: 'processing',
            data: { filePath: entry.path },
          });
        }
      });

      this.keyHandler = (key: KeyEvent) => {
        if (key.name === 'backspace') {
          // Navigate up
          this.currentPath = path.dirname(this.currentPath);
          this.loadDirectory().then(() => this.updateFileList());
        } else if (key.name === 'escape') {
          this.cleanup();
          resolve({ action: 'pop' });
        }
      };

      this.ctx.renderer.keyInput.on('keypress', this.keyHandler);
    });
  }

  private buildUI(): void {
    const { renderer } = this.ctx;

    this.container = new GroupRenderable(renderer, {
      id: 'filepicker-container',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
    });

    // Header with path breadcrumb
    const header = new GroupRenderable(renderer, {
      id: 'header',
      height: 4,
      paddingLeft: 2,
    });

    const title = new TextRenderable(renderer, {
      id: 'title',
      content: 'Select CSV File',
      fg: theme.primary,
      attributes: TextAttributes.BOLD,
    });

    this.pathDisplay = new TextRenderable(renderer, {
      id: 'path',
      content: this.shortenPath(this.currentPath),
      fg: theme.textMuted,
      marginTop: 1,
    });

    header.add(title);
    header.add(this.pathDisplay);

    // File list (scrollable)
    const listContainer = new GroupRenderable(renderer, {
      id: 'list-container',
      flexGrow: 1,
      paddingLeft: 2,
      overflow: 'scroll',
    });

    this.fileList = new SelectRenderable(renderer, {
      id: 'file-list',
      options: this.entries.map(e => ({
        name: `${e.isDirectory ? '📁' : '📄'}  ${e.name}`,
        description: e.isDirectory ? 'Directory' : this.formatSize(e.size),
      })),
      width: '100%',
      selectedBg: theme.highlight,
    });

    listContainer.add(this.fileList);

    // Status bar
    const statusBar = new TextRenderable(renderer, {
      id: 'status',
      content: '[↑↓] Nav  [ENTER] Select  [BACKSPACE] Up  [ESC] Back',
      fg: theme.textMuted,
      height: 1,
    });

    this.container.add(header);
    this.container.add(listContainer);
    this.container.add(statusBar);

    renderer.root.add(this.container);
  }

  private updateFileList(): void {
    // Update path display
    this.pathDisplay.content = this.shortenPath(this.currentPath);

    // Update file list options
    this.fileList.options = this.entries.map(e => ({
      name: `${e.isDirectory ? '📁' : '📄'}  ${e.name}`,
      description: e.isDirectory ? 'Directory' : this.formatSize(e.size),
    }));

    // Reset selection to top
    this.fileList.selectedIndex = 0;
  }
}
```

### Example 3: Processing Screen

The processing screen shows real-time progress from async workflows.

**Current approach**:
- Manual line-by-line positioning
- Explicit redraw on each event
- Custom status icons

**OpenTUI approach**:
- Update `TextRenderable.content` property
- Automatic re-render when properties change

```typescript
import {
  GroupRenderable,
  TextRenderable,
  BoxRenderable,
  TextAttributes,
} from '@opentui/core';

interface StepDisplay {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  message?: string;
  renderable?: TextRenderable;
}

export class ProcessingScreen implements Screen {
  private steps: StepDisplay[] = [
    { id: 'parse', name: 'Parse CSV', status: 'pending' },
    { id: 'validate', name: 'Validate Data', status: 'pending' },
    { id: 'generate', name: 'Generate XML', status: 'pending' },
    { id: 'save', name: 'Save Output', status: 'pending' },
  ];

  async render(data?: ScreenData): Promise<ScreenResult> {
    const filePath = data?.filePath as string;

    this.buildUI();

    try {
      const workflow = convertWorkflow({ filePath, registry });

      for await (const event of workflow) {
        this.handleEvent(event);
        // No explicit redraw needed - OpenTUI re-renders on property changes
      }
    } catch (err) {
      this.showError(err);
    }

    // Wait for user input to continue
    return new Promise((resolve) => {
      this.ctx.renderer.keyInput.once('keypress', () => {
        this.cleanup();
        resolve({ action: 'pop' });
      });
    });
  }

  private buildUI(): void {
    const { renderer } = this.ctx;

    this.container = new GroupRenderable(renderer, {
      id: 'processing-container',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      padding: 2,
    });

    const title = new TextRenderable(renderer, {
      id: 'title',
      content: 'Converting',
      fg: theme.primary,
      attributes: TextAttributes.BOLD,
      marginBottom: 2,
    });

    this.container.add(title);

    // Create renderable for each step
    this.steps.forEach(step => {
      const stepRow = new GroupRenderable(renderer, {
        id: `step-${step.id}`,
        flexDirection: 'row',
        marginBottom: 1,
      });

      step.renderable = new TextRenderable(renderer, {
        id: `step-text-${step.id}`,
        content: `○  ${step.name}`,
        fg: theme.textMuted,
      });

      stepRow.add(step.renderable);
      this.container.add(stepRow);
    });

    renderer.root.add(this.container);
  }

  private handleEvent(event: WorkflowStepEvent): void {
    const step = this.steps.find(s => s.id === event.step.id);
    if (!step?.renderable) return;

    if (event.type === 'step:start') {
      step.status = 'running';
      step.renderable.content = `◐  ${step.name}`;
      step.renderable.fg = theme.info;
    } else if (event.type === 'step:complete') {
      step.status = 'complete';
      step.renderable.content = `●  ${step.name}`;
      step.renderable.fg = theme.success;
    } else if (event.type === 'step:error') {
      step.status = 'failed';
      step.renderable.content = `✗  ${step.name}: ${event.step.error?.message}`;
      step.renderable.fg = theme.error;
    }
    // OpenTUI automatically re-renders when content/fg properties change
  }
}
```

---

## Component Migration Reference

### Theme Adapter

Create a utility to convert the existing theme to OpenTUI-compatible format:

```typescript
// src/tui/opentui/utils/theme-adapter.ts
import { RGBA } from '@opentui/core';
import { THEMES } from '../../theme';

export const opentuiTheme = {
  // Convert hex strings to RGBA
  success: RGBA.fromHex(THEMES.themeLight.success),
  warning: RGBA.fromHex(THEMES.themeLight.warning),
  error: RGBA.fromHex(THEMES.themeLight.error),
  info: RGBA.fromHex(THEMES.themeLight.info),
  primary: RGBA.fromHex(THEMES.themeLight.primary),
  secondary: RGBA.fromHex(THEMES.themeLight.secondary),
  accent: RGBA.fromHex(THEMES.themeLight.accent),
  highlight: RGBA.fromHex(THEMES.themeLight.highlight),
  text: RGBA.fromHex(THEMES.themeLight.text),
  textMuted: RGBA.fromHex(THEMES.themeLight.textMuted),
  border: RGBA.fromHex(THEMES.themeLight.border),
  background: RGBA.fromHex(THEMES.themeLight.background),
};

// Or use hex strings directly (OpenTUI accepts both)
export const theme = THEMES.themeLight;
```

### Common Component Mappings

| Current Pattern | OpenTUI Equivalent |
|-----------------|-------------------|
| `term.moveTo(x, y)` | Use `position: 'absolute'` with `left`/`top` props |
| `term.colorRgbHex(color)` | `fg` prop on TextRenderable |
| `term.bgColorRgbHex(color)` | `backgroundColor` prop |
| `term.bold` | `attributes: TextAttributes.BOLD` |
| `term.clear()` | Handled automatically by renderer |
| Custom menu loop | `SelectRenderable` |
| Custom input handling | `InputRenderable` |
| Box borders | `BoxRenderable` with `borderStyle` |

### Key Name Mapping

| terminal-kit | OpenTUI |
|--------------|---------|
| `'UP'` | `'up'` |
| `'DOWN'` | `'down'` |
| `'LEFT'` | `'left'` |
| `'RIGHT'` | `'right'` |
| `'ENTER'` | `'return'` |
| `'ESCAPE'` | `'escape'` |
| `'BACKSPACE'` | `'backspace'` |
| `'TAB'` | `'tab'` |
| `'PAGE_UP'` | `'pageup'` |
| `'PAGE_DOWN'` | `'pagedown'` |
| `'CTRL_C'` | `key.ctrl && key.name === 'c'` |

---

## Testing Considerations

### Unit Testing Components

OpenTUI components can be tested by mocking the renderer:

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Dashboard', () => {
  it('should resolve with push action on menu selection', async () => {
    const mockRenderer = createMockRenderer();
    const dashboard = new Dashboard({ renderer: mockRenderer });

    const resultPromise = dashboard.render();

    // Simulate menu selection
    mockRenderer.simulateKeypress({ name: 'return' });

    const result = await resultPromise;
    expect(result.action).toBe('push');
    expect(result.screen).toBe('convert');
  });
});
```

### Integration Testing

Test full screen flows by simulating user interaction sequences:

```typescript
describe('TUI Integration', () => {
  it('should navigate from dashboard to file picker', async () => {
    const tui = new TUI();
    await tui.start();

    // Navigate to convert
    tui.simulateKeypress({ name: 'return' });

    expect(tui.currentScreen).toBe('file-picker');
  });
});
```

---

## Resources

- [OpenTUI GitHub Repository](https://github.com/sst/opentui)
- [OpenTUI Getting Started Guide](https://github.com/sst/opentui/blob/main/packages/core/docs/getting-started.md)
- [Yoga Layout Documentation](https://yogalayout.dev/)
- [Current Iris TUI Implementation](../../../src/tui/)

---

## Migration Checklist

- [ ] Install Zig and @opentui/core
- [ ] Create theme adapter
- [ ] Set up new app.ts bootstrap
- [ ] Migrate Router (or adapt existing)
- [ ] Migrate Dashboard screen
- [ ] Migrate FilePicker screen
- [ ] Migrate Processing screen
- [ ] Migrate remaining screens (validation, success, etc.)
- [ ] Update tests
- [ ] Remove terminal-kit dependency
- [ ] Clean up legacy code

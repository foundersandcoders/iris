# TUI Framework Comparison: Charm Stack (Go) vs Textual (Python)

> A comprehensive analysis for developers with no prior Go or Python experience

## Executive Summary

This report compares two TUI framework options for Iris, assuming the TypeScript processing core (`src/lib/`) remains unchanged and must be consumed by the TUI via inter-process communication (IPC).

| Dimension | Charm Stack (Go) | Textual (Python) |
|-----------|------------------|------------------|
| **Language** | Go | Python |
| **Architecture** | Elm-inspired MVU | DOM/CSS-inspired |
| **Learning Curve** | Steeper (new paradigms) | Gentler (familiar concepts) |
| **Distribution** | Single static binary | Requires Python or packaging |
| **TypeScript IPC** | Excellent (JSON over stdio) | Excellent (JSON over stdio) |
| **Testing** | Good (teatest, catwalk) | Excellent (built-in, snapshot) |
| **Web Deployment** | No | Yes (textual serve) |
| **Ecosystem Maturity** | Very mature | Very mature |
| **Performance** | Exceptional | Very good |

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Language Learning Curve](#2-language-learning-curve)
3. [Framework Concepts & Patterns](#3-framework-concepts--patterns)
4. [Integration with TypeScript Core](#4-integration-with-typescript-core)
5. [Development Experience](#5-development-experience)
6. [Testing](#6-testing)
7. [Distribution & Packaging](#7-distribution--packaging)
8. [Component Libraries](#8-component-libraries)
9. [Styling & Theming](#9-styling--theming)
10. [Concurrency Models](#10-concurrency-models)
11. [Community & Ecosystem](#11-community--ecosystem)
12. [Iris-Specific Considerations](#12-iris-specific-considerations)
13. [Code Examples](#13-code-examples)
14. [Recommendation Matrix](#14-recommendation-matrix)
15. [Sources](#15-sources)

---

## 1. Architecture Overview

### 1.1 Charm Stack (Go)

The Charm stack consists of five complementary libraries:

| Library | Purpose |
|---------|---------|
| **Bubble Tea** | Core TUI framework implementing The Elm Architecture |
| **Bubbles** | Pre-built UI components (inputs, lists, tables, spinners) |
| **Lip Gloss** | Terminal styling (colors, borders, padding, alignment) |
| **Huh?** | Interactive forms and prompts |
| **Log** | Structured, colorful logging |

**The Elm Architecture (TEA)** is a functional pattern with three parts:

```
┌─────────────────────────────────────────────────────────┐
│                      Bubble Tea                         │
│  ┌─────────┐    ┌──────────┐    ┌─────────┐           │
│  │  Model  │───>│  Update  │───>│  View   │           │
│  │ (state) │    │ (logic)  │    │ (render)│           │
│  └─────────┘    └──────────┘    └─────────┘           │
│       ▲              │                │                │
│       │              │                │                │
│       └──────────────┴────────────────┘                │
│              Unidirectional Data Flow                  │
└─────────────────────────────────────────────────────────┘
```

- **Model**: A struct containing all application state
- **Update**: Receives messages (events), returns new state + optional commands
- **View**: Pure function that renders state to a string

### 1.2 Textual (Python)

Textual uses a web-inspired architecture:

```
┌─────────────────────────────────────────────────────────┐
│                       Textual                           │
│  ┌─────────────┐    ┌─────────────┐    ┌────────────┐ │
│  │   Widgets   │───>│     DOM     │───>│    CSS     │ │
│  │ (components)│    │ (hierarchy) │    │  (styles)  │ │
│  └─────────────┘    └─────────────┘    └────────────┘ │
│         │                  │                  │        │
│         ▼                  ▼                  ▼        │
│  ┌─────────────────────────────────────────────────┐  │
│  │              Reactive Render Tree               │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

- **Widgets**: Composable UI components (like React components)
- **DOM**: Tree structure of widgets (like browser DOM)
- **CSS**: External stylesheets using Textual CSS (TCSS)
- **Reactive Attributes**: State changes automatically trigger re-renders

---

## 2. Language Learning Curve

### 2.1 Go for TypeScript Developers

**Similarities to TypeScript:**
- Static typing (but stricter at compile-time)
- Interfaces and structural typing
- First-class functions
- Modern tooling (formatter, linter, LSP)

**Key Differences:**

| Concept | TypeScript | Go |
|---------|------------|-----|
| Null handling | `undefined`, `null` | Zero values, explicit pointers |
| Error handling | `try/catch`, `Promise.reject` | Multiple return values `(result, error)` |
| Generics | Full generics | Generics (added in Go 1.18) |
| Package management | npm/package.json | go.mod |
| Compilation | Transpiles to JS | Compiles to native binary |
| OOP | Classes, inheritance | Structs, composition, interfaces |
| Concurrency | async/await, Promises | Goroutines, channels |

**Learning Challenges:**

1. **Explicit error handling**: Every function that can fail returns an error
   ```go
   result, err := doSomething()
   if err != nil {
       return err
   }
   ```

2. **No classes**: Use structs with methods
   ```go
   type Model struct {
       choices []string
       cursor  int
   }

   func (m Model) View() string {
       // method on Model
   }
   ```

3. **Goroutines and channels**: Concurrent programming model
   ```go
   go func() {
       result <- expensiveOperation()
   }()
   ```

**Estimated learning timeline:**
- Basic syntax and concepts: 1-2 weeks
- Comfortable with idioms: 1-2 months
- Proficient with concurrency: 2-3 months

### 2.2 Python for TypeScript Developers

**Similarities to TypeScript:**
- High-level, expressive syntax
- Object-oriented with classes
- async/await syntax
- Rich standard library
- Dynamic typing option (TypeScript's `any`)

**Key Differences:**

| Concept | TypeScript | Python |
|---------|------------|--------|
| Typing | Required (in TS) | Optional (type hints) |
| Indentation | Curly braces | Significant whitespace |
| Package management | npm | pip/poetry/uv |
| Runtime | Node.js/Bun/Browser | CPython |
| Concurrency | async/await | async/await (asyncio) |
| REPL | Limited | Excellent |

**Learning Challenges:**

1. **Significant whitespace**: Indentation defines scope
   ```python
   def greet(name):
       if name:
           print(f"Hello, {name}")
       else:
           print("Hello, stranger")
   ```

2. **Dynamic typing**: Types are checked at runtime (unless using type hints)
   ```python
   def add(a: int, b: int) -> int:  # Type hints are optional
       return a + b
   ```

3. **asyncio complexity**: Event loop management
   ```python
   async def fetch_data():
       await asyncio.sleep(1)
       return "data"
   ```

**Estimated learning timeline:**
- Basic syntax and concepts: 3-5 days
- Comfortable with idioms: 2-4 weeks
- Proficient with async: 1-2 months

---

## 3. Framework Concepts & Patterns

### 3.1 Bubble Tea (Go) Concepts

#### The Model-Update-View Cycle

```go
// 1. Define your state
type model struct {
    choices  []string
    cursor   int
    selected map[int]struct{}
}

// 2. Handle events
func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        switch msg.String() {
        case "up", "k":
            if m.cursor > 0 {
                m.cursor--
            }
        case "down", "j":
            if m.cursor < len(m.choices)-1 {
                m.cursor++
            }
        case "enter":
            m.selected[m.cursor] = struct{}{}
        case "q":
            return m, tea.Quit
        }
    }
    return m, nil
}

// 3. Render the UI (returns a string)
func (m model) View() string {
    s := "Select an option:\n\n"
    for i, choice := range m.choices {
        cursor := " "
        if m.cursor == i {
            cursor = ">"
        }
        s += fmt.Sprintf("%s %s\n", cursor, choice)
    }
    return s
}
```

**Key concepts:**
- **Immutable state**: Update returns a new model
- **Commands**: Async operations that return messages
- **Messages**: Events (key presses, timers, custom)
- **Pure views**: View function has no side effects

#### Commands and Async Operations

```go
// Commands are functions that return messages
func checkServer() tea.Msg {
    resp, err := http.Get("http://api.example.com/status")
    if err != nil {
        return errMsg{err}
    }
    return statusMsg{resp.StatusCode}
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        if msg.String() == "c" {
            return m, checkServer  // Return command
        }
    case statusMsg:
        m.status = msg.code
    case errMsg:
        m.err = msg.err
    }
    return m, nil
}
```

### 3.2 Textual (Python) Concepts

#### Widget-Based Architecture

```python
from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Button, Static
from textual.containers import Container

class MyApp(App):
    CSS_PATH = "styles.tcss"

    def compose(self) -> ComposeResult:
        """Create child widgets."""
        yield Header()
        yield Container(
            Static("Welcome to the app!", id="welcome"),
            Button("Start", id="start", variant="primary"),
            Button("Quit", id="quit", variant="error"),
        )
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        """Handle button press events."""
        if event.button.id == "quit":
            self.exit()
        elif event.button.id == "start":
            self.query_one("#welcome").update("Processing...")
```

**Key concepts:**
- **compose()**: Declares widget hierarchy (like JSX/Svelte)
- **Event handlers**: Method naming convention `on_<widget>_<event>`
- **Querying**: Select widgets with CSS-like selectors
- **Reactive attributes**: Auto-trigger updates on change

#### Reactive Attributes

```python
from textual.reactive import reactive

class Counter(Static):
    count = reactive(0)  # Reactive attribute

    def watch_count(self, count: int) -> None:
        """Called when count changes."""
        self.update(f"Count: {count}")

    def on_click(self) -> None:
        self.count += 1  # Automatically triggers watch_count
```

#### CSS Styling (TCSS)

```css
/* styles.tcss */
Screen {
    layout: grid;
    grid-size: 2;
    grid-gutter: 2;
}

#welcome {
    content-align: center middle;
    text-style: bold;
    color: $accent;
    padding: 1 2;
}

Button {
    width: 100%;
}

Button:hover {
    background: $accent;
}
```

---

## 4. Integration with TypeScript Core

Both frameworks require IPC (Inter-Process Communication) to consume the TypeScript processing core in `src/lib/`.

### 4.1 Architecture Pattern

```
┌─────────────────┐         JSON/stdio         ┌─────────────────┐
│                 │◄─────────────────────────►│                 │
│   TUI Process   │         subprocess         │  TypeScript     │
│   (Go/Python)   │                            │  Core (Bun)     │
│                 │                            │                 │
└─────────────────┘                            └─────────────────┘
        │                                              │
        │ renders UI                                   │ processes data
        ▼                                              ▼
   ┌─────────┐                                  ┌─────────────┐
   │ Terminal│                                  │ CSV → XML   │
   └─────────┘                                  │ Validation  │
                                                └─────────────┘
```

### 4.2 Go Integration (Bubble Tea)

```go
package main

import (
    "bufio"
    "encoding/json"
    "os/exec"

    tea "github.com/charmbracelet/bubbletea"
)

type ProcessResult struct {
    Success bool     `json:"success"`
    Data    string   `json:"data"`
    Errors  []string `json:"errors"`
}

// Command to process CSV via TypeScript
func processCSV(filepath string) tea.Cmd {
    return func() tea.Msg {
        cmd := exec.Command("bun", "run", "src/lib/process.ts", filepath)

        stdout, _ := cmd.StdoutPipe()
        cmd.Start()

        var result ProcessResult
        json.NewDecoder(stdout).Decode(&result)
        cmd.Wait()

        return processResultMsg{result}
    }
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        if msg.String() == "enter" {
            return m, processCSV(m.selectedFile)
        }
    case processResultMsg:
        m.result = msg.result
        m.processing = false
    }
    return m, nil
}
```

**Libraries for Go ↔ Node.js IPC:**
- [ipc-node-go](https://www.npmjs.com/package/ipc-node-go) - Simple stdin/stdout IPC
- [go2node](https://github.com/zealic/go2node) - Node.js IPC interop for Go

### 4.3 Python Integration (Textual)

```python
import asyncio
import json
from textual.app import App
from textual.worker import Worker, get_current_worker

class IrisApp(App):

    async def process_csv(self, filepath: str) -> dict:
        """Run TypeScript processing core via subprocess."""
        proc = await asyncio.create_subprocess_exec(
            "bun", "run", "src/lib/process.ts", filepath,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
        return json.loads(stdout.decode())

    @work(exclusive=True)
    async def start_processing(self, filepath: str) -> None:
        """Worker to handle processing without blocking UI."""
        worker = get_current_worker()

        self.query_one("#status").update("Processing...")

        result = await self.process_csv(filepath)

        if not worker.is_cancelled:
            self.query_one("#status").update(
                "Success!" if result["success"] else "Failed"
            )
            self.result = result
```

**Key Python considerations:**
- Use Textual's Worker API for non-blocking operations
- asyncio subprocess handles IPC cleanly
- JSON serialization/deserialization is straightforward

### 4.4 IPC Protocol Recommendation

For Iris, implement a simple JSON-RPC-like protocol:

```typescript
// TypeScript side (src/lib/ipc.ts)
interface Request {
  id: string;
  method: "validate" | "convert" | "check";
  params: Record<string, unknown>;
}

interface Response {
  id: string;
  result?: unknown;
  error?: { code: number; message: string };
}
```

```
TUI → TypeScript:
{"id":"1","method":"validate","params":{"file":"data.csv"}}

TypeScript → TUI:
{"id":"1","result":{"valid":true,"warnings":[]}}
```

---

## 5. Development Experience

### 5.1 Go Development (Charm Stack)

**IDE Support:**
- **VS Code**: Official Go extension with gopls LSP
- **GoLand**: Premium JetBrains IDE
- **Neovim/Vim**: Excellent with gopls

**Tooling (all built-in):**
```bash
go fmt ./...     # Format code (no config needed)
go vet ./...     # Static analysis
go test ./...    # Run tests
go build         # Compile to binary
go run main.go   # Run directly
```

**Debugging Bubble Tea apps:**
- Bubble Tea controls stdin/stdout, so standard print debugging doesn't work
- Use **Delve** debugger in headless mode:
  ```bash
  dlv debug --headless --listen=:2345
  # Connect from VS Code or another terminal
  ```
- Log to a file instead of stdout:
  ```go
  f, _ := tea.LogToFile("debug.log", "debug")
  defer f.Close()
  ```

**Hot reloading:**
```bash
# Use a tool like air or gow
air  # Watches files and rebuilds
```

### 5.2 Python Development (Textual)

**IDE Support:**
- **VS Code**: Python extension + Pylance
- **PyCharm**: Excellent Python IDE
- **Any editor**: Python has great LSP support

**Tooling:**
```bash
python -m venv .venv    # Create virtual environment
pip install textual     # Install dependencies
pip install textual-dev # Development tools

# Running
textual run my_app.py   # Run with devtools support
python my_app.py        # Run directly
```

**Textual DevTools (killer feature):**

```bash
# Terminal 1: Start the console
textual console

# Terminal 2: Run your app in dev mode
textual run --dev my_app.py
```

The console shows:
- All print() statements
- Log messages (DEBUG, INFO, WARN, ERROR)
- Events (keys, mouse, resize)
- System messages
- Widget tree inspection

**Filtering console output:**
```bash
textual console -x SYSTEM -x EVENT  # Exclude noisy messages
```

**Snapshot testing with screenshots:**
```bash
pytest --snapshot-update  # Generate SVG snapshots
```

### 5.3 Comparison Table

| Aspect | Charm (Go) | Textual (Python) |
|--------|------------|------------------|
| Setup complexity | `go mod init` | venv + pip |
| Code formatting | `go fmt` (universal) | black/ruff (configurable) |
| Type checking | Compile-time (strict) | Runtime + mypy (optional) |
| Debugging TUI | Headless Delve | DevTools console |
| Hot reload | Third-party (air) | Built-in (`textual run`) |
| REPL | None | Excellent |

---

## 6. Testing

### 6.1 Go Testing (Bubble Tea)

**Built-in testing with `teatest`:**

```go
package main

import (
    "testing"
    "time"

    tea "github.com/charmbracelet/bubbletea"
    "github.com/charmbracelet/x/exp/teatest"
)

func TestApp(t *testing.T) {
    // Create test model
    m := initialModel()
    tm := teatest.NewTestModel(
        t, m,
        teatest.WithInitialTermSize(80, 24),
    )

    // Send key events
    tm.Send(tea.KeyMsg{Type: tea.KeyDown})
    tm.Send(tea.KeyMsg{Type: tea.KeyEnter})

    // Assert final output matches golden file
    teatest.RequireEqualOutput(t, tm.FinalOutput(t))

    // Or assert on model state
    finalModel := tm.FinalModel(t).(model)
    if finalModel.cursor != 1 {
        t.Errorf("expected cursor at 1, got %d", finalModel.cursor)
    }
}
```

**Golden file testing:**
```bash
go test -update  # Create/update golden files
go test          # Compare against golden files
```

**Third-party: catwalk**

```go
import "github.com/knz/catwalk"

func TestWithCatwalk(t *testing.T) {
    m := NewModel()

    // Run through a sequence of inputs
    catwalk.RunModel(t, "testdata/scenario.txt", m)
}
```

### 6.2 Python Testing (Textual)

**Built-in testing framework:**

```python
import pytest
from textual.pilot import Pilot

from my_app import MyApp

@pytest.mark.asyncio
async def test_button_click():
    app = MyApp()
    async with app.run_test() as pilot:
        # Simulate clicking a button
        await pilot.click("#start-button")

        # Assert widget state
        status = app.query_one("#status")
        assert status.renderable == "Processing..."

@pytest.mark.asyncio
async def test_keyboard_navigation():
    app = MyApp()
    async with app.run_test() as pilot:
        # Send key presses
        await pilot.press("tab")
        await pilot.press("enter")

        # Check focus
        assert app.focused.id == "input-field"
```

**Snapshot testing (SVG comparison):**

```python
def test_app_screenshot(snap_compare):
    assert snap_compare("my_app.py")

def test_app_after_interaction(snap_compare):
    async def setup(pilot: Pilot):
        await pilot.click("#button")
        await pilot.pause()  # Wait for animations

    assert snap_compare("my_app.py", run_before=setup)
```

```bash
pytest --snapshot-update  # First run / update snapshots
pytest                    # Compare against snapshots
```

### 6.3 Testing Comparison

| Aspect | Charm (Go) | Textual (Python) |
|--------|------------|------------------|
| Test framework | Go testing + teatest | pytest + pytest-asyncio |
| Snapshot testing | Golden files | SVG screenshots |
| Programmatic interaction | tea.Msg simulation | Pilot API |
| Async test support | Not needed (sync) | Required (@pytest.mark.asyncio) |
| Mocking | Standard Go interfaces | unittest.mock / pytest-mock |
| CI integration | Simple (go test) | Simple (pytest) |

---

## 7. Distribution & Packaging

### 7.1 Go Distribution (Charm Stack)

**The killer advantage: single static binary**

```bash
# Build for current platform
go build -o iris-tui

# Cross-compile for all platforms
GOOS=linux GOARCH=amd64 go build -o iris-tui-linux-amd64
GOOS=darwin GOARCH=amd64 go build -o iris-tui-darwin-amd64
GOOS=darwin GOARCH=arm64 go build -o iris-tui-darwin-arm64
GOOS=windows GOARCH=amd64 go build -o iris-tui-windows-amd64.exe
```

**Result:**
- No runtime dependencies
- No installation required
- User just downloads and runs
- Typical binary size: 5-15 MB

**Automation with GoReleaser:**
```yaml
# .goreleaser.yaml
builds:
  - env:
      - CGO_ENABLED=0
    goos:
      - linux
      - darwin
      - windows
    goarch:
      - amd64
      - arm64

archives:
  - format: tar.gz
    name_template: "iris-tui_{{ .Version }}_{{ .Os }}_{{ .Arch }}"
```

### 7.2 Python Distribution (Textual)

**Option 1: pip installation (requires Python)**

```bash
pip install iris-tui
iris  # Run the app
```

**Option 2: PyInstaller (standalone executable)**

```bash
pip install pyinstaller
pyinstaller --onefile --add-data "styles.tcss:." main.py
```

**Challenges with Textual + PyInstaller:**
- CSS files need special handling
- Must detect frozen state and adjust paths:
  ```python
  import sys
  import os

  if getattr(sys, 'frozen', False):
      # Running as compiled
      base_path = os.path.dirname(sys.executable)
  else:
      # Running as script
      base_path = os.path.dirname(__file__)

  CSS_PATH = os.path.join(base_path, "styles.tcss")
  ```
- Platform-specific builds (no cross-compilation)
- Binary size: 30-100+ MB

**Option 3: Nuitka (alternative compiler)**

```bash
pip install nuitka
nuitka --onefile --include-data-file=styles.tcss=styles.tcss main.py
```

### 7.3 Distribution Comparison

| Aspect | Charm (Go) | Textual (Python) |
|--------|------------|------------------|
| Binary distribution | Native, excellent | PyInstaller/Nuitka (complex) |
| Cross-compilation | Built-in | Not supported |
| Binary size | 5-15 MB | 30-100+ MB |
| Startup time | Instant | Slower (extraction for onefile) |
| Dependencies | None | Python or bundled runtime |
| pip/npm install | No (not applicable) | Yes (requires Python) |

---

## 8. Component Libraries

### 8.1 Bubbles (Go)

Pre-built components for Bubble Tea:

| Component | Description | Iris Use Case |
|-----------|-------------|---------------|
| **Text Input** | Single-line input with cursor | File path entry |
| **Text Area** | Multi-line input | N/A |
| **List** | Filterable, paginated list | File selection |
| **Table** | Tabular data with navigation | Validation results |
| **Viewport** | Scrollable content area | Error details |
| **Spinner** | Activity indicator | Processing state |
| **Progress** | Progress bar with animation | Conversion progress |
| **File Picker** | Directory navigation | CSV file selection |
| **Paginator** | Page navigation | Large result sets |
| **Help** | Keybinding help view | Help screen |

**Usage example:**

```go
import (
    "github.com/charmbracelet/bubbles/list"
    "github.com/charmbracelet/bubbles/spinner"
    "github.com/charmbracelet/bubbles/progress"
)

type model struct {
    fileList list.Model
    spinner  spinner.Model
    progress progress.Model
}

func (m model) View() string {
    if m.processing {
        return m.spinner.View() + " Processing...\n" + m.progress.View()
    }
    return m.fileList.View()
}
```

### 8.2 Huh? (Go Forms)

Dedicated form library:

```go
import "github.com/charmbracelet/huh"

func getConfig() (*Config, error) {
    var config Config

    form := huh.NewForm(
        huh.NewGroup(
            huh.NewInput().
                Title("Output Directory").
                Value(&config.OutputDir).
                Validate(validatePath),

            huh.NewSelect[string]().
                Title("Format").
                Options(
                    huh.NewOption("XML", "xml"),
                    huh.NewOption("JSON", "json"),
                ).
                Value(&config.Format),

            huh.NewConfirm().
                Title("Overwrite existing?").
                Value(&config.Overwrite),
        ),
    ).WithTheme(huh.ThemeDracula())

    err := form.Run()
    return &config, err
}
```

**Features:**
- Type-safe generic values
- Built-in validation
- Dynamic forms (options depend on previous answers)
- Accessibility mode
- 5 built-in themes

### 8.3 Textual Widgets (Python)

Built-in widget library:

| Widget | Description | Iris Use Case |
|--------|-------------|---------------|
| **Input** | Text input field | File path entry |
| **TextArea** | Multi-line editor | N/A |
| **Button** | Clickable button | Actions |
| **DataTable** | Sortable, scrollable table | Validation results |
| **Tree** | Collapsible tree view | Error hierarchy |
| **ListView** | Scrollable list | File selection |
| **DirectoryTree** | File system browser | CSV file selection |
| **ProgressBar** | Progress indicator | Conversion progress |
| **LoadingIndicator** | Spinner | Processing state |
| **TabbedContent** | Tab navigation | Different views |
| **Header/Footer** | App chrome | Consistent layout |
| **Markdown** | Render markdown | Help text |

**Usage example:**

```python
from textual.app import App, ComposeResult
from textual.widgets import (
    Header, Footer, DataTable,
    DirectoryTree, ProgressBar, Button
)

class IrisApp(App):
    def compose(self) -> ComposeResult:
        yield Header()
        yield DirectoryTree(".", id="files")
        yield DataTable(id="results")
        yield ProgressBar(id="progress", show_eta=True)
        yield Button("Convert", id="convert", variant="primary")
        yield Footer()

    def on_directory_tree_file_selected(
        self, event: DirectoryTree.FileSelected
    ) -> None:
        self.selected_file = event.path
```

### 8.4 Component Comparison

| Aspect | Bubbles + Huh? (Go) | Textual (Python) |
|--------|---------------------|------------------|
| Component count | ~15 + form fields | 30+ |
| Customization | Composition | CSS + subclassing |
| Forms | Dedicated library (Huh?) | Built-in widgets |
| Data tables | Basic | Advanced (sorting, filtering) |
| Tree views | File picker only | Full tree widget |
| Markdown | No | Yes |
| Plots/Charts | No (third-party) | textual-plotext |

---

## 9. Styling & Theming

### 9.1 Lip Gloss (Go)

Programmatic styling with method chaining:

```go
import "github.com/charmbracelet/lipgloss"

var (
    // Define styles
    titleStyle = lipgloss.NewStyle().
        Bold(true).
        Foreground(lipgloss.Color("#FAFAFA")).
        Background(lipgloss.Color("#7D56F4")).
        Padding(0, 1)

    errorStyle = lipgloss.NewStyle().
        Foreground(lipgloss.Color("#FF0000")).
        Bold(true)

    boxStyle = lipgloss.NewStyle().
        Border(lipgloss.RoundedBorder()).
        BorderForeground(lipgloss.Color("#874BFD")).
        Padding(1, 2)
)

func (m model) View() string {
    title := titleStyle.Render("Iris TUI")

    content := boxStyle.Render(
        lipgloss.JoinVertical(
            lipgloss.Left,
            "Select a file:",
            m.fileList.View(),
        ),
    )

    return lipgloss.JoinVertical(lipgloss.Left, title, content)
}
```

**Features:**
- ANSI 16, 256, and True Color support
- Automatic color degradation for terminal compatibility
- Adaptive colors (light/dark background detection)
- Layout utilities (JoinHorizontal, JoinVertical, Place)
- Text measurement (Width, Height)

**Themes:**
```go
// Create a theme struct
type Theme struct {
    Primary   lipgloss.Style
    Secondary lipgloss.Style
    Error     lipgloss.Style
    Success   lipgloss.Style
}

var DarkTheme = Theme{
    Primary:   lipgloss.NewStyle().Foreground(lipgloss.Color("#7D56F4")),
    Secondary: lipgloss.NewStyle().Foreground(lipgloss.Color("#999999")),
    Error:     lipgloss.NewStyle().Foreground(lipgloss.Color("#FF0000")),
    Success:   lipgloss.NewStyle().Foreground(lipgloss.Color("#00FF00")),
}
```

### 9.2 Textual CSS (TCSS)

External stylesheets with CSS-like syntax:

```css
/* styles.tcss */

/* Variables */
$primary: #7D56F4;
$error: #FF5555;
$success: #50FA7B;

/* Base styles */
Screen {
    background: $surface;
}

/* ID selectors */
#title {
    text-style: bold;
    color: $primary;
    text-align: center;
    padding: 1 0;
}

/* Class selectors */
.error-message {
    color: $error;
    text-style: bold;
}

/* Widget type selectors */
Button {
    width: 100%;
    margin: 1 0;
}

Button:hover {
    background: $primary 50%;
}

Button:focus {
    border: tall $primary;
}

/* Pseudo-classes */
DataTable > .datatable--cursor {
    background: $primary 30%;
}

/* Layout */
#main-container {
    layout: grid;
    grid-size: 2 3;
    grid-gutter: 1;
}

/* Animations */
LoadingIndicator {
    color: $primary;
}
```

**Apply in Python:**
```python
class IrisApp(App):
    CSS_PATH = "styles.tcss"

    # Or inline CSS
    CSS = """
    #status {
        dock: bottom;
        height: 3;
        background: $surface-darken-1;
    }
    """
```

**Built-in themes:**
```python
from textual.app import App

class IrisApp(App):
    theme = "textual-dark"  # or "textual-light", custom themes
```

### 9.3 Styling Comparison

| Aspect | Lip Gloss (Go) | Textual CSS (Python) |
|--------|----------------|----------------------|
| Syntax | Method chaining (code) | CSS-like (external files) |
| Separation of concerns | Styles in code | Styles separate from logic |
| Variables | Go constants | CSS variables ($var) |
| Selectors | N/A (manual) | ID, class, type, pseudo |
| Layouts | Manual (Join functions) | Grid, flexbox |
| Animations | Third-party (harmonica) | Built-in |
| Learning curve | Familiar to Go devs | Familiar to web devs |
| Hot reload | Rebuild required | Automatic |

---

## 10. Concurrency Models

### 10.1 Go Concurrency (Goroutines & Channels)

```go
// Goroutines are lightweight (2KB stack)
go func() {
    result := expensiveOperation()
    resultChan <- result
}()

// Channels for communication
func processFiles(files []string) tea.Cmd {
    return func() tea.Msg {
        results := make(chan FileResult, len(files))

        // Process files concurrently
        for _, file := range files {
            go func(f string) {
                results <- processFile(f)
            }(file)
        }

        // Collect results
        var all []FileResult
        for range files {
            all = append(all, <-results)
        }

        return filesProcessedMsg{all}
    }
}
```

**In Bubble Tea:**
- Commands run concurrently by default
- Results are sent back as messages
- No async/await syntax needed
- Race detector: `go test -race`

**Learning challenges:**
- Understanding channel blocking
- Avoiding goroutine leaks
- Context cancellation patterns
- Select statements

### 10.2 Python Concurrency (asyncio)

```python
import asyncio
from textual.worker import work, Worker

class IrisApp(App):

    @work(exclusive=True, thread=False)
    async def process_files(self, files: list[str]) -> None:
        """Process files concurrently using asyncio."""
        tasks = [self.process_file(f) for f in files]
        results = await asyncio.gather(*tasks)

        self.results = results
        self.refresh()

    async def process_file(self, filepath: str) -> dict:
        """Process a single file."""
        proc = await asyncio.create_subprocess_exec(
            "bun", "run", "process.ts", filepath,
            stdout=asyncio.subprocess.PIPE,
        )
        stdout, _ = await proc.communicate()
        return json.loads(stdout)
```

**In Textual:**
- Worker API for background tasks
- `@work` decorator handles complexity
- Can use threads or asyncio
- Built-in cancellation support

**Learning challenges:**
- Event loop concepts
- async/await syntax
- Avoiding blocking the event loop
- Error handling in async code

### 10.3 Concurrency Comparison

| Aspect | Go (Goroutines) | Python (asyncio) |
|--------|-----------------|------------------|
| Model | CSP (channels) | Event loop |
| Syntax | `go func()` | `async def`, `await` |
| Overhead | 2KB per goroutine | Higher (coroutine objects) |
| True parallelism | Yes (multiple cores) | No (GIL for CPU) |
| Learning curve | Steep (new concepts) | Moderate (familiar syntax) |
| Debugging | Race detector | asyncio debug mode |

---

## 11. Community & Ecosystem

### 11.1 Charm Stack (Go)

**GitHub metrics (Jan 2026):**
| Repository | Stars | Contributors |
|------------|-------|--------------|
| Bubble Tea | 30k+ | 150+ |
| Bubbles | 7.6k+ | 90+ |
| Lip Gloss | 9k+ | 80+ |
| Huh? | 5k+ | 50+ |

**Notable users:**
- Microsoft Azure CLI tools
- AWS CLI tools
- NVIDIA
- Ubuntu
- 10,000+ applications

**Community resources:**
- [Charm Discord](https://charm.sh/chat) - Active community
- [charm.sh](https://charm.sh) - Official site with tutorials
- [Awesome Charm](https://github.com/charmbracelet/awesome-charm) - Curated resources

### 11.2 Textual (Python)

**GitHub metrics (Jan 2026):**
| Metric | Value |
|--------|-------|
| Stars | 33.8k+ |
| Contributors | 189+ |
| Releases | 207 (v7.3.0) |
| Projects using | 8,700+ |

**PyPI stats:**
- 250k+ downloads in Q1 2025

**Notable adoption:**
- IoT dashboards
- Cybersecurity monitoring
- LLM prompt tools
- Data science workflows

**Community resources:**
- [Textual Discord](https://discord.gg/Enf6Z3qhVr)
- [Official docs](https://textual.textualize.io/)
- [Real Python tutorials](https://realpython.com/python-textual/)

### 11.3 Ecosystem Comparison

| Aspect | Charm (Go) | Textual (Python) |
|--------|------------|------------------|
| Stars | 30k+ (Bubble Tea) | 33.8k+ |
| Maturity | 5+ years | 4+ years |
| Release frequency | Regular | Very active |
| Documentation | Good | Excellent |
| Commercial backing | Charm.sh | Textualize.io |
| Discord activity | High | High |
| Stack Overflow | Moderate | Growing |

---

## 12. Iris-Specific Considerations

### 12.1 Current Architecture

```
iris/
├── src/
│   ├── lib/           # TypeScript processing core (KEEP)
│   ├── tui/           # Current terminal-kit TUI (REPLACE)
│   ├── commands/      # CLI commands (KEEP)
│   └── cli.ts         # Entry point (MODIFY)
├── src-tauri/         # Desktop app (KEEP)
└── package.json       # Bun project (KEEP)
```

**What changes with either option:**
- `src/tui/` → Go or Python codebase
- `src/cli.ts` → Routes to subprocess TUI
- IPC layer needed for TypeScript core communication

### 12.2 Feature Requirements Mapping

| Iris Feature | Charm (Go) | Textual (Python) |
|--------------|------------|------------------|
| File picker | Bubbles FilePicker | DirectoryTree |
| Validation table | Bubbles Table | DataTable (better) |
| Progress indicators | Bubbles Progress/Spinner | ProgressBar/LoadingIndicator |
| Error exploration | Viewport + custom | Tree + Collapsible |
| Forms | Huh? (excellent) | Built-in widgets |
| Theming | Lip Gloss (code) | CSS (external) |
| Accessibility | Huh? accessible mode | Built-in screen reader support |

### 12.3 Workflow Complexity

**Iris workflows:**
1. Dashboard → File selection → Validation → Processing → Success/Error
2. Multi-step forms for configuration
3. Interactive error exploration
4. Real-time progress updates

**Charm approach:**
- Each screen is a Bubble Tea model
- Navigation via messages/commands
- Compose models for complex views

**Textual approach:**
- Each screen is a Screen widget
- Navigation via `push_screen`/`pop_screen`
- Built-in screen stack management

### 12.4 Integration Effort

| Task | Charm (Go) | Textual (Python) |
|------|------------|------------------|
| Project setup | `go mod init` | venv + pip |
| IPC layer | Medium (json + exec) | Medium (asyncio + json) |
| UI implementation | Medium-High | Medium |
| Testing setup | Medium | Easy (built-in) |
| Distribution | Easy (single binary) | Complex (PyInstaller) |
| **Total estimate** | 3-4 weeks | 2-3 weeks |

### 12.5 Risk Assessment

**Charm Stack Risks:**
- Steeper language learning curve
- Manual string construction for complex layouts
- Less familiar paradigm (Elm Architecture)
- Debugging requires headless setup

**Textual Risks:**
- Distribution complexity (Python dependency or packaging)
- Larger binary size if packaged
- asyncio complexity for real-time updates
- Slower startup if using PyInstaller onefile

---

## 13. Code Examples

### 13.1 Complete Minimal App - Bubble Tea

```go
package main

import (
    "fmt"
    "os"

    tea "github.com/charmbracelet/bubbletea"
    "github.com/charmbracelet/lipgloss"
)

var (
    titleStyle = lipgloss.NewStyle().
        Bold(true).
        Foreground(lipgloss.Color("#FAFAFA")).
        Background(lipgloss.Color("#7D56F4")).
        Padding(0, 1)

    selectedStyle = lipgloss.NewStyle().
        Foreground(lipgloss.Color("#7D56F4")).
        Bold(true)
)

type model struct {
    choices  []string
    cursor   int
    selected string
}

func initialModel() model {
    return model{
        choices: []string{"Convert CSV", "Validate XML", "Check History", "Quit"},
    }
}

func (m model) Init() tea.Cmd {
    return nil
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        switch msg.String() {
        case "ctrl+c", "q":
            return m, tea.Quit
        case "up", "k":
            if m.cursor > 0 {
                m.cursor--
            }
        case "down", "j":
            if m.cursor < len(m.choices)-1 {
                m.cursor++
            }
        case "enter":
            m.selected = m.choices[m.cursor]
            if m.selected == "Quit" {
                return m, tea.Quit
            }
        }
    }
    return m, nil
}

func (m model) View() string {
    s := titleStyle.Render("Iris TUI") + "\n\n"

    for i, choice := range m.choices {
        cursor := "  "
        style := lipgloss.NewStyle()

        if m.cursor == i {
            cursor = "▸ "
            style = selectedStyle
        }

        s += cursor + style.Render(choice) + "\n"
    }

    s += "\n(↑/↓ to move, enter to select, q to quit)\n"

    if m.selected != "" {
        s += fmt.Sprintf("\nSelected: %s", m.selected)
    }

    return s
}

func main() {
    p := tea.NewProgram(initialModel(), tea.WithAltScreen())
    if _, err := p.Run(); err != nil {
        fmt.Printf("Error: %v", err)
        os.Exit(1)
    }
}
```

### 13.2 Complete Minimal App - Textual

```python
from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Static, Button
from textual.containers import Container, Vertical
from textual.binding import Binding


class IrisApp(App):
    """Iris TUI Application."""

    CSS = """
    Screen {
        align: center middle;
    }

    #menu-container {
        width: 40;
        height: auto;
        border: tall $primary;
        padding: 1 2;
    }

    #title {
        text-align: center;
        text-style: bold;
        color: $text;
        padding: 1 0;
    }

    Button {
        width: 100%;
        margin: 1 0 0 0;
    }

    #selected {
        text-align: center;
        color: $success;
        padding: 1 0;
    }
    """

    BINDINGS = [
        Binding("q", "quit", "Quit"),
        Binding("up", "focus_previous", "Up", show=False),
        Binding("down", "focus_next", "Down", show=False),
    ]

    selected: str = ""

    def compose(self) -> ComposeResult:
        yield Header()
        yield Container(
            Static("Iris TUI", id="title"),
            Vertical(
                Button("Convert CSV", id="convert"),
                Button("Validate XML", id="validate"),
                Button("Check History", id="check"),
                Button("Quit", id="quit", variant="error"),
            ),
            Static("", id="selected"),
            id="menu-container",
        )
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        button_id = event.button.id

        if button_id == "quit":
            self.exit()
        else:
            self.selected = button_id
            self.query_one("#selected").update(f"Selected: {button_id}")


if __name__ == "__main__":
    app = IrisApp()
    app.run()
```

### 13.3 IPC Integration Example - Go

```go
package main

import (
    "bufio"
    "encoding/json"
    "os/exec"

    tea "github.com/charmbracelet/bubbletea"
)

// Messages
type (
    processStartMsg  struct{}
    processResultMsg struct{ result ProcessResult }
    processErrorMsg  struct{ err error }
)

type ProcessResult struct {
    Success  bool     `json:"success"`
    XMLPath  string   `json:"xmlPath"`
    Errors   []string `json:"errors"`
    Warnings []string `json:"warnings"`
}

// Command to call TypeScript core
func processCSV(filepath string) tea.Cmd {
    return func() tea.Msg {
        cmd := exec.Command("bun", "run", "src/lib/process.ts", filepath)

        stdout, err := cmd.StdoutPipe()
        if err != nil {
            return processErrorMsg{err}
        }

        if err := cmd.Start(); err != nil {
            return processErrorMsg{err}
        }

        var result ProcessResult
        if err := json.NewDecoder(stdout).Decode(&result); err != nil {
            return processErrorMsg{err}
        }

        if err := cmd.Wait(); err != nil {
            return processErrorMsg{err}
        }

        return processResultMsg{result}
    }
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        if msg.String() == "enter" && m.selectedFile != "" {
            m.processing = true
            return m, processCSV(m.selectedFile)
        }

    case processResultMsg:
        m.processing = false
        m.result = msg.result

    case processErrorMsg:
        m.processing = false
        m.error = msg.err
    }

    return m, nil
}
```

### 13.4 IPC Integration Example - Python

```python
import asyncio
import json
from pathlib import Path

from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Static, ProgressBar
from textual.worker import work


class ProcessResult:
    def __init__(self, data: dict):
        self.success = data.get("success", False)
        self.xml_path = data.get("xmlPath", "")
        self.errors = data.get("errors", [])
        self.warnings = data.get("warnings", [])


class IrisApp(App):
    result: ProcessResult | None = None

    def compose(self) -> ComposeResult:
        yield Header()
        yield Static("Ready", id="status")
        yield ProgressBar(id="progress", show_eta=False)
        yield Footer()

    @work(exclusive=True)
    async def process_csv(self, filepath: str) -> None:
        """Process CSV file via TypeScript core."""
        status = self.query_one("#status", Static)
        progress = self.query_one("#progress", ProgressBar)

        status.update("Processing...")
        progress.update(progress=0.0)

        try:
            proc = await asyncio.create_subprocess_exec(
                "bun", "run", "src/lib/process.ts", filepath,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            # Simulate progress (real impl would stream)
            progress.update(progress=0.5)

            stdout, stderr = await proc.communicate()

            if proc.returncode != 0:
                status.update(f"Error: {stderr.decode()}")
                return

            result = ProcessResult(json.loads(stdout.decode()))
            self.result = result

            progress.update(progress=1.0)

            if result.success:
                status.update(f"Success! Output: {result.xml_path}")
            else:
                status.update(f"Failed: {', '.join(result.errors)}")

        except Exception as e:
            status.update(f"Error: {e}")

    def on_mount(self) -> None:
        # Example: start processing on mount
        self.process_csv("/path/to/file.csv")


if __name__ == "__main__":
    app = IrisApp()
    app.run()
```

---

## 14. Recommendation Matrix

### 14.1 Decision Factors

Score each factor 1-5 (1=poor, 5=excellent):

| Factor | Weight | Charm (Go) | Textual (Python) |
|--------|--------|------------|------------------|
| Learning curve for TS dev | 20% | 2 | 4 |
| Distribution simplicity | 20% | 5 | 2 |
| Development velocity | 15% | 3 | 4 |
| Testing experience | 10% | 4 | 5 |
| Component richness | 10% | 4 | 5 |
| Debugging experience | 10% | 3 | 5 |
| Long-term maintainability | 10% | 4 | 4 |
| Performance | 5% | 5 | 4 |

**Weighted scores:**
- Charm Stack: 3.45
- Textual: 3.85

### 14.2 Scenario Recommendations

**Choose Charm Stack (Go) if:**
- Distribution simplicity is paramount (single binary)
- Team plans to learn Go anyway
- Performance is critical
- Target users don't have Python installed
- You want the smallest possible binary

**Choose Textual (Python) if:**
- Faster development iteration is priority
- Web deployment is desirable (textual serve)
- Team is more comfortable with Python
- Built-in testing is important
- CSS-based styling appeals (separation of concerns)
- Target users likely have Python

### 14.3 Final Recommendation for Iris

**Short-term (MVP):** Textual (Python)
- Faster path to working TUI
- Better debugging experience
- Familiar CSS-based styling
- Excellent built-in testing

**Long-term consideration:** Charm Stack (Go)
- If distribution becomes a pain point
- If Python dependency causes user friction
- If team becomes Go-proficient

**Hybrid approach (advanced):**
- Build TUI in Go for distribution
- Use TypeScript core via IPC
- Single binary ships to users
- Best of both worlds (but most complex)

---

## 15. Sources

### Framework Documentation
- [Bubble Tea GitHub](https://github.com/charmbracelet/bubbletea)
- [Textual GitHub](https://github.com/Textualize/textual)
- [Bubbles GitHub](https://github.com/charmbracelet/bubbles)
- [Lip Gloss GitHub](https://github.com/charmbracelet/lipgloss)
- [Huh? GitHub](https://github.com/charmbracelet/huh)
- [Charm Log GitHub](https://github.com/charmbracelet/log)

### Comparisons & Tutorials
- [LibHunt: Bubble Tea vs Textual](https://www.libhunt.com/compare-bubbletea-vs-textual)
- [7 TUI Libraries - LogRocket](https://blog.logrocket.com/7-tui-libraries-interactive-terminal-apps/)
- [Bubble Tea Tutorial - Inngest](https://www.inngest.com/blog/interactive-clis-with-bubbletea)
- [Textual Testing Guide](https://textual.textualize.io/guide/testing/)

### Language Learning
- [Go for JavaScript Developers](https://prateeksurana.me/blog/guide-to-go-for-javascript-developers/)
- [TypeScript vs Go](https://dev.to/encore/typescript-vs-go-choosing-your-backend-language-2bc5)
- [Python vs JavaScript 2025](https://weqtechnologies.com/why-python-and-javascript-remain-top-choices-in-2025/)

### Testing
- [Writing Bubble Tea Tests](https://carlosbecker.com/posts/teatest/)
- [Textual Testing Documentation](https://textual.textualize.io/guide/testing/)
- [Catwalk - Bubble Tea Test Library](https://github.com/knz/catwalk)

### Distribution
- [PyInstaller + Textual Discussion](https://github.com/Textualize/textual/discussions/4512)
- [Go Cross-Compilation](https://github.com/charmbracelet/bubbletea)

### Concurrency
- [Goroutines Guide](https://getstream.io/blog/goroutines-go-concurrency-guide/)
- [Python asyncio Best Practices](https://www.dataannotation.tech/developers/python-async-await-best-practices)
- [Textual Workers](https://textual.textualize.io/guide/workers/)

### IPC Patterns
- [Go-Node IPC](https://www.npmjs.com/package/ipc-node-go)
- [Python-Node IPC](https://dev.to/besworks/inter-process-communication-between-nodejs-and-python-djf)
- [Cross-Language TUI Pattern](https://dev.to/dev-tngsh/building-cross-language-tuis-one-go-binary-to-rule-them-all-published-13a5)

### Development Tools
- [VS Code Go Setup 2025](https://dipjyotimetia.medium.com/vs-code-setup-for-golang-development-in-2025-57ba0a50881c)
- [Textual DevTools](https://textual.textualize.io/guide/devtools/)

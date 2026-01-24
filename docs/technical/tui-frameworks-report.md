# TUI Framework Evaluation Report

**Audience:** Developers with little to no Python or Go experience.  
**Scope:** Compare TUI options while keeping the existing architecture unchanged: a shared TypeScript processing core consumed by the native GUI (Tauri/SvelteKit), direct CLI commands, and the TUI.  
**Goal:** A modern, polished TUI with the visual polish of tools like lazygit, toad, posting, and gh-dash.

---

## Executive Summary

The project needs a full-screen, polished TUI that feels modern, responsive, and workflow-driven. There are five viable paths, each with different tradeoffs in language, ecosystem, and integration cost:

1. **Charm Stack (Go)** — best-in-class TUI polish and performance, but requires a Go wrapper around the TypeScript core.
2. **Textual (Python)** — beautiful UI and strong developer ergonomics, but introduces Python runtime + packaging complexity.
3. **Neo Blessed (Node)** — JavaScript-first approach with faster integration to the TypeScript core, but lower-level UI composition compared to Charm/Textual.
4. **OpenTUI (Node)** — a more modern JS TUI stack with explicit design goals for rich UI, but younger ecosystem.
5. **Continue with terminal-kit (Node)** — minimal change risk and maximal integration speed, but more manual UI work to reach the “modern TUI” bar.

Given the “shared TypeScript core” constraint, **Node-based frameworks (Neo Blessed, OpenTUI, terminal-kit)** minimize integration friction. However, if UI polish and long-term maintainability are the top priority, **Charm Stack** or **Textual** can provide a stronger UI foundation at the cost of a language boundary.

---

## Evaluation Criteria (Aligned to Iris Constraints)

### 1) Integration with Shared TypeScript Core
- The shared core is written in TypeScript and already consumed by CLI and GUI.
- Any TUI option must not change core logic or APIs.
- Ideal: direct import of TypeScript modules from the TUI layer.
- Acceptable: wrap the core behind a stable command or IPC API and call it from a different runtime.

### 2) UI Capability for “Modern” TUIs
- Full-screen layouts, panes, and flexible layouts
- Styled components, typography, borders
- Table views, lists, forms, modals
- Smooth keyboard navigation and keybindings
- Asynchronous updates, progress bars, and log streaming

### 3) Developer Experience for Non-Go/Python Developers
- Learning curve
- Documentation quality
- How quickly a new contributor can be productive

### 4) Distribution & Packaging
- Cross-platform (macOS, Windows, Linux)
- Binary size and install process
- Terminal support and Unicode handling

### 5) Performance & Responsiveness
- Handling of large tables
- Smooth rendering with many updates

---

## Architecture Constraints (Non-Negotiable)

The project must keep the existing stack as-is:

- **Shared TypeScript core** (business logic) remains the only source of truth.
- **CLI commands** continue to use the core directly.
- **Tauri + SvelteKit GUI** continues to use the core directly.
- **TUI** must either:
  - Call the TypeScript core directly (Node runtime), or
  - Call it indirectly (child process / IPC) if written in Go or Python.

This constraint heavily influences the cost of each option.

---

## Concrete Rewrite Examples (What Actually Changes)

The current TUI blueprint is written with **terminal-kit** in mind and assumes direct imports from the TypeScript core. Switching frameworks changes **how** screens, input, and rendering are implemented—even if the workflows remain identical. Below are concrete “rewrite” examples for a few core pieces so the difference in effort is explicit.

### Example A: Workflow Progress (Parse + Generate)

**Current expectation (Node + terminal-kit):** the workflow calls the shared core directly and updates a progress bar + log in the same process.

```ts
// Node + terminal-kit (conceptual)
import { parse } from '../lib/parser';
import { generate } from '../lib/generator';
import { ProcessingScreen } from './screens/processing';

const screen = new ProcessingScreen(term);
screen.show('Converting CSV to XML');

const parseResult = await parse(csvPath, {
  onProgress: (p) => screen.updateProgress(p),
  onWarning: (w) => screen.addLog(w),
});

const xmlResult = await generate(parseResult.data, {
  onProgress: (p) => screen.updateProgress(p),
});
screen.showSuccess(xmlResult.path);
```

**Charm Stack (Go):** you cannot import TS directly. You must **wrap the core** and stream progress over IPC, then map that to Bubble Tea messages.

```go
// Go + Bubble Tea (conceptual)
// 1) Start a Node daemon that exposes parse/generate via JSON.
// 2) Bubble Tea program listens for progress messages and updates state.

type ProgressMsg struct{ Percent int }
type WarningMsg struct{ Text string }
type DoneMsg struct{ OutputPath string }

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
  switch msg := msg.(type) {
  case ProgressMsg:
    m.progress = msg.Percent
  case WarningMsg:
    m.logs = append(m.logs, msg.Text)
  case DoneMsg:
    m.outputPath = msg.OutputPath
    m.done = true
  }
  return m, nil
}
```

**Textual (Python):** similar IPC requirement; then map progress into reactive widgets.

```py
# Python + Textual (conceptual)
class Processing(Screen):
    progress = reactive(0)

    def on_mount(self):
        self.run_worker(self._run_job(), exclusive=True)

    async def _run_job(self):
        async for msg in stream_ipc("parse_generate", csv_path):
            if msg["type"] == "progress":
                self.progress = msg["percent"]
            elif msg["type"] == "warning":
                self.query_one(Log).write(msg["text"])
```

**Takeaway:** Node-based options can call the core directly; Go/Python must add IPC scaffolding and message mapping.

---

### Example B: File Picker + Preview Panel

**terminal-kit** approach: manual layout, manual file listing, manual redraw.

```ts
// terminal-kit (conceptual)
const files = await listDir(currentPath);
drawPanel({ title: currentPath, items: files, selectedIndex });
drawPreview(files[selectedIndex]);
term.on('key', (key) => {
  if (key === 'UP') selectedIndex--;
  if (key === 'DOWN') selectedIndex++;
  redraw();
});
```

**Neo Blessed** approach: use list + box widgets, wire keybindings.

```ts
// neo-blessed (conceptual)
const list = blessed.list({ items: files, keys: true, vi: true });
const preview = blessed.box({ label: 'Preview', content: previewText });
list.on('select item', (_, index) => preview.setContent(buildPreview(files[index])));
screen.append(list);
screen.append(preview);
```

**Charm Stack** approach: use Bubbles list component + separate view function for preview.

```go
// Bubble Tea (conceptual)
func (m model) View() string {
  left := m.list.View()
  right := lipgloss.NewStyle().Width(40).Render(m.previewText)
  return lipgloss.JoinHorizontal(lipgloss.Top, left, right)
}
```

**Takeaway:** terminal-kit is lowest-level (more manual effort). Neo Blessed is widget-based but less compositional than Charm. Charm gives strong layout + styling composition at the cost of Go + IPC.

---

### Example C: Validation Results Table (Errors + Detail Pane)

**OpenTUI** likely uses a component model (conceptual): build a split-pane with a table and a detail view.

```ts
// OpenTUI (conceptual)
<SplitPane>
  <Table rows={errors} onSelect={(row) => setSelected(row)} />
  <Panel title="Error Detail">
    <Text>{formatDetail(selected)}</Text>
  </Panel>
</SplitPane>
```

**terminal-kit** requires manual column widths, selection state, and redraw regions.

```ts
// terminal-kit (conceptual)
drawTable({ x: 2, y: 4, width: 50, rows, selectedIndex });
drawPanel({ x: 54, y: 4, width: 40, content: detailText });
term.on('key', (key) => {
  if (key === 'UP') selectedIndex--;
  if (key === 'DOWN') selectedIndex++;
  redraw();
});
```

**Takeaway:** OpenTUI aims for higher-level UI composition; terminal-kit requires more boilerplate to achieve the same UX.

---

## Option 1: Charm Stack (Go)

**Components:** Bubble Tea, Bubbles, Lip Gloss, Huh, Log

### What It Is
The Charm stack is a Go-based ecosystem that powers many of the most polished TUIs in the open-source world (lazygit, gh-dash, glow). Bubble Tea provides the state machine model; Bubbles adds reusable UI components (lists, tables, text inputs); Lip Gloss handles styling; Huh provides form flows; Log offers structured logs.

### Strengths
- **Industry-leading UI polish**: Strong layout abstractions and styling system.
- **Performance**: Go runs fast, handles large tables smoothly.
- **Ecosystem maturity**: Most example TUIs in your list are Go + Charm.
- **Great mental model**: The model–update–view architecture is clean and scalable.
- **Long-term maintainability**: Charm has a stable API and strong community.

### Weaknesses
- **Language boundary**: The shared core is TypeScript; Go can’t import it directly.
- **Integration complexity**: Requires a process boundary (IPC) or a rewrite of the interface layer.
- **Developer onboarding**: Team needs to learn Go (if they’re TS-first).

### Integration Strategy (Required)
You would need to **wrap the TypeScript core** in one of these ways:

1. **CLI Adapter**: Keep all business logic in the existing Node/TS CLI. The Go TUI calls it via child process + JSON input/output.  
   - Pros: Easy to implement.  
   - Cons: Slower startup, harder streaming.

2. **IPC Server**: Run a Node process that exposes APIs via stdin/stdout or a local socket. Go TUI sends messages for parsing, validation, etc.  
   - Pros: Better streaming, more efficient than starting a process each time.  
   - Cons: More plumbing, error handling.

3. **WASM or FFI**: Compile TS to WASM and embed in Go.  
   - Pros: Native integration.  
   - Cons: Very complex build setup, bigger maintenance burden.

### What the Team Would Need to Learn
- Go basics, including structs, interfaces, and the Bubble Tea update loop.
- The Charm “view model” approach.
- Building a small Go wrapper layer around the TS core.

### Best Use Case
If **visual polish and long-term TUI quality** outweigh integration complexity, Charm is the strongest option. It will produce a top-tier TUI but requires building a bridge to the TypeScript core.

---

## Option 2: Textual (Python)

### What It Is
Textual is a Python TUI framework modeled after modern UI toolkits. It supports CSS-like styling, component composition, async rendering, and reactive state management. It is powerful and visually polished.

### Strengths
- **Beautiful UI system**: CSS-like styling and layout grid.
- **Developer productivity**: Python is generally easy to learn; Textual is high-level.
- **Rapid iteration**: Fast feedback loop, good for prototyping.
- **Rich widget set**: Tables, trees, forms, dialogs.

### Weaknesses
- **Runtime mismatch**: The shared core is TS; Python can’t import it directly.
- **Packaging**: Python + dependencies can be heavier to distribute.
- **Less common in your example list**: Most of the “beautiful TUIs” listed are Go-based.

### Integration Strategy (Required)
The same bridging approaches as Go are needed:

1. **Child process CLI**: Textual calls the existing TS CLI and parses JSON output.  
2. **Local IPC**: Run a Node process as a daemon that exposes the core APIs.  

### What the Team Would Need to Learn
- Python basics (async/await, packaging, venv, pip).
- Textual’s component system and CSS syntax.
- Building the TypeScript core bridge (JSON + IPC).

### Best Use Case
If you want **high UI polish and easier learning curve** than Go, Textual is attractive. It still imposes the same integration barrier, but Python may feel more approachable for TS developers.

---

## Option 3: Neo Blessed (Node)

### What It Is
Neo Blessed is a fork/continuation of Blessed, a JS TUI library that supports full-screen layouts, input handling, and UI components. It runs in Node, so it can import the TypeScript core directly.

### Strengths
- **Direct integration** with the TypeScript core (no language boundary).
- **Immediate productivity** for a TS/JS team.
- **Large ecosystem**: many existing Blessed examples and extensions.

### Weaknesses
- **Lower-level UI abstraction**: More manual layout + rendering than Charm or Textual.
- **Polish gap**: Achieving a “lazygit-level” look will require custom components.
- **Less modern styling**: Styling is more limited compared to CSS or Lip Gloss.

### Integration Strategy (Simple)
- Build the TUI in Node and import the core directly.
- Use the existing CLI’s TS modules (e.g., parser, validator, generator).
- Reuse the core’s progress callbacks to drive status bars and logs.

### What the Team Would Need to Learn
- Neo Blessed APIs (layout, widgets, event handling).
- Best practices for redraw and performance in terminal UIs.

### Best Use Case
If **speed of integration** and **reusing TypeScript** are top priorities, Neo Blessed is a safe choice. It will take more UI polish work, but you stay in a single runtime.

---

## Option 4: OpenTUI (Node)

### What It Is
OpenTUI is a modern Node-based TUI framework focused on composable components and modern UX patterns. It aims to be more structured than Blessed while remaining JS-first.

### Strengths
- **JS/TS-native**: No bridging required.
- **Modern component model**: More structured than traditional Blessed.
- **Good fit for “app-like” TUIs**: Closer to React-like thinking.

### Weaknesses
- **Younger ecosystem**: Fewer third-party widgets and fewer examples.
- **Risk of maturity gaps**: You may need to build missing components.

### Integration Strategy (Simple)
- Import and call the TypeScript core directly.
- Build UI components that map to your existing workflows (convert, validate, check).

### What the Team Would Need to Learn
- OpenTUI component model.
- State management patterns in the framework.

### Best Use Case
If you want to stay in JS **and** pursue modern layout/styling beyond Blessed, OpenTUI is worth evaluating. It’s higher-risk than Neo Blessed because it’s newer, but it could yield a more polished UI.

---

## Option 5: Continue with terminal-kit

### What It Is
terminal-kit is a lower-level Node terminal library. It is already used in the repo’s TUI architecture guide and gives fine-grained control over rendering.

### Strengths
- **Zero integration friction**: Directly uses the TypeScript core.
- **Complete control**: You can build any UI you want if you’re willing to do manual layout.
- **Existing design docs**: The project already documents a detailed TUI design with terminal-kit.

### Weaknesses
- **High manual effort**: Must build many components by hand.
- **More code to maintain**: Custom widgets and layout logic.
- **Harder to match “modern” polish** without substantial investment.

### Integration Strategy (Already Compatible)
- Continue implementing the TUI layer in Node.
- Use the existing design docs as the blueprint.
- Build custom components (panels, tables, file pickers).

### What the Team Would Need to Learn
- terminal-kit APIs and rendering patterns.
- Manual handling of layout, resizing, and redraw logic.

### Best Use Case
If you want **maximum control and minimum disruption**, sticking with terminal-kit is safe. However, it will take more engineering effort to reach the same level of polish that Charm or Textual provide out of the box.

---

## Comparative Matrix (High-Level)

| Option | UI Polish | Integration with TS Core | Learning Curve | Ecosystem Maturity | Long-Term Risk |
|---|---|---|---|---|---|
| Charm Stack (Go) | **Excellent** | **Hard (bridge)** | Medium-High | **High** | Low |
| Textual (Python) | **Excellent** | **Hard (bridge)** | Medium | Medium-High | Medium |
| Neo Blessed (Node) | Medium | **Easy (direct)** | Low | Medium | Medium |
| OpenTUI (Node) | Medium-High | **Easy (direct)** | Low-Medium | Low-Medium | Medium-High |
| terminal-kit (Node) | Medium (manual) | **Easy (direct)** | Low | Medium | Low |

---

## Recommendation Guidance (Pick Based on Priorities)

### If “Modern TUI polish” is the top priority
- **Pick Charm Stack (Go)**.
- Expect to invest in a TypeScript bridge (IPC/CLI). The visual payoff is excellent.

### If you want polish but prefer a more approachable language
- **Pick Textual (Python)**.
- You still need a bridge, but Python’s learning curve may be gentler.

### If minimizing integration complexity is the top priority
- **Pick Neo Blessed or terminal-kit**.
- You stay in Node and can directly import the TypeScript core.

### If you want a modern JS TUI and are okay with some ecosystem risk
- **Pick OpenTUI**.
- It offers a more modern component model but is younger.

---

## Suggested Next Steps (Non-Binding)

1. **Prototype a single workflow** (CSV → XML conversion) in the leading candidate.
2. Measure:
   - Layout flexibility
   - Performance with large datasets
   - Ease of implementing your “dashboard + file picker + progress log” flow
3. Decide whether the UI polish gain outweighs the integration cost.

---

## Key Takeaway

The **language boundary** is the decisive factor. If you accept the extra work to bridge TypeScript into Go/Python, you gain best-in-class UI frameworks (Charm/Textual). If you prioritize staying in TypeScript/Node, Neo Blessed, OpenTUI, or terminal-kit reduce complexity but may require more custom UI engineering to hit the “beautiful modern TUI” bar.

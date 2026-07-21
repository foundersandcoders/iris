# Iris workflows

A walkthrough of the four core TUI workflows, illustrated with the recordings in [docs/assets/](../assets/). Each recording is scripted with [Charm VHS](https://github.com/charmbracelet/vhs) — see [tapes/](../../tapes/) for the source, and the README's [Demo recordings](../../README.md#demo-recordings) section for how to regenerate them.

All four start the same way: launch the TUI with `bun run cli` (or `iris` once globally installed), then choose an option from the dashboard.

## Convert

Turns a CSV export into an ILR-compliant XML submission.

![Convert workflow](../assets/convert.gif)

1. From the dashboard, select **Convert CSV to ILR XML**.
2. Pick a CSV file in the file picker. Iris parses it against the active column mapping (bundled: `fac-airtable-2025`).
3. The workflow runs through Parse → Validate → Generate → Save automatically.
4. On success, the **Conversion Complete** screen shows the output path, learner count, and duration.

## Validate

Checks a previously submitted CSV or XML file for structural and semantic issues.

![Validate workflow](../assets/validate.gif)

1. From the dashboard, select **Validate XML Submission**.
2. Pick a `.csv` or `.xml` file — Iris auto-detects the format.
3. The workflow runs Load → Parse → Validate → Report.
4. A clean file lands on **Validation Complete**; issues route instead to the interactive validation explorer, filterable by severity.

## Cross-Submission Check

Compares a current submission against a previous one to catch inconsistencies — a sudden drop in learner count, a schema mismatch, and similar.

![Cross-submission check workflow](../assets/check.gif)

1. From the dashboard, select **Cross-Submission Check**.
2. Pick the current XML submission, then the previous one to compare against.
3. Iris checks both against each other and against submission history.
4. Results land on the check-results screen: a two-pane view with the issue list on the left and detail on the right, navigable with `Tab` and the arrow keys.

## Mapping Builder

Manages the CSV→XSD column mappings that Convert uses.

![Mapping builder workflow](../assets/mapping-builder.gif)

1. From the dashboard, select **Mapping Builder** — this opens straight onto the mapping list, no file picker.
2. Navigate the list to see each mapping's field count, version, and target schema in the detail panel.
3. The bundled `fac-airtable-2025` mapping is read-only. Press `d` to duplicate it into an editable copy, opening the two-panel mapping editor (CSV columns on the left, XSD schema paths on the right, with search).
4. `Esc` backs out of the editor without saving; `n` starts a new mapping from a fresh CSV; `x` deletes a non-bundled mapping.

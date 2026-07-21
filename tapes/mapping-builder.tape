# |===================|| Mapping Builder ||==================|
# | List-level tour: browse the bundled mapping, show its
# | detail panel, then duplicate into the editor and back out
# | without saving (list-level only — no editor walkthrough).
# |===============================================================|

Output docs/assets/mapping-builder.gif

Source tapes/_common.tape

Require bun

Hide
Type "clear"
Enter
Type "bun run scripts/demo-env.ts setup"
Enter
Sleep 500ms
Type "clear"
Enter
Show

Type "bun run cli"
Enter
Sleep 3s

# Dashboard: select "Mapping Builder" — goes straight to the list
Type "4"
Sleep 1s

# Row 0 is "+ Create New Mapping" — move down to the bundled mapping
Down
Sleep 1s

# Duplicate the bundled mapping — pushes to mapping-editor in duplicate
# mode, breadcrumb becomes "Edit Mapping: ... (copy)"
Type "d"
Sleep 2s

# Back out without saving — no confirm/unsaved-changes guard fires here
Escape
Sleep 1s

# Back at the list — return to dashboard
Escape
Sleep 1s

# Quit via the dashboard's own "q" binding — a raw Ctrl+C skips OpenTUI's
# terminal-restore teardown and breaks all typing afterward.
Type "q"
Sleep 1s

Hide
Type "bun run scripts/demo-env.ts teardown"
Enter
Sleep 500ms
Show

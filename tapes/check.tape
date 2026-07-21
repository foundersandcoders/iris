# |===================|| Cross-Submission Check ||==================|
# | Two-file workflow: compare a current ILR submission
# | against a previous one for consistency.
# |=====================================================================|

Output docs/assets/check.gif

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

# Dashboard: select "Cross-Submission Check"
Type "3"
Sleep 1s

# Picker #1 "Select Current XML Submission" — ILR-10085696... sorts first
Enter
Sleep 1s

# Picker #2 "Select Previous XML Submission" auto-pushes — pick the other file
Down
Sleep 500ms
Enter
Sleep 3s

# check-results screen — back to dashboard (no issue list with two clean
# XMLs, so onBack via Esc is the only route; there's no Enter-bound menu)
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

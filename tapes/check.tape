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
Wait+Screen /Demo config written to|Recovering/
Type "clear"
Enter
Show

Type "iris"
Sleep 1s
Enter
Wait+Screen /Dashboard/
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
Wait+Screen@10s /Current:/
Sleep 3s

# check-results screen — back to dashboard (no issue list with two clean
# XMLs, so onBack via Esc is the only route; there's no Enter-bound menu)
Escape
Wait+Screen /Dashboard/
Sleep 3s

# Quit via the dashboard's own "q" binding — a raw Ctrl+C skips OpenTUI's
# terminal-restore teardown and breaks all typing afterward.
Type "q"
Sleep 1s

Hide
Type "bun run scripts/demo-env.ts teardown"
Enter
Wait+Screen /Restored original config|Removed demo config/
Show

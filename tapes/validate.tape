# |===================|| Validate ||==================|
# | Validate workflow: check a submitted ILR XML file
# | from dashboard through to a clean Success screen.
# |=====================================================|

Output docs/assets/validate.gif

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

# Dashboard: select "Validate XML Submission"
Type "2"
Sleep 1s

# File-picker opens on docs/data/iris/ — ILR-99999999... is the second row
Down
Sleep 500ms
Enter
Wait+Screen@10s /Validation (Complete|Failed)/
Sleep 3s

# Success screen — return to dashboard
Enter
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

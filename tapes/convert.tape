# |===================|| Convert ||==================|
# | Convert workflow: CSV -> ILR XML, from dashboard
# | through the picker to a clean Success screen.
# |=====================================================|

Output docs/assets/convert.gif

Source tapes/_common.tape

Require bun

Hide
Type "clear"
Enter
Type "bun run scripts/demo-env.ts setup convert"
Enter
Sleep 500ms
Type "clear"
Enter
Show

Type "bun run cli"
Enter
Sleep 3s

# Dashboard: select "Convert CSV to ILR XML"
Type "1"
Sleep 1s

# File-picker opens on docs/data/airtable/ — "25-26 Export.csv" sorts first
Enter
Sleep 4s

# Success screen — return to dashboard
Enter
Sleep 1s

# Quit via the dashboard's own "q" binding — this runs OpenTUI's proper
# renderer.destroy() teardown. A raw Ctrl+C skips that (leaves mouse-
# tracking/alt-screen sequences active), which breaks all typing afterward.
Type "q"
Sleep 1s

Hide
Type "bun run scripts/demo-env.ts teardown"
Enter
Sleep 500ms
Show

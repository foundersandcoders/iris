# |===================|| Hello, Iris ||==================|
# | Toolchain smoke test: launches the real full-screen TUI
# | via `bun run cli` to confirm VHS/ttyd render OpenTUI
# | correctly. Also serves as the template for TR.E2's
# | workflow tapes.
# |========================================================|

Output docs/assets/hello.gif

Source tapes/_common.tape

Require bun

Hide
Type "clear"
Enter
Show

Type "bun run cli"
Enter
Sleep 3s

Down
Sleep 1s
Up
Sleep 1s

Ctrl+C
Sleep 1s

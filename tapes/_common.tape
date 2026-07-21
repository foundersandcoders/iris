# |===================|| Shared VHS Settings ||==================|
# | Sourced by every recording tape via `Source tapes/_common.tape`.
# | Sets dimensions, font, and a Theme JSON mirroring the brand
# | palette in assets/brand/theme.ts (THEMES.themeLight).
# |
# | FontFamily is Fira Code, bundled at assets/fonts/FiraCode-Regular.ttf
# | and installed by generate-demos.ts before every render — VHS renders
# | via headless Chrome and resolves FontFamily against whatever fonts
# | are OS-registered, so an uninstalled font silently falls back to a
# | wide, non-monospace substitute (this broke every recording before).
# |
# | Width is wide enough for the real two-panel dashboard layout at this
# | FontSize — the previous 1200 wrapped both panels.
# |
# | This file holds settings only — no Output or commands — so it
# | stays safely `Source`-able from any tape.
# |==================================================================|

Set Width 1800
Set Height 900
Set FontSize 22
Set FontFamily "Fira Code"
Set Padding 20
Set TypingSpeed 60ms

Set Theme { "name": "Iris", "black": "#3A0F28", "red": "#B11A46", "green": "#2E6F4E", "yellow": "#B25A2A", "blue": "#3E7F96", "magenta": "#7A2A57", "cyan": "#5FA3BA", "white": "#FFF1F7", "brightBlack": "#6F2A52", "brightRed": "#D94E74", "brightGreen": "#4FAE7C", "brightYellow": "#E0934A", "brightBlue": "#5FA3BA", "brightMagenta": "#A45A84", "brightCyan": "#CCDDE6", "brightWhite": "#FFF1F7", "background": "#FFF1F7", "foreground": "#3A0F28", "selection": "#D6A3BF", "cursor": "#7A2A57" }

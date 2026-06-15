export const PALETTE = {
	dark: { name: 'chasm', colour: '#220817' },
	background: {
		main: { name: 'rosewash', main: '#FFF1F7', subtle: '#F3D8E6', nav: '#D6A3BF' },
		alt: { name: 'aether', main: '#F2F6FA', subtle: '#E8EFF6', nav: '#CCDDE6' },
	},
	foreground: {
		main: { name: 'tyrian', dark: '#3A0F28', midi: '#6F2A52', lite: '#A45A84' },
		alt: { name: 'blueglass', dark: '#1E3A44', midi: '#3E7F96', lite: '#5FA3BA' },
	},
	line: {
		main: { name: 'vein', colour: '#7A2A57' },
		alt: { name: 'scar', colour: '#3E1026' },
	},
	// Semantic state hues — analogous/harmonious with the Tyrian × Blueglass duo,
	// each with a `fg` tone (text/icons on light bg) and a brighter `accent` tone
	// (borders/fills/progress, and promoted to FG on the dark theme).
	// See docs/technical/tui-design-review.md §6.
	semantic: {
		verdant: { name: 'verdant', fg: '#2E6F4E', accent: '#4FAE7C' }, // valid / success
		ember: { name: 'ember', fg: '#B25A2A', accent: '#E0934A' }, // caution / warning
		flare: { name: 'flare', fg: '#B11A46', accent: '#D94E74' }, // blocking / error
	},
};

export const THEMES = {
	themeLight: {
		// Status — fg tones read as states on the light ground
		success: PALETTE.semantic.verdant.fg, // Verdant
		warning: PALETTE.semantic.ember.fg, // Ember
		error: PALETTE.semantic.flare.fg, // Flare
		info: PALETTE.foreground.alt.midi, // Blueglass Midi

		// Status accents — brighter register for borders/fills/progress
		successAccent: PALETTE.semantic.verdant.accent,
		warningAccent: PALETTE.semantic.ember.accent,
		errorAccent: PALETTE.semantic.flare.accent,
		infoAccent: PALETTE.foreground.alt.lite, // Blueglass Lite

		// UI
		primary: PALETTE.foreground.main.midi, // Tyrian Midi (Brand)
		secondary: PALETTE.foreground.alt.midi, // Blueglass Midi
		accent: PALETTE.line.main.colour, // Vein
		highlight: PALETTE.background.main.nav, // Rosewash Nav (Selection backgrounds)
		highlightFocused: PALETTE.foreground.alt.lite, // Rosewash Nav — active/focused panel selection
		highlightUnfocused: PALETTE.background.main.nav, // Blueglass Lite — inactive panel selection

		// Neutral
		text: PALETTE.foreground.main.dark, // Tyrian Dark (Main text)
		textMuted: PALETTE.foreground.main.lite, // Tyrian Lite (Subtext)
		border: PALETTE.background.main.nav, // Rosewash Nav
		background: PALETTE.background.main.main, // Rosewash Main
	},
	themeDark: {
		// Status — accent tones promoted to FG (brighter reads better on dark)
		success: PALETTE.semantic.verdant.accent,
		warning: PALETTE.semantic.ember.accent,
		error: PALETTE.semantic.flare.accent,
		info: PALETTE.foreground.alt.lite, // Blueglass Lite

		successAccent: PALETTE.semantic.verdant.accent,
		warningAccent: PALETTE.semantic.ember.accent,
		errorAccent: PALETTE.semantic.flare.accent,
		infoAccent: PALETTE.foreground.alt.lite,

		// UI — lifted so brand hues read on the chasm ground
		primary: PALETTE.foreground.main.lite, // Tyrian Lite
		secondary: PALETTE.foreground.alt.lite, // Blueglass Lite
		accent: PALETTE.line.main.colour, // Vein — focused-panel border
		highlight: PALETTE.foreground.main.dark, // Tyrian Dark — selection backgrounds
		highlightFocused: PALETTE.line.main.colour, // Vein — active/focused panel selection
		highlightUnfocused: PALETTE.foreground.main.dark, // Tyrian Dark — inactive panel selection

		// Neutral — light foregrounds on a genuinely dark ground
		text: PALETTE.background.main.main, // Rosewash (light text)
		textMuted: PALETTE.background.main.nav, // Rosewash Nav (dimmed text)
		border: PALETTE.foreground.main.lite, // Tyrian Lite — muted border
		background: PALETTE.dark.colour, // Chasm (dark ground)
	},
};

export const symbols = {
	arrows: {
		up: '↑',
		down: '↓',
		left: '←',
		right: '→',
	},
	bullet: {
		dot: '•',
	},
	info: {
		success: '✓',
		error: '✗',
		warning: '⚠',
		required: '⚡︎',
	},
	progress: {
		filled: '█',
		empty: '░',
	},
	status: {
		loading: '⋯',
	},
};

export const borders = {
	heavy: {
		topLeft: '┏',
		topRight: '┓',
		horizontal: '━',
		vertical: '┃',
		bottomLeft: '┗',
		bottomRight: '┛',
	},
	light: {
		topLeft: '┌',
		topRight: '┐',
		horizontal: '─',
		vertical: '│',
		bottomLeft: '└',
		bottomRight: '┘',
	},
};

export const spinners = {
	arcs: {
		spinR: ['◜', '◝', '◞', '◟'],
	},
	arrow: {
		spinR: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
	},
	boxes: {
		spinR: ['◰', '◳', '◲', '◱'],
	},
	dots: {
		spinR: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
	},
	hexagram: {
		scrollU: ['☷', '☳', '☵', '☶', '☳', '☱', '☲', '☰'],
	},
};

/** ====== OpenTUI Adapter ====== */
import { RGBA } from '@opentui/core';

/** Pre-computed RGBA objects for OpenTUI renderables
 * Use hex strings from THEMES.themeLight directly for simple fg/bg.
 * Use these RGBA objects when colour manipulation is needed.
 */
export const rgba = {
	success: RGBA.fromHex(THEMES.themeLight.success),
	warning: RGBA.fromHex(THEMES.themeLight.warning),
	error: RGBA.fromHex(THEMES.themeLight.error),
	info: RGBA.fromHex(THEMES.themeLight.info),
	successAccent: RGBA.fromHex(THEMES.themeLight.successAccent),
	warningAccent: RGBA.fromHex(THEMES.themeLight.warningAccent),
	errorAccent: RGBA.fromHex(THEMES.themeLight.errorAccent),
	infoAccent: RGBA.fromHex(THEMES.themeLight.infoAccent),
	primary: RGBA.fromHex(THEMES.themeLight.primary),
	secondary: RGBA.fromHex(THEMES.themeLight.secondary),
	accent: RGBA.fromHex(THEMES.themeLight.accent),
	highlight: RGBA.fromHex(THEMES.themeLight.highlight),
	highlightFocused: RGBA.fromHex(THEMES.themeLight.highlightFocused),
	highlightUnfocused: RGBA.fromHex(THEMES.themeLight.highlightUnfocused),
	text: RGBA.fromHex(THEMES.themeLight.text),
	textMuted: RGBA.fromHex(THEMES.themeLight.textMuted),
	border: RGBA.fromHex(THEMES.themeLight.border),
	background: RGBA.fromHex(THEMES.themeLight.background),
} as const;

/** Active theme as hex strings (OpenTUI accepts these directly) */
export const theme = THEMES.themeLight;

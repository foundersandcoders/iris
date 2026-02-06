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
};

export const THEMES = {
	themeLight: {
		// Status
		success: PALETTE.foreground.alt.dark,
		warning: PALETTE.foreground.main.lite,
		error: PALETTE.line.alt.colour,
		info: PALETTE.foreground.alt.midi,

		// UI
		primary: PALETTE.foreground.main.midi, // Tyrian Midi (Brand)
		secondary: PALETTE.foreground.alt.midi, // Blueglass Midi
		accent: PALETTE.line.main.colour, // Vein
		highlight: PALETTE.background.main.nav, // Rosewash Nav (Selection backgrounds)

		// Neutral
		text: PALETTE.foreground.main.dark, // Tyrian Dark (Main text)
		textMuted: PALETTE.foreground.main.lite, // Tyrian Lite (Subtext)
		border: PALETTE.background.main.nav, // Rosewash Nav
		background: PALETTE.background.main.main, // Rosewash Main
	},
	themeDark: {
		success: PALETTE.foreground.alt.dark,
		warning: PALETTE.foreground.main.lite,
		error: PALETTE.line.alt.colour,
		info: PALETTE.foreground.alt.midi,
		primary: PALETTE.foreground.main.midi,
		secondary: PALETTE.foreground.alt.midi,
		accent: PALETTE.line.main.colour,
		highlight: PALETTE.background.main.nav,
		text: PALETTE.foreground.main.dark,
		textMuted: PALETTE.foreground.main.lite,
		border: PALETTE.background.main.nav,
		background: PALETTE.background.main.main,
	},
};

export const symbols = {
	success: '✓',
	error: '✗',
	warning: '⚠',
	arrow: '→',
	bullet: '•',
	loading: '⋯',
	progressFilled: '█',
	progressEmpty: '░',
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
	dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
	arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
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
	primary: RGBA.fromHex(THEMES.themeLight.primary),
	secondary: RGBA.fromHex(THEMES.themeLight.secondary),
	accent: RGBA.fromHex(THEMES.themeLight.accent),
	highlight: RGBA.fromHex(THEMES.themeLight.highlight),
	text: RGBA.fromHex(THEMES.themeLight.text),
	textMuted: RGBA.fromHex(THEMES.themeLight.textMuted),
	border: RGBA.fromHex(THEMES.themeLight.border),
	background: RGBA.fromHex(THEMES.themeLight.background),
} as const;

/** Active theme as hex strings (OpenTUI accepts these directly) */
export const theme = THEMES.themeLight;

/** ====== Command Palette Test Fixtures ======
 * Palette screen data for tests, kept free of any OpenTUI/theme import.
 * fuzzy.test.ts is the only tui suite that needs no
 * vi.mock('@opentui/core'), since fuzzy.ts has no theme import, so
 * importing PALETTE_SCREENS from keymap.ts here would transitively pull
 * the real package in and force a mock into an otherwise clean suite.
 *
 * Mirrored from src/tui/utils/keymap.ts's PALETTE_SCREENS; keymap.test.ts
 * asserts the two stay in sync.
 */

/** Screen names only, matching PALETTE_SCREENS.map(e => e.screen) order. */
export const paletteScreenNames = [
	'dashboard',
	'mapping-builder',
	'mapping-editor',
	'settings',
	'about',
	'history',
];

/** Three-entry subset for palette dispatch tests. */
export const paletteEntries = [
	{ screen: 'dashboard', label: 'Dashboard' },
	{ screen: 'settings', label: 'Settings' },
	{ screen: 'history', label: 'History' },
];

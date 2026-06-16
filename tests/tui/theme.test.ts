import { describe, it, expect } from 'vitest';
import { PALETTE, THEMES, symbols, borders, spinners, rgba, theme } from '../../brand/theme';
import { RGBA } from '@opentui/core';

const hexPattern = /^#[0-9a-f]{6}$/i;

describe('PALETTE.semantic vocabulary', () => {
	it('defines Verdant / Ember / Flare with fg + accent tones', () => {
		for (const role of ['verdant', 'ember', 'flare'] as const) {
			const hue = PALETTE.semantic[role];
			expect(hue.fg).toMatch(hexPattern);
			expect(hue.accent).toMatch(hexPattern);
			// Accent is a brighter register, so it must differ from the fg tone.
			expect(hue.accent).not.toBe(hue.fg);
		}
	});

	it('maps the documented semantic hues', () => {
		expect(PALETTE.semantic.verdant.fg).toBe('#2E6F4E');
		expect(PALETTE.semantic.ember.fg).toBe('#B25A2A');
		expect(PALETTE.semantic.flare.fg).toBe('#B11A46');
	});
});

describe('THEMES.themeLight', () => {
	const themeLight = THEMES.themeLight;

	it('exports status colors', () => {
		expect(themeLight.success).toBeDefined();
		expect(themeLight.warning).toBeDefined();
		expect(themeLight.error).toBeDefined();
		expect(themeLight.info).toBeDefined();
	});

	it('exports status accent colors', () => {
		expect(themeLight.successAccent).toBeDefined();
		expect(themeLight.warningAccent).toBeDefined();
		expect(themeLight.errorAccent).toBeDefined();
		expect(themeLight.infoAccent).toBeDefined();
	});

	it('status colours read as distinct states', () => {
		const { success, warning, error, info } = themeLight;
		const states = new Set([success, warning, error, info]);
		expect(states.size).toBe(4);
		// warning previously collided with textMuted — guard against regression.
		expect(themeLight.warning).not.toBe(themeLight.textMuted);
	});

	it('exports UI colors', () => {
		expect(themeLight.primary).toBeDefined();
		expect(themeLight.secondary).toBeDefined();
		expect(themeLight.accent).toBeDefined();
		expect(themeLight.highlight).toBeDefined();
	});

	it('exports neutral colors', () => {
		expect(themeLight.text).toBeDefined();
		expect(themeLight.textMuted).toBeDefined();
		expect(themeLight.border).toBeDefined();
		expect(themeLight.background).toBeDefined();
	});

	it('all colors are valid hex codes', () => {
		Object.values(themeLight).forEach((color) => {
			expect(color).toMatch(hexPattern);
		});
	});
});

describe('THEMES.themeDark', () => {
	const themeDark = THEMES.themeDark;

	it('all colors are valid hex codes', () => {
		Object.values(themeDark).forEach((color) => {
			expect(color).toMatch(hexPattern);
		});
	});

	it('is a genuinely dark variant on chasm', () => {
		expect(themeDark.background).toBe(PALETTE.dark.colour);
		// Light/dark must not share a background, and text must be light on dark.
		expect(themeDark.background).not.toBe(THEMES.themeLight.background);
		expect(themeDark.text).toBe(PALETTE.background.main.main);
	});

	it('exports the same token set as themeLight', () => {
		expect(Object.keys(themeDark).sort()).toEqual(Object.keys(THEMES.themeLight).sort());
	});
});

describe('symbols', () => {
	it('exports info symbols', () => {
		expect(symbols.info.success).toBe('✓');
		expect(symbols.info.error).toBe('✗');
		expect(symbols.info.warning).toBe('(!)'); // swapped from ⚠ — degrades to 'Ar ' in some terminals
		expect(symbols.info.required).toBe('*');  // swapped from ⚡︎ — multi-codepoint, width-ambiguous
	});

	it('exports bullet, loading and progress symbols', () => {
		expect(symbols.bullet.dot).toBe('•');
		expect(symbols.status.loading).toBe('⋯');
		expect(symbols.progress.filled).toBe('█');
		expect(symbols.progress.empty).toBe('░');
	});

	it('exports all four arrow directions (none empty)', () => {
		expect(symbols.arrows.up).toBe('↑');
		expect(symbols.arrows.down).toBe('↓');
		expect(symbols.arrows.left).toBe('←');
		expect(symbols.arrows.right).toBe('→');
		Object.values(symbols.arrows).forEach((arrow) => {
			expect(arrow.length).toBeGreaterThan(0);
		});
	});
});

describe('borders', () => {
	it('exports heavy border characters', () => {
		expect(borders.heavy.topLeft).toBe('┏');
		expect(borders.heavy.topRight).toBe('┓');
		expect(borders.heavy.bottomLeft).toBe('┗');
		expect(borders.heavy.bottomRight).toBe('┛');
		expect(borders.heavy.horizontal).toBe('━');
		expect(borders.heavy.vertical).toBe('┃');
	});

	it('exports light border characters', () => {
		expect(borders.light.topLeft).toBe('┌');
		expect(borders.light.topRight).toBe('┐');
		expect(borders.light.bottomLeft).toBe('└');
		expect(borders.light.bottomRight).toBe('┘');
		expect(borders.light.horizontal).toBe('─');
		expect(borders.light.vertical).toBe('│');
	});
});

describe('spinners', () => {
	it('exports dots spinner with 10 frames', () => {
		expect(spinners.dots.spinR).toHaveLength(10);
		expect(spinners.dots.spinR[0]).toBe('⠋');
	});

	it('exports arrow spinner with 8 frames', () => {
		expect(spinners.arrow.spinR).toHaveLength(8);
		expect(spinners.arrow.spinR[0]).toBe('←');
	});
});

describe('rgba (OpenTUI adapter)', () => {
	it('exports RGBA objects for all theme colours', () => {
		Object.values(rgba).forEach((colour) => {
			expect(colour).toBeInstanceOf(RGBA);
		});
	});

	it('rgba values match hex theme values', () => {
		expect(rgba.primary).toEqual(RGBA.fromHex(theme.primary));
		expect(rgba.background).toEqual(RGBA.fromHex(theme.background));
		expect(rgba.success).toEqual(RGBA.fromHex(theme.success));
		expect(rgba.successAccent).toEqual(RGBA.fromHex(theme.successAccent));
	});
});

describe('theme convenience export', () => {
	it('is themeLight', () => {
		expect(theme).toBe(THEMES.themeLight);
	});
});

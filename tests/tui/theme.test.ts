import { describe, it, expect } from 'vitest';
import { THEMES, symbols, borders, spinners, rgba, theme } from '../../brand/theme';
import { RGBA } from '@opentui/core';

describe('THEMES.themeLight', () => {
	const themeLight = THEMES.themeLight;

	it('exports status colors', () => {
		expect(themeLight.success).toBeDefined();
		expect(themeLight.warning).toBeDefined();
		expect(themeLight.error).toBeDefined();
		expect(themeLight.info).toBeDefined();
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
		const hexPattern = /^#[0-9a-f]{6}$/i;
		Object.values(themeLight).forEach((color) => {
			expect(color).toMatch(hexPattern);
		});
	});
});

describe('symbols', () => {
	it('exports all required symbols', () => {
		expect(symbols.success).toBe('✓');
		expect(symbols.error).toBe('✗');
		expect(symbols.warning).toBe('⚠');
		expect(symbols.arrow).toBe('→');
		expect(symbols.bullet).toBe('•');
		expect(symbols.loading).toBe('⋯');
		expect(symbols.progressFilled).toBe('█');
		expect(symbols.progressEmpty).toBe('░');
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
		expect(spinners.dots).toHaveLength(10);
		expect(spinners.dots[0]).toBe('⠋');
	});

	it('exports arrow spinner with 8 frames', () => {
		expect(spinners.arrow).toHaveLength(8);
		expect(spinners.arrow[0]).toBe('←');
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
	});
});

describe('theme convenience export', () => {
	it('is themeLight', () => {
		expect(theme).toBe(THEMES.themeLight);
	});
});

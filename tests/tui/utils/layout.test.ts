import { describe, it, expect } from 'vitest';
import { spacing, space, APP_VERSION, header } from '../../../src/tui/utils/layout';
import packageJson from '../../../package.json';

describe('spacing', () => {
	it('pins every step to the expected cell count', () => {
		expect(spacing.none).toBe(0);
		expect(spacing.xs).toBe(1);
		expect(spacing.sm).toBe(2);
		expect(spacing.md).toBe(3);
		expect(spacing.lg).toBe(4);
		expect(spacing.xl).toBe(6);
	});

	it('has strictly increasing values', () => {
		const values = Object.values(spacing);
		for (let i = 1; i < values.length; i++) {
			expect(values[i]).toBeGreaterThan(values[i - 1]);
		}
	});

	it('has distinct values (no collisions)', () => {
		const values = Object.values(spacing);
		expect(new Set(values).size).toBe(values.length);
	});
});

describe('space()', () => {
	it('resolves named steps', () => {
		expect(space('none')).toBe(0);
		expect(space('xs')).toBe(1);
		expect(space('sm')).toBe(2);
		expect(space('md')).toBe(3);
		expect(space('lg')).toBe(4);
		expect(space('xl')).toBe(6);
	});

	it('passes raw numbers through unchanged', () => {
		expect(space(0)).toBe(0);
		expect(space(5)).toBe(5);
		expect(space(42)).toBe(42);
	});
});

describe('APP_VERSION', () => {
	it('matches package.json version', () => {
		expect(APP_VERSION).toBe(packageJson.version);
	});

	it('looks like a semver string', () => {
		expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
	});
});

describe('header()', () => {
	it('includes the version prefixed with v', () => {
		expect(header()).toContain(`v${APP_VERSION}`);
	});

	it('defaults the title to Iris', () => {
		expect(header()).toContain('Iris');
	});

	it('accepts a custom title', () => {
		const result = header('Theia');
		expect(result).toContain('Theia');
		expect(result).toContain(`v${APP_VERSION}`);
	});
});

import { describe, it, expect } from 'vitest';
import { fuzzyMatch, fuzzyFilter } from '../../../src/tui/utils/fuzzy';
import { paletteScreenNames } from '../../fixtures/tui/palette';

describe('fuzzyMatch', () => {
	it('matches an exact string', () => {
		expect(fuzzyMatch('settings', 'settings')).not.toBeNull();
	});

	it('matches a subsequence of characters in order', () => {
		expect(fuzzyMatch('stg', 'settings')).not.toBeNull();
	});

	it('is case-insensitive', () => {
		expect(fuzzyMatch('SET', 'settings')).not.toBeNull();
		expect(fuzzyMatch('set', 'SETTINGS')).not.toBeNull();
	});

	it('returns null when characters are out of order', () => {
		expect(fuzzyMatch('gts', 'settings')).toBeNull();
	});

	it('returns null when a character is missing entirely', () => {
		expect(fuzzyMatch('xyz', 'settings')).toBeNull();
	});

	it('returns 0 for an empty query against any target', () => {
		expect(fuzzyMatch('', 'settings')).toBe(0);
		expect(fuzzyMatch('', '')).toBe(0);
	});

	it('scores a consecutive run higher than the same characters scattered', () => {
		const consecutive = fuzzyMatch('map', 'mapping-builder');
		const scattered = fuzzyMatch('mpr', 'mapping-builder'); // m...p...r, non-consecutive
		expect(consecutive).not.toBeNull();
		expect(scattered).not.toBeNull();
		expect(consecutive!).toBeGreaterThan(scattered!);
	});

	it('scores a word-boundary match higher than a mid-word match of equal length', () => {
		// 'h' at the start of 'history' (boundary) vs 'h' as the 4th char of 'dashboard' (mid-word)
		const boundary = fuzzyMatch('h', 'history');
		const midWord = fuzzyMatch('h', 'dashboard');
		expect(boundary).not.toBeNull();
		expect(midWord).not.toBeNull();
		expect(boundary!).toBeGreaterThan(midWord!);
	});

	it('scores an earlier match higher than a later match, all else equal', () => {
		const early = fuzzyMatch('a', 'about');
		const late = fuzzyMatch('a', 'mapping-save');
		expect(early).not.toBeNull();
		expect(late).not.toBeNull();
		expect(early!).toBeGreaterThan(late!);
	});
});

describe('fuzzyFilter', () => {
	// Mirrors the real palette's jump-target list (see fixtures/tui/palette.ts)
	// rather than an arbitrary sample, so these tests exercise fuzzyFilter
	// against the same data the command palette actually filters.
	const items = [...paletteScreenNames];

	it('returns all items in original order for an empty query', () => {
		expect(fuzzyFilter('', items, (s) => s)).toEqual(items);
	});

	it('drops non-matching items', () => {
		const result = fuzzyFilter('xyz', items, (s) => s);
		expect(result).toEqual([]);
	});

	it('filters to only matching items', () => {
		const result = fuzzyFilter('map', items, (s) => s);
		expect(result).toEqual(expect.arrayContaining(['mapping-builder', 'mapping-editor']));
		expect(result).not.toContain('dashboard');
	});

	it('ranks a tighter/earlier match before a looser/later one', () => {
		const result = fuzzyFilter('set', items, (s) => s);
		expect(result[0]).toBe('settings');
	});

	it('ranks the full result order, not just the top match', () => {
		// Both entries match 'map' as a consecutive run at the start, so the
		// comparator has to resolve the tie past index 0; asserting only
		// result[0] wouldn't catch a regression that scrambled the rest of
		// the order (e.g. a broken sort comparator returning 0 for everything).
		const result = fuzzyFilter('map', items, (s) => s);
		expect(result).toEqual(['mapping-builder', 'mapping-editor']);
	});

	it('works over objects via the key selector', () => {
		const entries = items.map((name) => ({ name, extra: 'noise' }));
		const result = fuzzyFilter('hist', entries, (e) => e.name);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('history');
	});
});

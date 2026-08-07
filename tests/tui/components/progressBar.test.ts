import { describe, it, expect, beforeEach, vi } from 'vitest';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

import { progressBar } from '../../../src/tui/components/progressBar';
import { theme, symbols } from '../../../assets/brand/theme';
import { RGBA } from '../../fixtures/tui/opentui';
import * as fixtures from '../../fixtures/tui/tui';

/** Flattens a mock renderable's StyledText/plain content into a string. */
function textOf(node: { content: { chunks: { text: string }[] } | string }): string {
	if (typeof node.content === 'string') return node.content;
	return node.content.chunks.map((chunk) => chunk.text).join('');
}

function barSegments(bar: ReturnType<typeof progressBar>) {
	const [barContainer, statusText] = bar.root.getChildren() as any[];
	const [filledText, emptyText, percentText] = barContainer.getChildren();
	return { filledText, emptyText, percentText, statusText };
}

describe('progressBar()', () => {
	let ctx: ReturnType<typeof fixtures.createMockContext>;

	beforeEach(() => {
		ctx = fixtures.createMockContext();
	});

	it('returns a BoxRenderable root', () => {
		const bar = progressBar(ctx.renderer, { width: 10 });
		expect(bar.root.constructor.name).toBe('BoxRenderable');
	});

	it('at value 0, the bar is all empty', () => {
		const bar = progressBar(ctx.renderer, { width: 10, value: 0 });
		const { filledText, emptyText } = barSegments(bar);
		expect(textOf(filledText)).toBe('');
		expect(textOf(emptyText)).toBe(symbols.progress.empty.repeat(10));
	});

	it('at value 1, the bar is all filled, with no RangeError', () => {
		expect(() => progressBar(ctx.renderer, { width: 10, value: 1 })).not.toThrow();
		const bar = progressBar(ctx.renderer, { width: 10, value: 1 });
		const { filledText, emptyText } = barSegments(bar);
		expect(textOf(filledText)).toBe(symbols.progress.filled.repeat(10));
		expect(textOf(emptyText)).toBe('');
	});

	it('at value 0.5, splits evenly at width 10', () => {
		const bar = progressBar(ctx.renderer, { width: 10, value: 0.5 });
		const { filledText, emptyText } = barSegments(bar);
		expect(textOf(filledText)).toBe(symbols.progress.filled.repeat(5));
		expect(textOf(emptyText)).toBe(symbols.progress.empty.repeat(5));
	});

	it('setValue(0.48) at width 25 rounds to 12 filled cells', () => {
		const bar = progressBar(ctx.renderer, { width: 25 });
		bar.setValue(0.48);
		const { filledText } = barSegments(bar);
		expect(textOf(filledText)).toBe(symbols.progress.filled.repeat(12));
	});

	it('shows a rounded percent readout', () => {
		const bar = progressBar(ctx.renderer, { width: 25 });
		bar.setValue(0.48);
		expect(textOf(barSegments(bar).percentText)).toBe('  48%');
		bar.setValue(1);
		expect(textOf(barSegments(bar).percentText)).toBe('  100%');
	});

	it('hides the percent readout when showPercent is false', () => {
		const bar = progressBar(ctx.renderer, { width: 10, value: 0.5, showPercent: false });
		expect(textOf(barSegments(bar).percentText)).toBe('');
	});

	describe('clamping', () => {
		it('setValue(-1) clamps to 0', () => {
			const bar = progressBar(ctx.renderer, { width: 10 });
			bar.setValue(-1);
			expect(bar.getValue()).toBe(0);
			expect(textOf(barSegments(bar).filledText)).toBe('');
		});

		it('setValue(2) clamps to 1', () => {
			const bar = progressBar(ctx.renderer, { width: 10 });
			bar.setValue(2);
			expect(bar.getValue()).toBe(1);
			expect(textOf(barSegments(bar).filledText)).toBe(symbols.progress.filled.repeat(10));
		});

		it('setValue(NaN) clamps to 0 without crashing', () => {
			const bar = progressBar(ctx.renderer, { width: 10 });
			expect(() => bar.setValue(NaN)).not.toThrow();
			expect(bar.getValue()).toBe(0);
		});
	});

	it('setStatus() replaces rather than appends', () => {
		const bar = progressBar(ctx.renderer, { width: 10 });
		bar.setStatus('elapsed 0:01');
		bar.setStatus('elapsed 0:07');
		expect(textOf(barSegments(bar).statusText)).toBe('elapsed 0:07');
	});

	it('setFillColor() recolours the filled segment and percent text', () => {
		const bar = progressBar(ctx.renderer, { width: 10, value: 0.5 });
		bar.setFillColor(theme.errorAccent);
		const { filledText, percentText } = barSegments(bar);
		expect((filledText as any).fg.equals(RGBA.fromHex(theme.errorAccent))).toBe(true);
		expect((percentText as any).fg.equals(RGBA.fromHex(theme.errorAccent))).toBe(true);
	});

	it('defaults the filled colour to theme.successAccent and empty to theme.border', () => {
		const bar = progressBar(ctx.renderer, { width: 10, value: 0.5 });
		const { filledText, emptyText } = barSegments(bar);
		expect((filledText as any).fg.equals(RGBA.fromHex(theme.successAccent))).toBe(true);
		expect((emptyText as any).fg.equals(RGBA.fromHex(theme.border))).toBe(true);
	});

	it('uses symbols.progress glyphs, not hardcoded characters', () => {
		const bar = progressBar(ctx.renderer, { width: 4, value: 0.5 });
		const { filledText, emptyText } = barSegments(bar);
		expect(textOf(filledText)).toBe(symbols.progress.filled.repeat(2));
		expect(textOf(emptyText)).toBe(symbols.progress.empty.repeat(2));
	});

	it('falls back to the default width when root.width is non-numeric (pre-layout)', () => {
		// No explicit `width` option — under the test double root.width is
		// whatever was passed to the BoxRenderable constructor ('100%', a
		// string), mirroring the real pre-layout-pass state.
		const bar = progressBar(ctx.renderer, { value: 1 });
		const { filledText } = barSegments(bar);
		expect(textOf(filledText).length).toBe(26); // DEFAULT_BAR_WIDTH
	});
});

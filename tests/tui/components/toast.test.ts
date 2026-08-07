import { describe, it, expect, beforeEach, vi } from 'vitest';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

import { toast } from '../../../src/tui/components/toast';
import { theme, symbols } from '../../../assets/brand/theme';
import { RGBA } from '../../fixtures/tui/opentui';
import * as fixtures from '../../fixtures/tui/tui';

/** Flattens a mock renderable's StyledText/plain content into a string. */
function textOf(node: { content: { chunks: { text: string }[] } | string }): string {
	if (typeof node.content === 'string') return node.content;
	return node.content.chunks.map((chunk) => chunk.text).join('');
}

describe('toast()', () => {
	let ctx: ReturnType<typeof fixtures.createMockContext>;

	beforeEach(() => {
		ctx = fixtures.createMockContext();
	});

	it('returns a BoxRenderable root', () => {
		const t = toast(ctx.renderer, { message: 'Saved' });
		expect(t.root.constructor.name).toBe('BoxRenderable');
	});

	it('honours a custom id', () => {
		const t = toast(ctx.renderer, { id: 'custom-toast', message: 'Saved' });
		expect(t.root.id).toBe('custom-toast');
	});

	it('generates an id when omitted', () => {
		const t = toast(ctx.renderer, { message: 'Saved' });
		expect(t.root.id).toBeTruthy();
	});

	it('is content-sized, not full-screen', () => {
		const t = toast(ctx.renderer, { message: 'Saved' });
		expect(t.root.width).toBeUndefined();
		expect(t.root.height).toBeUndefined();
		expect(t.root.position).toBeUndefined();
	});

	it('the card is opaque so it stays readable over screen content', () => {
		const t = toast(ctx.renderer, { message: 'Saved' });
		expect((t.root as any).backgroundColor.equals(RGBA.fromHex(theme.background))).toBe(true);
	});

	it('defaults to the info variant', () => {
		const t = toast(ctx.renderer, { message: 'Saved' });
		expect(t.variant).toBe('info');
	});

	it.each([
		['success', theme.successAccent, symbols.info.success],
		['info', theme.infoAccent, symbols.bullet.dot],
		['warning', theme.warningAccent, symbols.info.warning],
		['error', theme.errorAccent, symbols.info.error],
	] as const)('%s variant uses the matching accent border and glyph', (variant, accent, glyph) => {
		const t = toast(ctx.renderer, { message: 'Body', variant });
		expect((t.root as any).borderColor.equals(RGBA.fromHex(accent))).toBe(true);
		expect(textOf(t.root.getChildren()[0] as any)).toContain(glyph);
	});

	it('renders the message', () => {
		const t = toast(ctx.renderer, { message: 'Conversion complete' });
		expect(textOf(t.root.getChildren()[0] as any)).toContain('Conversion complete');
	});

	it('setMessage() replaces the previous message', () => {
		const t = toast(ctx.renderer, { message: 'First' });
		t.setMessage('Second');
		const text = textOf(t.root.getChildren()[0] as any);
		expect(text).toContain('Second');
		expect(text).not.toContain('First');
	});
});

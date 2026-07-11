import { describe, it, expect, beforeEach, vi } from 'vitest';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

import { confirmOverlay } from '../../../src/tui/components/confirmOverlay';
import * as fixtures from '../../fixtures/tui/tui';

/** Flattens a mock renderable's StyledText/plain content into a string. */
function textOf(node: { content: { chunks: { text: string }[] } | string }): string {
	if (typeof node.content === 'string') return node.content;
	return node.content.chunks.map((chunk) => chunk.text).join('');
}

describe('confirmOverlay()', () => {
	let ctx: ReturnType<typeof fixtures.createMockContext>;

	beforeEach(() => {
		ctx = fixtures.createMockContext();
	});

	it('returns a BoxRenderable root', () => {
		const overlay = confirmOverlay(ctx.renderer);
		expect(overlay.root.constructor.name).toBe('BoxRenderable');
	});

	it('defaults to the shared confirm overlay id', () => {
		const overlay = confirmOverlay(ctx.renderer);
		expect(overlay.root.id).toBe('confirm-overlay-root');
	});

	it('honours a custom id', () => {
		const overlay = confirmOverlay(ctx.renderer, { id: 'custom-confirm' });
		expect(overlay.root.id).toBe('custom-confirm');
	});

	it('is absolutely positioned, full-screen, and hidden by default', () => {
		const overlay = confirmOverlay(ctx.renderer);
		expect(overlay.root.position).toBe('absolute');
		expect(overlay.root.width).toBe('100%');
		expect(overlay.root.height).toBe('100%');
		expect(overlay.root.visible).toBe(false);
		expect(overlay.isVisible()).toBe(false);
	});

	it('defaults zIndex to 100 so it paints above screen roots', () => {
		const overlay = confirmOverlay(ctx.renderer);
		expect(overlay.root.zIndex).toBe(100);
	});

	it('honours a custom zIndex', () => {
		const overlay = confirmOverlay(ctx.renderer, { zIndex: 250 });
		expect(overlay.root.zIndex).toBe(250);
	});

	it('setVisible(true) shows the overlay; isVisible() reflects it', () => {
		const overlay = confirmOverlay(ctx.renderer);
		overlay.setVisible(true);
		expect(overlay.root.visible).toBe(true);
		expect(overlay.isVisible()).toBe(true);
	});

	it('setVisible(false) hides the overlay again', () => {
		const overlay = confirmOverlay(ctx.renderer);
		overlay.setVisible(true);
		overlay.setVisible(false);
		expect(overlay.isVisible()).toBe(false);
	});

	it('titles the card "Confirm" by default', () => {
		const overlay = confirmOverlay(ctx.renderer);
		const card = overlay.root.getChildren()[0] as any;
		expect(card.title).toBe('Confirm');
	});

	it('honours a custom title', () => {
		const overlay = confirmOverlay(ctx.renderer, { title: 'Delete?' });
		const card = overlay.root.getChildren()[0] as any;
		expect(card.title).toBe('Delete?');
	});

	it('shows the "[y]es / [n]o" footer hint', () => {
		const overlay = confirmOverlay(ctx.renderer);
		const card = overlay.root.getChildren()[0] as any;
		const cardChildren = card.getChildren();
		const footer = cardChildren[cardChildren.length - 1];
		expect(textOf(footer)).toBe('[y]es / [n]o');
	});

	it('setMessage() updates the body text', () => {
		const overlay = confirmOverlay(ctx.renderer);
		overlay.setMessage('Delete this history entry?');

		const card = overlay.root.getChildren()[0] as any;
		const message = card.getChildren()[0];
		expect(textOf(message)).toBe('Delete this history entry?');
	});

	it('setMessage() called again replaces the previous message', () => {
		const overlay = confirmOverlay(ctx.renderer);
		overlay.setMessage('First message');
		overlay.setMessage('Second message');

		const card = overlay.root.getChildren()[0] as any;
		const message = card.getChildren()[0];
		expect(textOf(message)).toBe('Second message');
	});
});

import { describe, it, expect, beforeEach, vi } from 'vitest';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

import { helpOverlay } from '../../../src/tui/components/helpOverlay';
import * as fixtures from '../../fixtures/tui/tui';

/** Flattens a mock renderable's StyledText chunks into a plain string. */
function textOf(node: { content: { chunks: { text: string }[] } }): string {
	return node.content.chunks.map((chunk) => chunk.text).join('');
}

describe('helpOverlay()', () => {
	let ctx: ReturnType<typeof fixtures.createMockContext>;

	beforeEach(() => {
		ctx = fixtures.createMockContext();
	});

	it('returns a BoxRenderable root', () => {
		const overlay = helpOverlay(ctx.renderer);
		expect(overlay.root.constructor.name).toBe('BoxRenderable');
	});

	it('defaults to the shared help overlay id', () => {
		const overlay = helpOverlay(ctx.renderer);
		expect(overlay.root.id).toBe('help-overlay-root');
	});

	it('honours a custom id', () => {
		const overlay = helpOverlay(ctx.renderer, { id: 'custom-help' });
		expect(overlay.root.id).toBe('custom-help');
	});

	it('is absolutely positioned, full-screen, and hidden by default', () => {
		const overlay = helpOverlay(ctx.renderer);
		expect(overlay.root.position).toBe('absolute');
		expect(overlay.root.width).toBe('100%');
		expect(overlay.root.height).toBe('100%');
		expect(overlay.root.visible).toBe(false);
		expect(overlay.isVisible()).toBe(false);
	});

	it('defaults zIndex to 100 so it paints above screen roots', () => {
		const overlay = helpOverlay(ctx.renderer);
		expect(overlay.root.zIndex).toBe(100);
	});

	it('honours a custom zIndex', () => {
		const overlay = helpOverlay(ctx.renderer, { zIndex: 250 });
		expect(overlay.root.zIndex).toBe(250);
	});

	it('setVisible(true) shows the overlay; isVisible() reflects it', () => {
		const overlay = helpOverlay(ctx.renderer);
		overlay.setVisible(true);
		expect(overlay.root.visible).toBe(true);
		expect(overlay.isVisible()).toBe(true);
	});

	it('setVisible(false) hides the overlay again', () => {
		const overlay = helpOverlay(ctx.renderer);
		overlay.setVisible(true);
		overlay.setVisible(false);
		expect(overlay.isVisible()).toBe(false);
	});

	it('titles the card "Keyboard Shortcuts" by default', () => {
		const overlay = helpOverlay(ctx.renderer);
		const card = overlay.root.getChildren()[0] as any;
		expect(card.title).toBe('Keyboard Shortcuts');
	});

	it('honours a custom title', () => {
		const overlay = helpOverlay(ctx.renderer, { title: 'Shortcuts' });
		const card = overlay.root.getChildren()[0] as any;
		expect(card.title).toBe('Shortcuts');
	});

	it('shows the "? or ESC to close" footer hint', () => {
		const overlay = helpOverlay(ctx.renderer);
		const card = overlay.root.getChildren()[0] as any;
		const cardChildren = card.getChildren();
		const footer = cardChildren[cardChildren.length - 1];
		expect(textOf(footer)).toBe('? or ESC to close');
	});

	it('setRows() renders one row per entry, containing the keys and label', () => {
		const overlay = helpOverlay(ctx.renderer);
		overlay.setRows([
			{ keys: '↑↓', label: 'Navigate' },
			{ keys: 'ENTER', label: 'Confirm' },
		]);

		const card = overlay.root.getChildren()[0] as any;
		const rowsBox = card.getChildren()[0];
		const rows = rowsBox.getChildren();

		expect(rows).toHaveLength(2);
		expect(textOf(rows[0])).toContain('↑↓');
		expect(textOf(rows[0])).toContain('Navigate');
		expect(textOf(rows[1])).toContain('ENTER');
		expect(textOf(rows[1])).toContain('Confirm');
	});

	it('setRows() called again replaces rows rather than accumulating them', () => {
		const overlay = helpOverlay(ctx.renderer);
		overlay.setRows([{ keys: 'q', label: 'Quit' }]);
		overlay.setRows([{ keys: 'ESC', label: 'Back' }]);

		const card = overlay.root.getChildren()[0] as any;
		const rowsBox = card.getChildren()[0];
		const rows = rowsBox.getChildren();

		expect(rows).toHaveLength(1);
		expect(textOf(rows[0])).toContain('Back');
	});

	it('setRows() with an empty list clears any prior rows', () => {
		const overlay = helpOverlay(ctx.renderer);
		overlay.setRows([{ keys: 'q', label: 'Quit' }]);
		overlay.setRows([]);

		const card = overlay.root.getChildren()[0] as any;
		const rowsBox = card.getChildren()[0];
		expect(rowsBox.getChildren()).toHaveLength(0);
	});
});

import { describe, it, expect, beforeEach, vi } from 'vitest';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

import { commandPalette } from '../../../src/tui/components/commandPalette';
import * as fixtures from '../../fixtures/tui/tui';

/** Flattens a mock renderable's StyledText chunks into a plain string. */
function textOf(node: { content: { chunks: { text: string }[] } }): string {
	return node.content.chunks.map((chunk) => chunk.text).join('');
}

describe('commandPalette()', () => {
	let ctx: ReturnType<typeof fixtures.createMockContext>;

	beforeEach(() => {
		ctx = fixtures.createMockContext();
	});

	it('returns a BoxRenderable root', () => {
		const palette = commandPalette(ctx.renderer);
		expect(palette.root.constructor.name).toBe('BoxRenderable');
	});

	it('defaults to the shared command palette id', () => {
		const palette = commandPalette(ctx.renderer);
		expect(palette.root.id).toBe('command-palette-root');
	});

	it('honours a custom id', () => {
		const palette = commandPalette(ctx.renderer, { id: 'custom-palette' });
		expect(palette.root.id).toBe('custom-palette');
	});

	it('is absolutely positioned, full-screen, and hidden by default', () => {
		const palette = commandPalette(ctx.renderer);
		expect(palette.root.position).toBe('absolute');
		expect(palette.root.width).toBe('100%');
		expect(palette.root.height).toBe('100%');
		expect(palette.root.visible).toBe(false);
		expect(palette.isVisible()).toBe(false);
	});

	it('defaults zIndex to 100 so it paints above screen roots', () => {
		const palette = commandPalette(ctx.renderer);
		expect(palette.root.zIndex).toBe(100);
	});

	it('honours a custom zIndex', () => {
		const palette = commandPalette(ctx.renderer, { zIndex: 250 });
		expect(palette.root.zIndex).toBe(250);
	});

	it('setVisible(true) shows the overlay; isVisible() reflects it', () => {
		const palette = commandPalette(ctx.renderer);
		palette.setVisible(true);
		expect(palette.root.visible).toBe(true);
		expect(palette.isVisible()).toBe(true);
	});

	it('setVisible(false) hides the overlay again', () => {
		const palette = commandPalette(ctx.renderer);
		palette.setVisible(true);
		palette.setVisible(false);
		expect(palette.isVisible()).toBe(false);
	});

	it('titles the card "Command Palette" by default', () => {
		const palette = commandPalette(ctx.renderer);
		const card = palette.root.getChildren()[0] as any;
		expect(card.title).toBe('Command Palette');
	});

	it('honours a custom title', () => {
		const palette = commandPalette(ctx.renderer, { title: 'Jump to…' });
		const card = palette.root.getChildren()[0] as any;
		expect(card.title).toBe('Jump to…');
	});

	it('shows the query hint footer', () => {
		const palette = commandPalette(ctx.renderer);
		const card = palette.root.getChildren()[0] as any;
		const cardChildren = card.getChildren();
		const footer = cardChildren[cardChildren.length - 1];
		expect(textOf(footer)).toContain('ESC');
	});

	it('setQuery() updates the displayed query line', () => {
		const palette = commandPalette(ctx.renderer);
		const card = palette.root.getChildren()[0] as any;
		const queryLine = card.getChildren()[0];

		palette.setQuery('map');
		expect(textOf(queryLine)).toContain('map');
	});

	it('setEntries() renders one row per entry, containing the label', () => {
		const palette = commandPalette(ctx.renderer);
		palette.setEntries([
			{ screen: 'mapping-builder', label: 'Mapping Builder' },
			{ screen: 'mapping-editor', label: 'Mapping Editor' },
		]);

		const card = palette.root.getChildren()[0] as any;
		const resultsBox = card.getChildren()[2];
		const rows = resultsBox.getChildren();

		expect(rows).toHaveLength(2);
		expect(textOf(rows[0])).toContain('Mapping Builder');
		expect(textOf(rows[1])).toContain('Mapping Editor');
	});

	it('setEntries() called again replaces rows rather than accumulating them', () => {
		const palette = commandPalette(ctx.renderer);
		palette.setEntries([{ screen: 'settings', label: 'Settings' }]);
		palette.setEntries([{ screen: 'history', label: 'History' }]);

		const card = palette.root.getChildren()[0] as any;
		const resultsBox = card.getChildren()[2];
		const rows = resultsBox.getChildren();

		expect(rows).toHaveLength(1);
		expect(textOf(rows[0])).toContain('History');
	});

	it('setEntries() with an empty list shows the no-matches hint', () => {
		const palette = commandPalette(ctx.renderer);
		palette.setEntries([{ screen: 'settings', label: 'Settings' }]);
		palette.setEntries([]);

		const card = palette.root.getChildren()[0] as any;
		const resultsBox = card.getChildren()[2];
		const rows = resultsBox.getChildren();

		expect(rows).toHaveLength(1);
		expect(textOf(rows[0])).toContain('No matching screens');
	});

	it('setEntries() resets selection to the first entry', () => {
		const palette = commandPalette(ctx.renderer);
		palette.setEntries([
			{ screen: 'a', label: 'A' },
			{ screen: 'b', label: 'B' },
		]);
		palette.moveSelection(1);
		expect(palette.getSelected()?.screen).toBe('b');

		palette.setEntries([
			{ screen: 'c', label: 'C' },
			{ screen: 'd', label: 'D' },
		]);
		expect(palette.getSelected()?.screen).toBe('c');
	});

	it('getSelected() returns null when there are no entries', () => {
		const palette = commandPalette(ctx.renderer);
		palette.setEntries([]);
		expect(palette.getSelected()).toBeNull();
	});

	it('moveSelection() moves the selection within bounds', () => {
		const palette = commandPalette(ctx.renderer);
		palette.setEntries([
			{ screen: 'a', label: 'A' },
			{ screen: 'b', label: 'B' },
			{ screen: 'c', label: 'C' },
		]);

		palette.moveSelection(1);
		expect(palette.getSelected()?.screen).toBe('b');

		palette.moveSelection(1);
		expect(palette.getSelected()?.screen).toBe('c');
	});

	it('moveSelection() clamps at the bottom of the list', () => {
		const palette = commandPalette(ctx.renderer);
		palette.setEntries([
			{ screen: 'a', label: 'A' },
			{ screen: 'b', label: 'B' },
		]);

		palette.moveSelection(5);
		expect(palette.getSelected()?.screen).toBe('b');
	});

	it('moveSelection() clamps at the top of the list', () => {
		const palette = commandPalette(ctx.renderer);
		palette.setEntries([
			{ screen: 'a', label: 'A' },
			{ screen: 'b', label: 'B' },
		]);

		palette.moveSelection(-5);
		expect(palette.getSelected()?.screen).toBe('a');
	});

	it('moveSelection() on an empty list is a no-op', () => {
		const palette = commandPalette(ctx.renderer);
		palette.setEntries([]);
		expect(() => palette.moveSelection(1)).not.toThrow();
		expect(palette.getSelected()).toBeNull();
	});

	it('moveSelection() marks the newly selected row and unmarks the previous one', () => {
		const palette = commandPalette(ctx.renderer);
		palette.setEntries([
			{ screen: 'a', label: 'A' },
			{ screen: 'b', label: 'B' },
		]);

		const card = palette.root.getChildren()[0] as any;
		const resultsBox = card.getChildren()[2];
		const rows = resultsBox.getChildren();

		expect(textOf(rows[0])).toContain('›');
		expect(textOf(rows[1])).not.toContain('›');

		palette.moveSelection(1);

		expect(textOf(rows[0])).not.toContain('›');
		expect(textOf(rows[1])).toContain('›');
	});

	it('moveSelection() reuses the row renderables rather than recreating them', () => {
		const palette = commandPalette(ctx.renderer);
		palette.setEntries([
			{ screen: 'a', label: 'A' },
			{ screen: 'b', label: 'B' },
		]);

		const card = palette.root.getChildren()[0] as any;
		const resultsBox = card.getChildren()[2];
		const rowBefore = resultsBox.getChildren()[0];

		palette.moveSelection(1);

		const rowAfter = resultsBox.getChildren()[0];
		expect(rowAfter).toBe(rowBefore);
	});

	it('moveSelection() clamped at a bound leaves the marker unchanged', () => {
		const palette = commandPalette(ctx.renderer);
		palette.setEntries([
			{ screen: 'a', label: 'A' },
			{ screen: 'b', label: 'B' },
		]);

		const card = palette.root.getChildren()[0] as any;
		const resultsBox = card.getChildren()[2];
		const rows = resultsBox.getChildren();

		palette.moveSelection(-5); // already clamped to index 0

		expect(textOf(rows[0])).toContain('›');
		expect(textOf(rows[1])).not.toContain('›');
	});
});

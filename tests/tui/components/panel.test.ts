import { describe, it, expect, beforeEach, vi } from 'vitest';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

import { RGBA } from '@opentui/core';
import { panel } from '../../../src/tui/components/panel';
import { theme } from '../../../assets/brand/theme';
import * as fixtures from '../../fixtures/tui/tui';

describe('panel()', () => {
	let ctx: ReturnType<typeof fixtures.createMockContext>;

	beforeEach(() => {
		ctx = fixtures.createMockContext();
	});

	it('returns a BoxRenderable as the underlying box', () => {
		const p = panel(ctx.renderer);
		expect(p.box.constructor.name).toBe('BoxRenderable');
	});

	it('has border enabled', () => {
		const p = panel(ctx.renderer);
		expect(p.box.border).toBe(true);
	});

	it('defaults to unfocused border colour (theme.border)', () => {
		const p = panel(ctx.renderer);
		expect(p.box.borderColor.equals(RGBA.fromHex(theme.border))).toBe(true);
	});

	it('uses theme.accent border when focused: true is passed', () => {
		const p = panel(ctx.renderer, { focused: true });
		expect(p.box.borderColor.equals(RGBA.fromHex(theme.accent))).toBe(true);
	});

	it('setFocused(true) switches border to theme.accent', () => {
		const p = panel(ctx.renderer);
		p.setFocused(true);
		expect(p.box.borderColor.equals(RGBA.fromHex(theme.accent))).toBe(true);
	});

	it('setFocused(false) restores border to theme.border', () => {
		const p = panel(ctx.renderer, { focused: true });
		p.setFocused(false);
		expect(p.box.borderColor.equals(RGBA.fromHex(theme.border))).toBe(true);
	});

	it('sets the title when provided', () => {
		const p = panel(ctx.renderer, { title: 'My Panel' });
		expect(p.box.title).toBe('My Panel');
	});

	it('setTitle() updates the title in place', () => {
		const p = panel(ctx.renderer, { title: 'Original' });
		p.setTitle('Updated');
		expect(p.box.title).toBe('Updated');
	});

	it('add() is a function that delegates to the underlying box', () => {
		const p = panel(ctx.renderer);
		expect(typeof p.add).toBe('function');
	});
});

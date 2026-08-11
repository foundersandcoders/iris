import { describe, it, expect, beforeEach, vi } from 'vitest';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

import { overlayScaffold, Z_INDEX } from '../../../src/tui/components/overlay';
import * as fixtures from '../../fixtures/tui/tui';

describe('Z_INDEX', () => {
	it('modal sits below the toast layer', () => {
		// Converts the ordering contract (previously enforced only by a
		// comment repeated across helpOverlay/confirmOverlay/commandPalette/
		// toastManager) into something a regression would actually break.
		expect(Z_INDEX.modal).toBeLessThan(Z_INDEX.toast);
	});
});

describe('overlayScaffold()', () => {
	let ctx: ReturnType<typeof fixtures.createMockContext>;

	beforeEach(() => {
		ctx = fixtures.createMockContext();
	});

	it('builds a hidden, full-screen, centred backdrop', () => {
		const { root } = overlayScaffold(ctx.renderer, { id: 'test-overlay', title: 'Test' });

		expect(root.constructor.name).toBe('BoxRenderable');
		expect(root.id).toBe('test-overlay');
		expect(root.position).toBe('absolute');
		expect(root.width).toBe('100%');
		expect(root.height).toBe('100%');
		expect(root.visible).toBe(false);
	});

	it('defaults zIndex to Z_INDEX.modal', () => {
		const { root } = overlayScaffold(ctx.renderer, { id: 'test-overlay', title: 'Test' });
		expect(root.zIndex).toBe(Z_INDEX.modal);
	});

	it('honours a custom zIndex', () => {
		const { root } = overlayScaffold(ctx.renderer, { id: 'test-overlay', title: 'Test', zIndex: 150 });
		expect(root.zIndex).toBe(150);
	});

	it('mounts the titled card onto the backdrop', () => {
		const { root, card } = overlayScaffold(ctx.renderer, { id: 'test-overlay', title: 'My Title' });

		expect(root.getChildren()).toContain(card.box);
	});
});

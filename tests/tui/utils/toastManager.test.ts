import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

import { ToastManager } from '../../../src/tui/utils/toastManager';
import { theme } from '../../../assets/brand/theme';
import { RGBA } from '../../fixtures/tui/opentui';
import * as fixtures from '../../fixtures/tui/tui';

describe('ToastManager', () => {
	let renderer: ReturnType<typeof fixtures.createMockRenderer>;

	beforeEach(() => {
		vi.useFakeTimers();
		renderer = fixtures.createMockRenderer();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	function layerOf(_manager: ToastManager) {
		return (renderer.root.add as ReturnType<typeof vi.fn>).mock.calls[0][0];
	}

	describe('mounting', () => {
		it('attach() adds the layer to renderer.root with the default id', () => {
			const manager = new ToastManager(renderer);
			manager.attach();
			expect(renderer.root.add).toHaveBeenCalledTimes(1);
			expect(layerOf(manager).id).toBe('toast-layer-root');
		});

		it('attach() is idempotent', () => {
			const manager = new ToastManager(renderer);
			manager.attach();
			manager.attach();
			expect(renderer.root.add).toHaveBeenCalledTimes(1);
		});

		it('detach() removes the layer by id', () => {
			const manager = new ToastManager(renderer);
			manager.attach();
			manager.detach();
			expect(renderer.root.remove).toHaveBeenCalledWith('toast-layer-root');
		});

		it('detach() without attach() does not throw', () => {
			const manager = new ToastManager(renderer);
			expect(() => manager.detach()).not.toThrow();
		});
	});

	describe('the non-blocking layout contract', () => {
		it('positions absolutely, anchored bottom-right, without covering the screen', () => {
			const manager = new ToastManager(renderer);
			manager.attach();
			const layer = layerOf(manager);

			expect(layer.position).toBe('absolute');
			expect(layer.shouldFill).toBe(false);
			expect(layer.backgroundColor).toBeUndefined();
			expect(layer.width).toBeUndefined();
			expect(layer.height).toBeUndefined();
			expect(layer.top).toBeUndefined();
			expect(layer.left).toBeUndefined();
			expect(typeof layer.bottom).toBe('number');
			expect(typeof layer.right).toBe('number');
		});

		it('paints above the modal overlays (zIndex 200 > 100)', () => {
			const manager = new ToastManager(renderer);
			manager.attach();
			const layer = layerOf(manager);
			expect(layer.zIndex).toBe(200);
			expect(layer.zIndex).toBeGreaterThan(100);
		});

		it('honours a custom zIndex', () => {
			const manager = new ToastManager(renderer, { zIndex: 300 });
			manager.attach();
			expect(layerOf(manager).zIndex).toBe(300);
		});

		it('is hidden until the first toast', () => {
			const manager = new ToastManager(renderer);
			manager.attach();
			expect(layerOf(manager).visible).toBe(false);
		});
	});

	describe('stacking and queueing', () => {
		it('show() returns null when the layer is not attached, distinct from a real handle', () => {
			const manager = new ToastManager(renderer);
			// No attach() call: this.layer is undefined.
			expect(manager.show('Saved')).toBeNull();
		});

		it('show() returns a non-empty id and tracks it', () => {
			const manager = new ToastManager(renderer);
			manager.attach();
			const id = manager.show('Saved');
			expect(id).toBeTruthy();
			expect(manager.activeIds()).toContain(id);
		});

		it('stacks multiple toasts in call order', () => {
			const manager = new ToastManager(renderer);
			manager.attach();
			const a = manager.show('First');
			const b = manager.show('Second');
			const c = manager.show('Third');
			expect(manager.activeIds()).toEqual([a, b, c]);
		});

		it('evicts the oldest toast beyond maxVisible', () => {
			const manager = new ToastManager(renderer, { maxVisible: 3 });
			manager.attach();
			const a = manager.show('First');
			manager.show('Second');
			manager.show('Third');
			manager.show('Fourth');
			expect(manager.activeIds()).toHaveLength(3);
			expect(manager.activeIds()).not.toContain(a);
		});

		it('becomes visible on the first toast', () => {
			const manager = new ToastManager(renderer);
			manager.attach();
			manager.show('Saved');
			expect(layerOf(manager).visible).toBe(true);
		});
	});

	describe('timers', () => {
		it('auto-dismisses after the default 3000ms', () => {
			const manager = new ToastManager(renderer);
			manager.attach();
			manager.show('Saved');
			vi.advanceTimersByTime(3000);
			expect(manager.activeIds()).toHaveLength(0);
			expect(layerOf(manager).visible).toBe(false);
		});

		it('is still present at 2999ms', () => {
			const manager = new ToastManager(renderer);
			manager.attach();
			manager.show('Saved');
			vi.advanceTimersByTime(2999);
			expect(manager.activeIds()).toHaveLength(1);
		});

		it('honours a per-toast duration override', () => {
			const manager = new ToastManager(renderer);
			manager.attach();
			manager.show('Quick', 'info', 500);
			vi.advanceTimersByTime(500);
			expect(manager.activeIds()).toHaveLength(0);
		});

		it('dismiss(id) cancels the timer, no double removal on later expiry', () => {
			const manager = new ToastManager(renderer);
			manager.attach();
			const removeSpy = vi.spyOn(layerOf(manager), 'remove');
			const id = manager.show('Saved');
			manager.dismiss(id!);
			const removeCalls = removeSpy.mock.calls.length;
			vi.advanceTimersByTime(10_000);
			expect(removeSpy.mock.calls.length).toBe(removeCalls);
		});

		it('dismiss() on an unknown id is a silent no-op', () => {
			const manager = new ToastManager(renderer);
			manager.attach();
			expect(() => manager.dismiss('nope')).not.toThrow();
		});

		it('clear() removes all toasts and cancels all timers', () => {
			const manager = new ToastManager(renderer);
			manager.attach();
			manager.show('First');
			manager.show('Second');
			manager.show('Third');
			manager.clear();
			expect(manager.activeIds()).toHaveLength(0);
			expect(() => vi.advanceTimersByTime(10_000)).not.toThrow();
			expect(manager.activeIds()).toHaveLength(0);
		});

		it('detach() cancels pending timers so nothing fires against a detached layer', () => {
			const manager = new ToastManager(renderer);
			manager.attach();
			manager.show('Saved');
			manager.detach();
			expect(vi.getTimerCount()).toBe(0);
			expect(() => vi.advanceTimersByTime(10_000)).not.toThrow();
		});

		it('eviction clears the evicted toast timer, leaving survivors untouched', () => {
			const manager = new ToastManager(renderer, { maxVisible: 2 });
			manager.attach();
			const a = manager.show('First'); // evicted below
			const b = manager.show('Second');
			manager.show('Third'); // triggers eviction of `a`
			expect(manager.activeIds()).not.toContain(a);

			// Advancing to just before `b`'s OWN 3000ms deadline (from `b`'s own
			// show() call) is the assertion that actually proves eviction left
			// `b`'s timer bookkeeping alone; advancing past `a`'s old deadline
			// instead wouldn't catch eviction corrupting `b`'s entry (e.g. the
			// wrong key deleted from the timers map), since dismiss() is a
			// silent no-op on an already-removed id either way.
			vi.advanceTimersByTime(2999);
			expect(manager.activeIds()).toContain(b);

			vi.advanceTimersByTime(1);
			expect(manager.activeIds()).not.toContain(b);
		});
	});

	describe('variant wrappers', () => {
		it.each([
			['success', theme.successAccent],
			['info', theme.infoAccent],
			['warning', theme.warningAccent],
			['error', theme.errorAccent],
		] as const)('%s() shows a toast coloured for that variant', (variant, accent) => {
			const manager = new ToastManager(renderer);
			manager.attach();
			const id = manager[variant]('Message');
			const layer = layerOf(manager);
			const card = layer.getChildren().find((c: { id: string }) => c.id === id) as any;
			expect(card.borderColor.equals(RGBA.fromHex(accent))).toBe(true);
		});
	});
});

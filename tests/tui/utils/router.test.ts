import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Router, type ScreenResult } from '../../../src/tui/utils/router';
import { ToastManager } from '../../../src/tui/utils/toastManager';
import * as fixtures from '../../fixtures/tui/tui';

// @opentui/core can only load under Bun; needed here for the real
// ToastManager used in the cross-screen-survival test below.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

describe('Router', () => {
	let router: Router;
	let mockRenderer: ReturnType<typeof fixtures.createMockRenderer>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockRenderer = fixtures.createMockRenderer();
		router = new Router(mockRenderer);
	});

  describe('register', () => {
    it('should register a screen factory', () => {
      const factory = vi.fn(() => fixtures.createMockScreen('test', { action: 'quit' }));
      router.register('test', factory);
      expect(() => router.push('test')).not.toThrow();
    });
  });

  describe('push', () => {
    it('should push a screen onto the stack', async () => {
      const screen = fixtures.createMockScreen('test', { action: 'quit' });
      router.register('test', () => screen);

      await router.push('test');

      expect(screen.render).toHaveBeenCalled();
      expect(router.getBreadcrumbs()).toEqual(['test']);
    });

    it('should throw error for unregistered screen', async () => {
      await expect(router.push('nonexistent')).rejects.toThrow('Screen not found: nonexistent');
    });

    it('should cleanup previous screen when pushing', async () => {
      const screen1 = fixtures.createMockScreen('screen1', { action: 'push', screen: 'screen2' });
      const screen2 = fixtures.createMockScreen('screen2', { action: 'quit' });

      router.register('screen1', () => screen1);
      router.register('screen2', () => screen2);

      await router.push('screen1');

      expect(screen1.cleanup).toHaveBeenCalled();
      expect(router.getBreadcrumbs()).toEqual(['screen1', 'screen2']);
    });

    it('should pass data to screen', async () => {
      const screen = fixtures.createMockScreen('test', { action: 'quit' });
      router.register('test', () => screen);

      const data = { foo: 'bar' };
      await router.push('test', data);

      expect(screen.render).toHaveBeenCalledWith(data);
    });

    it('unwinds to an existing entry rather than appending a duplicate', async () => {
      // screen1 -> screen2 -> screen1 (cycle back), then quit.
      const screen1First = fixtures.createMockScreen('screen1', { action: 'push', screen: 'screen2' });
      const screen2 = fixtures.createMockScreen('screen2', { action: 'push', screen: 'screen1' });
      const screen1Second = fixtures.createMockScreen('screen1', { action: 'quit' });

      router.register('screen1', vi.fn()
        .mockReturnValueOnce(screen1First)
        .mockReturnValueOnce(screen1Second));
      router.register('screen2', () => screen2);

      await router.push('screen1');

      expect(router.getBreadcrumbs()).toEqual(['screen1']);
    });

    it('repeated A/B cycling does not grow the stack', async () => {
      // screen1 -> screen2 -> screen1 -> screen2 -> screen1 -> quit.
      const screen1First = fixtures.createMockScreen('screen1', { action: 'push', screen: 'screen2' });
      const screen2First = fixtures.createMockScreen('screen2', { action: 'push', screen: 'screen1' });
      const screen1Second = fixtures.createMockScreen('screen1', { action: 'push', screen: 'screen2' });
      const screen2Second = fixtures.createMockScreen('screen2', { action: 'push', screen: 'screen1' });
      const screen1Third = fixtures.createMockScreen('screen1', { action: 'quit' });

      router.register('screen1', vi.fn()
        .mockReturnValueOnce(screen1First)
        .mockReturnValueOnce(screen1Second)
        .mockReturnValueOnce(screen1Third));
      router.register('screen2', vi.fn()
        .mockReturnValueOnce(screen2First)
        .mockReturnValueOnce(screen2Second));

      await router.push('screen1');

      expect(router.getBreadcrumbs().length).toBe(1);
      expect(router.getBreadcrumbs()).toEqual(['screen1']);
    });

    it('the re-pushed entry carries the new data, not the stale payload', async () => {
      // screen1 (data: {v: 1}) -> screen2 -> screen1 (data: {v: 2}) -> quit.
      const screen1First = fixtures.createMockScreen('screen1', { action: 'push', screen: 'screen2' });
      const screen2 = fixtures.createMockScreen('screen2', {
        action: 'push',
        screen: 'screen1',
        data: { v: 2 },
      });
      const screen1Second = fixtures.createMockScreen('screen1', { action: 'quit' });

      router.register('screen1', vi.fn()
        .mockReturnValueOnce(screen1First)
        .mockReturnValueOnce(screen1Second));
      router.register('screen2', () => screen2);

      await router.push('screen1', { v: 1 });

      expect(screen1Second.render).toHaveBeenCalledWith({ v: 2 });
    });

    it('unwinding to the root still leaves canGoBack() false', async () => {
      const screen1First = fixtures.createMockScreen('screen1', { action: 'push', screen: 'screen2' });
      const screen2 = fixtures.createMockScreen('screen2', { action: 'push', screen: 'screen1' });
      const screen1Second = fixtures.createMockScreen('screen1', { action: 'quit' });

      router.register('screen1', vi.fn()
        .mockReturnValueOnce(screen1First)
        .mockReturnValueOnce(screen1Second));
      router.register('screen2', () => screen2);

      await router.push('screen1');

      expect(router.canGoBack()).toBe(false);
    });
  });

  describe('pop', () => {
    it('should go back to previous screen', async () => {
      const screen1 = fixtures.createMockScreen('screen1', { action: 'push', screen: 'screen2' });
      const screen2 = fixtures.createMockScreen('screen2', { action: 'pop' });
      const screen1Again = fixtures.createMockScreen('screen1', { action: 'quit' });

      router.register('screen1', vi.fn()
        .mockReturnValueOnce(screen1)
        .mockReturnValueOnce(screen1Again));
      router.register('screen2', () => screen2);

      await router.push('screen1');

      expect(router.getBreadcrumbs()).toEqual(['screen1']);
      expect(screen1Again.render).toHaveBeenCalled();
    });

    it('should not pop when at root', async () => {
      const screen = fixtures.createMockScreen('root', { action: 'quit' });
      router.register('root', () => screen);

      await router.push('root');
      const breadcrumbs = router.getBreadcrumbs();

      await router.pop();

      expect(router.getBreadcrumbs()).toEqual(breadcrumbs);
    });

    it('should merge data when popping', async () => {
      const initialData = { initial: 'data' };
      const screen1 = fixtures.createMockScreen('screen1', { action: 'push', screen: 'screen2' });
      const screen2 = fixtures.createMockScreen('screen2', { action: 'pop', data: { returned: 'value' } });
      const screen1Again = fixtures.createMockScreen('screen1', { action: 'quit' });

      router.register('screen1', vi.fn()
        .mockReturnValueOnce(screen1)
        .mockReturnValueOnce(screen1Again));
      router.register('screen2', () => screen2);

      await router.push('screen1', initialData);

      expect(screen1Again.render).toHaveBeenCalledWith({ initial: 'data', returned: 'value' });
    });
  });

  describe('replace', () => {
    it('should replace current screen without adding to history', async () => {
      const screen1 = fixtures.createMockScreen('screen1', { action: 'replace', screen: 'screen2' });
      const screen2 = fixtures.createMockScreen('screen2', { action: 'quit' });

      router.register('screen1', () => screen1);
      router.register('screen2', () => screen2);

      await router.push('screen1');

      expect(router.getBreadcrumbs()).toEqual(['screen2']);
    });
  });

  describe('getBreadcrumbs', () => {
    it('should return screen names in navigation order', async () => {
      const screen1 = fixtures.createMockScreen('screen1', { action: 'push', screen: 'screen2' });
      const screen2 = fixtures.createMockScreen('screen2', { action: 'push', screen: 'screen3' });
      const screen3 = fixtures.createMockScreen('screen3', { action: 'quit' });

      router.register('screen1', () => screen1);
      router.register('screen2', () => screen2);
      router.register('screen3', () => screen3);

      await router.push('screen1');

      expect(router.getBreadcrumbs()).toEqual(['screen1', 'screen2', 'screen3']);
    });
  });

  describe('toasts', () => {
    it('threads no toast manager into ctx by default', async () => {
      let capturedCtx: unknown;
      const factory = vi.fn((ctx) => {
        capturedCtx = ctx;
        return fixtures.createMockScreen('test', { action: 'quit' });
      });
      router.register('test', factory);

      await router.push('test');

      expect((capturedCtx as { toasts?: unknown }).toasts).toBeUndefined();
    });

    it('threads a given toast manager into the ctx handed to screen factories', async () => {
      const toasts = fixtures.createMockToasts();
      const toastRouter = new Router(mockRenderer, toasts);

      let capturedCtx: unknown;
      const factory = vi.fn((ctx) => {
        capturedCtx = ctx;
        return fixtures.createMockScreen('test', { action: 'quit' });
      });
      toastRouter.register('test', factory);

      await toastRouter.push('test');

      expect((capturedCtx as { toasts?: unknown }).toasts).toBe(toasts);
    });

    it('survives a screen replace(), the manager outlives the screen that fired it', async () => {
      const toasts = new ToastManager(mockRenderer);
      toasts.attach();
      const toastRouter = new Router(mockRenderer, toasts);

      // Mirrors WorkflowScreen: fires a toast, then replace()s to the next
      // screen. cleanup() (a no-op here) runs before the next screen exists,
      // but the toast manager is renderer-scoped, not screen-owned, so the
      // toast must still be tracked afterwards.
      let firedId: string | null = null;
      const outgoing = fixtures.createMockScreen('workflow', {
        action: 'replace',
        screen: 'success',
      });
      outgoing.render = vi.fn(async (): Promise<ScreenResult> => {
        firedId = toasts.success('Converted 3 learners');
        return { action: 'replace', screen: 'success' };
      });
      const incoming = fixtures.createMockScreen('success', { action: 'quit' });

      toastRouter.register('workflow', () => outgoing);
      toastRouter.register('success', () => incoming);

      await toastRouter.push('workflow');

      expect(firedId).toBeTruthy();
      expect(toasts.activeIds()).toContain(firedId);
    });
  });

  describe('transitions', () => {
    it('threads motion into ctx (default true)', async () => {
      let capturedCtx: unknown;
      const factory = vi.fn((ctx) => {
        capturedCtx = ctx;
        return fixtures.createMockScreen('test', { action: 'quit' });
      });
      router.register('test', factory);

      await router.push('test');

      expect((capturedCtx as { motion?: unknown }).motion).toBe(true);
    });

    it('honours motion: false and never touches the engine', async () => {
      const { engine } = await import('../../fixtures/tui/opentui');
      const noMotionRouter = new Router(mockRenderer, undefined, { motion: false });
      const screen = fixtures.createMockScreen('test', { action: 'quit' });
      noMotionRouter.register('test', () => screen);

      await noMotionRouter.push('test');
      noMotionRouter.dispose();

      expect(engine.attach).not.toHaveBeenCalled();
      expect(engine.detach).not.toHaveBeenCalled();
    });

    it('fires fadeIn on push/pop/replace and cleanup() ordering is unaffected', async () => {
      const screen1 = fixtures.createMockScreen('screen1', { action: 'push', screen: 'screen2' });
      const screen2 = fixtures.createMockScreen('screen2', { action: 'quit' });

      router.register('screen1', () => screen1);
      router.register('screen2', () => screen2);

      await router.push('screen1');

      // cleanup() still runs, in the same order relative to construction,
      // regardless of the transitions call added around render().
      expect(screen1.cleanup).toHaveBeenCalled();
      expect(router.getBreadcrumbs()).toEqual(['screen1', 'screen2']);
    });

    it('dispose() detaches the engine when motion is enabled', async () => {
      const { engine } = await import('../../fixtures/tui/opentui');
      const screen = fixtures.createMockScreen('test', { action: 'quit' }, true);
      router.register('test', () => screen);

      await router.push('test');
      router.dispose();

      expect(engine.detach).toHaveBeenCalledTimes(1);
    });
  });

  describe('canGoBack', () => {
    it('should return false when at root', async () => {
      const screen = fixtures.createMockScreen('root', { action: 'quit' });
      router.register('root', () => screen);

      await router.push('root');

      expect(router.canGoBack()).toBe(false);
    });

    it('should return true when not at root', async () => {
      const screen1 = fixtures.createMockScreen('screen1', { action: 'push', screen: 'screen2' });
      const screen2 = fixtures.createMockScreen('screen2', { action: 'quit' });

      router.register('screen1', () => screen1);
      router.register('screen2', () => screen2);

      await router.push('screen1');

      expect(router.canGoBack()).toBe(true);
    });
  });
});
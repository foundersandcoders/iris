import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Router, type ScreenResult } from '../../../src/tui/utils/router';
import * as fixtures from '../../fixtures/tui';

describe('Router', () => {
  let router: Router;
  let mockTerm: ReturnType<typeof fixtures.createMockTerminal>;

  beforeEach(() => {
    mockTerm = fixtures.createMockTerminal();
    router = new Router(mockTerm as any);
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
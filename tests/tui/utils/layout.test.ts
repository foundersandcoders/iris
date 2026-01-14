import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Layout } from '../../../src/tui/utils/layout';
import * as fixtures from '../../fixtures/tui';

describe('Layout', () => {
  let layout: Layout;
  let mockTerm: ReturnType<typeof fixtures.createMockTerminal>;

  beforeEach(() => {
    mockTerm = fixtures.createMockTerminal();
    layout = new Layout(mockTerm as any);
  });

  describe('draw', () => {
    it('should clear terminal before drawing', () => {
      layout.draw({ title: 'Test' });
      expect(mockTerm.clear).toHaveBeenCalled();
    });

    it('should return correct content region', () => {
      const region = layout.draw({ title: 'Test' });

      expect(region.contentTop).toBe(4);
      expect(region.contentBottom).toBe(23); // height - 1
      expect(region.contentHeight).toBe(19); // 23 - 4
      expect(region.contentWidth).toBe(80);
    });

    it('should draw header with title', () => {
      layout.draw({ title: 'Test Title' });

      // Should call moveTo for positioning
      expect(mockTerm.moveTo).toHaveBeenCalled();
      // Should set colors
      expect(mockTerm.colorRgbHex).toHaveBeenCalled();
    });

    it('should draw breadcrumbs when provided', () => {
      layout.draw({
        title: 'Test',
        breadcrumbs: ['Home', 'Settings', 'Advanced']
      });

      // Should draw breadcrumbs (moveTo called for row 3)
      expect(mockTerm.moveTo).toHaveBeenCalledWith(1, 3);
    });

    it('should not draw breadcrumbs when not provided', () => {
      const moveToSpy = vi.spyOn(mockTerm, 'moveTo');
      layout.draw({ title: 'Test' });

      // Should not call moveTo for row 3 (breadcrumbs row)
      const row3Calls = moveToSpy.mock.calls.filter(call => call[1] === 3);
      expect(row3Calls.length).toBe(0);
    });

    it('should show back indicator when showBack is true', () => {
      layout.draw({ title: 'Test', showBack: true });

      // Should draw arrow indicator
      expect(mockTerm.colorRgbHex).toHaveBeenCalled();
    });

    it('should draw status bar with custom text', () => {
      layout.draw({
        title: 'Test',
        statusBar: '[Custom] Status'
      });

      // Should position at bottom row
      expect(mockTerm.moveTo).toHaveBeenCalledWith(1, 24);
    });

    it('should draw default status bar when not provided', () => {
      layout.draw({ title: 'Test' });

      // Should still draw status bar at bottom
      expect(mockTerm.moveTo).toHaveBeenCalledWith(1, 24);
    });
  });

  describe('clearContent', () => {
    it('should clear only content area lines', () => {
      const region = layout.draw({ title: 'Test' });

      mockTerm.eraseLineAfter.mockClear();
      mockTerm.moveTo.mockClear();

      layout.clearContent(region);

      // Should erase each line in content area
      expect(mockTerm.moveTo).toHaveBeenCalledTimes(region.contentHeight);
      expect(mockTerm.eraseLineAfter).toHaveBeenCalledTimes(region.contentHeight);

      // First clear should be at contentTop
      expect(mockTerm.moveTo).toHaveBeenNthCalledWith(1, 1, region.contentTop);
    });
  });
});
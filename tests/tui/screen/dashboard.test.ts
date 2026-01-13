import { describe, it, expect, vi } from 'vitest';
import { Dashboard } from '../../../src/tui/screens/dashboard';

// Mock terminal
const mockTerm = {
  clear: vi.fn(),
  moveTo: vi.fn(() => mockTerm),
  on: vi.fn(),
  removeAllListeners: vi.fn(),
  bold: {
    colorRgbHex: vi.fn(() => vi.fn()),
  },
  colorRgbHex: vi.fn(() => vi.fn()),
  styleReset: vi.fn(),
  height: 24,
  width: 80,
};

describe('Dashboard', () => {
  it('can be instantiated with a terminal instance', () => {
    const dashboard = new Dashboard(mockTerm);
    expect(dashboard).toBeInstanceOf(Dashboard);
  });

  it('has a render method', () => {
    const dashboard = new Dashboard(mockTerm);
    expect(typeof dashboard.render).toBe('function');
  });

  it('render method returns a Promise', () => {
    const dashboard = new Dashboard(mockTerm);
    const result = dashboard.render();
    expect(result).toBeInstanceOf(Promise);

    // Clean up the promise to prevent hanging
    dashboard['term'].removeAllListeners('key');
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dashboard } from '../../../src/tui/screens/dashboard';
import * as fixtures from '../../fixtures/tui';

describe('Dashboard', () => {
  let mockTerm: ReturnType<typeof fixtures.createMockTerminal>;

  beforeEach(() => {
    mockTerm = fixtures.createMockTerminal();
  });

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
    mockTerm.removeAllListeners('key');
  });
});

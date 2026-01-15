import { vi } from 'vitest';
import type { Screen, ScreenResult } from '../../src/tui/utils/router';

/**
  * Mock terminal matching terminal-kit API
  */
export function createMockTerminal() {
  // Create the main function that can be called like term('text')
  const term: any = vi.fn();
  
  // Properties
  term.width = 80;
  term.height = 24;
  
  // Create SEPARATE spies for each method so we can track calls individually
  // All chainable methods should return 'term'
  term.clear = vi.fn().mockReturnValue(term);
  term.moveTo = vi.fn().mockReturnValue(term);
  term.colorRgbHex = vi.fn().mockReturnValue(term);
  term.bgColorRgbHex = vi.fn().mockReturnValue(term);
  term.bgDefaultColor = vi.fn().mockReturnValue(term);
  term.styleReset = vi.fn().mockReturnValue(term);
  term.eraseLineAfter = vi.fn().mockReturnValue(term);
  term.on = vi.fn();
  term.removeAllListeners = vi.fn();
  
  // Modifiers
  Object.defineProperty(term, 'bold', {
    get: () => term
  });

  return term;
}

/**
  * Mock screen for router testing
  */
export function createMockScreen(name: string, result: ScreenResult): Screen {
  return {
    name,
    render: vi.fn().mockResolvedValue(result),
    cleanup: vi.fn(),
  };
}

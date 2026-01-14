import { vi } from 'vitest';
import type { Screen, ScreenResult } from '../../src/tui/utils/router';

/**
  * Mock terminal matching terminal-kit API
  */
export function createMockTerminal() {
  const colorFn = vi.fn().mockReturnValue(undefined);

  return {
    width: 80,
    height: 24,
    clear: vi.fn(),
    moveTo: vi.fn().mockReturnThis(),
    colorRgbHex: vi.fn().mockReturnValue(colorFn),
    bold: {
      colorRgbHex: vi.fn().mockReturnValue(colorFn)
    },
    styleReset: vi.fn(),
    eraseLineAfter: vi.fn(),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
  };
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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TUI } from '../../src/tui/app';

vi.mock('terminal-kit', () => ({
  default: {
    terminal: {
      fullscreen: vi.fn(),
      hideCursor: vi.fn(),
      showCursor: vi.fn(),
      grabInput: vi.fn(),
      on: vi.fn(),
      removeAllListeners: vi.fn(),
      clear: vi.fn(),
      moveTo: vi.fn(() => ({
        bold: {
          colorRgbHex: vi.fn(() => vi.fn()),
        },
        colorRgbHex: vi.fn(() => vi.fn()),
        styleReset: vi.fn(),
      })),
      height: 24,
      width: 80,
    },
  },
}));

describe('TUI', () => {
  let mockExit: any;

  beforeEach(() => {
    mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  it('can be instantiated without options', () => {
    const tui = new TUI();
    expect(tui).toBeInstanceOf(TUI);
  });

  it('can be instantiated with options', () => {
    const tui = new TUI({ startCommand: 'convert', args: ['test.csv'] });
    expect(tui).toBeInstanceOf(TUI);
  });

  it('has a start method', () => {
    const tui = new TUI();
    expect(typeof tui.start).toBe('function');
  });
});
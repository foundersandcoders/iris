import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessingScreen } from '../../../src/tui/screens/processing';
import * as tuiFixtures from '../../fixtures/tui/tui';

describe('ProcessingScreen', () => {
  let mockTerm: ReturnType<typeof tuiFixtures.createMockTerminal>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTerm = tuiFixtures.createMockTerminal();
  });

  it('can be instantiated', () => {
    const screen = new ProcessingScreen(mockTerm);
    expect(screen).toBeInstanceOf(ProcessingScreen);
    expect(screen.name).toBe('processing');
  });

  it('returns pop action when no filePath provided', async () => {
    const screen = new ProcessingScreen(mockTerm);
    const result = await screen.render();
    expect(result).toEqual({ action: 'pop' });
  });

  it('displays step status icons', () => {
    const screen = new ProcessingScreen(mockTerm);

    const getIcon = (screen as any).getStatusIcon.bind(screen);

    expect(getIcon('pending')).toBe('○');
    expect(getIcon('running')).toBe('◐');
    expect(getIcon('complete')).toBe('●');
    expect(getIcon('failed')).toBe('✗');
    expect(getIcon('skipped')).toBe('◌');
  });

  it('displays step status colors', () => {
    const screen = new ProcessingScreen(mockTerm);

    const getColor = (screen as any).getStatusColor.bind(screen);

    // Just verify it returns strings (colors) for each status
    expect(typeof getColor('pending')).toBe('string');
    expect(typeof getColor('running')).toBe('string');
    expect(typeof getColor('complete')).toBe('string');
    expect(typeof getColor('failed')).toBe('string');
    expect(typeof getColor('skipped')).toBe('string');
  });
});

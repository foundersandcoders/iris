import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FilePicker } from '../../../src/tui/screens/file-picker';
import * as fixtures from '../../fixtures/file-picker';
import * as tuiFixtures from '../../fixtures/tui';
import fs from 'node:fs/promises';

vi.mock('node:fs/promises', () => ({
  default: {
    readdir: vi.fn(),
  }
}));

describe('FilePicker', () => {
  let mockTerm: ReturnType<typeof tuiFixtures.createMockTerminal>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTerm = tuiFixtures.createMockTerminal();
  });

  it('can be instantiated', () => {
    const screen = new FilePicker(mockTerm);
    expect(screen).toBeInstanceOf(FilePicker);
    expect(screen.name).toBe('file-picker');
  });

  it('filters for directories and CSV files using mixed fixture', async () => {
    const screen = new FilePicker(mockTerm);
    
    (fs.readdir as any).mockResolvedValue(fixtures.mixedDirectory);

    screen.render();
    
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const entries = (screen as any).entries;
    
    expect(entries).toHaveLength(2);
    expect(entries.map((e: any) => e.name)).toContain('data.csv');
    expect(entries.map((e: any) => e.name)).toContain('nested');
  });

  it('sorts directories before files', async () => {
    const screen = new FilePicker(mockTerm);
    
    (fs.readdir as any).mockResolvedValue(fixtures.messyCsvDirectory);

    screen.render();
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const entries = (screen as any).entries;

    expect(entries[0].name).toBe('Folder A');
    expect(entries[0].isDirectory).toBe(true);
    expect(entries[1].name).toBe('Folder B');
    expect(entries[2].name).toBe('a_first.csv');
    expect(entries[3].name).toBe('z_last.csv');
  });

  it('renders "No CSV files" message for empty directory', async () => {
    const screen = new FilePicker(mockTerm);
    
    (fs.readdir as any).mockResolvedValue(fixtures.emptyDirectory);
    
    screen.render();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockTerm).toHaveBeenCalledWith(expect.stringContaining('No CSV files found'));
  });
});

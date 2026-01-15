import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FilePicker } from '../../../src/tui/screens/file-picker';
import * as fixtures from '../../fixtures/file-picker';
import fs from 'node:fs/promises';

vi.mock('node:fs/promises');

const mockTerm = {
  clear: vi.fn(),
  moveTo: vi.fn(() => mockTerm),
  on: vi.fn(),
  removeAllListeners: vi.fn(),
  bold: {
    colorRgbHex: vi.fn(() => vi.fn()),
  },
  colorRgbHex: vi.fn(() => vi.fn()),
  bgColorRgbHex: vi.fn(() => vi.fn()),
  bgDefaultColor: vi.fn(),
  eraseLineAfter: vi.fn(),
  styleReset: vi.fn(),
  height: 24,
  width: 80,
} as any;

const termMock = Object.assign(vi.fn(), mockTerm);

describe('FilePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('can be instantiated', () => {
    const screen = new FilePicker(termMock);
    expect(screen).toBeInstanceOf(FilePicker);
    expect(screen.name).toBe('file-picker');
  });

  it('filters for directories and CSV files using mixed fixture', async () => {
    const screen = new FilePicker(termMock);

    (fs.readdir as any).mockResolvedValue(fixtures.mixedDirectory);

    await (screen as any).loadDirectory();

    const entries = (screen as any).entries;

    expect(entries).toHaveLength(2);
    expect(entries.map((e: any) => e.name)).toContain('data.csv');
    expect(entries.map((e: any) => e.name)).toContain('nested');
    expect(entries.map((e: any) => e.name)).not.toContain('styles.css');
  });

  it('sorts directories before files', async () => {
    const screen = new FilePicker(termMock);

    (fs.readdir as any).mockResolvedValue(fixtures.messyCsvDirectory);

    await (screen as any).loadDirectory();
    const entries = (screen as any).entries;

    expect(entries[0].name).toBe('Folder A');
    expect(entries[0].isDirectory).toBe(true);
    expect(entries[1].name).toBe('Folder B');
    expect(entries[2].name).toBe('a_first.csv');
    expect(entries[3].name).toBe('z_last.csv');
  });

  it('renders "No CSV files" message for empty directory', async () => {
    const screen = new FilePicker(termMock);

    (fs.readdir as any).mockResolvedValue(fixtures.emptyDirectory);

    screen.render();

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(termMock.colorRgbHex).toHaveBeenCalledWith(expect.stringContaining('No CSV files found'));
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FilePicker } from '../../../src/tui/screens/file-picker';
import * as tuiFixtures from '../../fixtures/tui/tui';
import * as filePickerFixtures from '../../fixtures/tui/screens/file-picker';
import fs from 'node:fs/promises';

vi.mock('node:fs/promises', () => ({
	default: {
		readdir: vi.fn(),
	},
}));

// TODO: Full migration in Phase 2 (2TI.25)
describe.skip('FilePicker', () => {
	let mockContext: ReturnType<typeof tuiFixtures.createMockContext>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = tuiFixtures.createMockContext();
	});

	it('can be instantiated', () => {
		const screen = new FilePicker(mockContext);
		expect(screen).toBeInstanceOf(FilePicker);
		expect(screen.name).toBe('file-picker');
	});

	it('filters for directories and CSV files using mixed fixture', async () => {
		const screen = new FilePicker(mockContext);

		(fs.readdir as any).mockResolvedValue(filePickerFixtures.mixedDirectory);

		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 0));

		const entries = (screen as any).entries;

		expect(entries).toHaveLength(2);
		expect(entries.map((e: any) => e.name)).toContain('data.csv');
		expect(entries.map((e: any) => e.name)).toContain('nested');
	});

	it('sorts directories before files', async () => {
		const screen = new FilePicker(mockContext);

		(fs.readdir as any).mockResolvedValue(filePickerFixtures.messyCsvDirectory);

		screen.render();
		await new Promise((resolve) => setTimeout(resolve, 0));

		const entries = (screen as any).entries;

		expect(entries[0].name).toBe('Folder A');
		expect(entries[0].isDirectory).toBe(true);
		expect(entries[1].name).toBe('Folder B');
		expect(entries[2].name).toBe('a_first.csv');
		expect(entries[3].name).toBe('z_last.csv');
	});

	it('renders "No CSV files" message for empty directory', async () => {
		const screen = new FilePicker(mockContext);

		(fs.readdir as any).mockResolvedValue(filePickerFixtures.emptyDirectory);

		screen.render();
		await new Promise((resolve) => setTimeout(resolve, 0));

		// Note: This test would need updating for OpenTUI renderables
	});
});

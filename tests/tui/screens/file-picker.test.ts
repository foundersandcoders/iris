import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FilePicker } from '../../../src/tui/screens/file-picker';
import * as tuiFixtures from '../../fixtures/tui/tui';
import * as filePickerFixtures from '../../fixtures/tui/screens/file-picker';
import fs from 'node:fs/promises';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

vi.mock('node:fs/promises', () => ({
	default: {
		readdir: vi.fn(),
	},
}));

describe('FilePicker', () => {
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

		screen.render(); // Don't await - promise won't resolve in test

		// Wait for async directory load
		await new Promise((resolve) => setTimeout(resolve, 10));

		const entries = (screen as any).entries;

		expect(entries).toHaveLength(2);
		expect(entries.map((e: any) => e.name)).toContain('data.csv');
		expect(entries.map((e: any) => e.name)).toContain('nested');

		screen.cleanup();
	});

	it('sorts directories before files', async () => {
		const screen = new FilePicker(mockContext);

		(fs.readdir as any).mockResolvedValue(filePickerFixtures.messyCsvDirectory);

		screen.render(); // Don't await

		await new Promise((resolve) => setTimeout(resolve, 10));

		const entries = (screen as any).entries;

		expect(entries[0].name).toBe('Folder A');
		expect(entries[0].isDirectory).toBe(true);
		expect(entries[1].name).toBe('Folder B');
		expect(entries[2].name).toBe('a_first.csv');
		expect(entries[3].name).toBe('z_last.csv');

		screen.cleanup();
	});

	it('adds renderable tree to renderer root', async () => {
		const screen = new FilePicker(mockContext);

		(fs.readdir as any).mockResolvedValue(filePickerFixtures.mixedDirectory);

		screen.render(); // Don't await

		await new Promise((resolve) => setTimeout(resolve, 10));

		// One call for the screen shell, one for the auto-mounted help overlay (TR.C1).
		expect(mockContext.renderer.root.add).toHaveBeenCalledTimes(2);
		const addedRenderable = (mockContext.renderer.root.add as any).mock.calls[0][0];
		expect(addedRenderable).toBeDefined();
		expect(addedRenderable.constructor.name).toBe('BoxRenderable');

		screen.cleanup();
	});

	it('registers keypress handler', async () => {
		const screen = new FilePicker(mockContext);

		(fs.readdir as any).mockResolvedValue(filePickerFixtures.mixedDirectory);

		screen.render(); // Don't await

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(mockContext.renderer.keyInput.on).toHaveBeenCalledWith(
			'keypress',
			expect.any(Function)
		);

		screen.cleanup();
	});

	it('cleanup removes keypress handler and container', async () => {
		const screen = new FilePicker(mockContext);

		(fs.readdir as any).mockResolvedValue(filePickerFixtures.mixedDirectory);

		screen.render(); // Don't await

		await new Promise((resolve) => setTimeout(resolve, 10));

		screen.cleanup();

		expect(mockContext.renderer.keyInput.off).toHaveBeenCalledWith(
			'keypress',
			expect.any(Function)
		);
		// One removal for the screen shell, one for the help overlay (TR.C1).
		expect(mockContext.renderer.root.remove).toHaveBeenCalledTimes(2);
	});

	it('shortenPath replaces HOME with ~', () => {
		const screen = new FilePicker(mockContext);
		const home = process.env.HOME || '/home/user';
		const fullPath = `${home}/Documents/data.csv`;

		const shortened = (screen as any).shortenPath(fullPath);

		expect(shortened).toBe('~/Documents/data.csv');
	});

	it('shortenPath returns path unchanged if not under HOME', () => {
		const screen = new FilePicker(mockContext);
		const fullPath = '/tmp/data.csv';

		const shortened = (screen as any).shortenPath(fullPath);

		expect(shortened).toBe('/tmp/data.csv');
	});

	it('renders a footer keybar containing "Nav" and "Select" driven by the keymap', async () => {
		const screen = new FilePicker(mockContext);

		(fs.readdir as any).mockResolvedValue(filePickerFixtures.mixedDirectory);

		screen.render(); // Don't await

		await new Promise((resolve) => setTimeout(resolve, 10));

		// The shell root is the single child added to renderer.root
		const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
		const children = shellRoot.getChildren();
		// Last child is the footer TextRenderable (header, content, footer)
		const footer = children[children.length - 1];
		expect(footer.constructor.name).toBe('TextRenderable');
		const footerText: string = footer.content.chunks[0].text;
		expect(footerText).toContain('Nav');
		expect(footerText).toContain('Select');

		screen.cleanup();
	});

	it('shows the current directory path as the file-list panel title', async () => {
		const screen = new FilePicker(mockContext);

		(fs.readdir as any).mockResolvedValue(filePickerFixtures.mixedDirectory);

		screen.render(); // Don't await

		await new Promise((resolve) => setTimeout(resolve, 10));

		const filePanel = (screen as any).filePanel;
		expect(filePanel).toBeDefined();
		expect(filePanel.box.title).toBe((screen as any).shortenPath(process.cwd()));

		screen.cleanup();
	});

	it('shows empty message when no CSV files found', async () => {
		const screen = new FilePicker(mockContext);

		(fs.readdir as any).mockResolvedValue(filePickerFixtures.emptyDirectory);

		screen.render(); // Don't await

		await new Promise((resolve) => setTimeout(resolve, 10));

		const entries = (screen as any).entries;
		expect(entries).toHaveLength(0);

		// Empty message should be created
		const emptyMessage = (screen as any).emptyMessage;
		expect(emptyMessage).toBeDefined();
		expect(emptyMessage.content.chunks[0].text).toBe('  No .csv files found in this directory.');

		screen.cleanup();
	});
});

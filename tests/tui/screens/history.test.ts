/** ====== History Screen Tests ====== */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoryScreen } from '../../../src/tui/screens/history';
import * as fixtures from '../../fixtures/tui/tui';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

const HISTORY_ENTRY = {
	filename: 'ILR-10000000-2526-20260711-091502-01.XML',
	filePath: '/mock/submissions/ILR-10000000-2526-20260711-091502-01.XML',
	timestamp: '2026-07-11T09:15:02.000Z',
	learnerCount: 3,
	schema: 'ILR2526_v1',
	checksum: 'abc123def456abc123def456',
};

let loadHistoryMock = vi.fn();
let deleteHistoryEntryMock = vi.fn();

vi.mock('../../../src/lib/storage', () => ({
	createStorage: () => ({
		paths: {
			submissions: '/mock/submissions',
			internalSubmissions: '/mock/.iris/submissions',
		},
		loadHistory: loadHistoryMock,
		deleteHistoryEntry: deleteHistoryEntryMock,
	}),
}));

vi.mock('fs/promises', () => ({
	stat: vi.fn().mockResolvedValue({ size: 2048 }),
}));

describe('HistoryScreen', () => {
	let mockContext: ReturnType<typeof fixtures.createMockContext>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = fixtures.createMockContext();
		loadHistoryMock = vi.fn().mockResolvedValue({
			success: true,
			data: { formatVersion: 1, submissions: [] },
		});
		deleteHistoryEntryMock = vi.fn().mockResolvedValue({ success: true, data: undefined });
	});

	it('instantiates without error', () => {
		const screen = new HistoryScreen(mockContext);
		expect(screen).toBeDefined();
		expect(screen.name).toBe('history');
	});

	it('render returns a Promise', () => {
		const screen = new HistoryScreen(mockContext);
		const result = screen.render();
		expect(result).toBeInstanceOf(Promise);
	});

	it('mounts the app shell to the renderer root', async () => {
		const screen = new HistoryScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(mockContext.renderer.root.add).toHaveBeenCalledTimes(1);
		const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
		expect(shellRoot.constructor.name).toBe('BoxRenderable');
	});

	it('shows a "Submission History" breadcrumb in the header', async () => {
		const screen = new HistoryScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
		const header = shellRoot.getChildren()[0];
		expect(header.content.chunks[0].text).toContain('Submission History');
	});

	it('registers keypress handler via the keymap', async () => {
		const screen = new HistoryScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(mockContext.renderer.keyInput.on).toHaveBeenCalledWith('keypress', expect.any(Function));
	});

	it('cleanup detaches the keymap and removes the shell from the renderer root', async () => {
		const screen = new HistoryScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		screen.cleanup();

		expect(mockContext.renderer.root.remove).toHaveBeenCalledWith('history-root');
		expect(mockContext.renderer.keyInput.off).toHaveBeenCalledWith('keypress', expect.any(Function));
	});

	it('resolves with a pop action on escape when empty', async () => {
		const screen = new HistoryScreen(mockContext);
		const resultPromise = screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
		handler({ name: 'escape' });

		const result = await resultPromise;
		expect(result).toEqual({ action: 'pop' });
	});

	describe('with submissions', () => {
		beforeEach(() => {
			loadHistoryMock = vi.fn().mockResolvedValue({
				success: true,
				data: { formatVersion: 1, submissions: [HISTORY_ENTRY] },
			});
		});

		it('wraps the list in a panel titled "Submissions" and shows a "Detail" panel', async () => {
			const screen = new HistoryScreen(mockContext);
			screen.render();

			await new Promise((resolve) => setTimeout(resolve, 50));

			const listPanel = (screen as any).listPanel;
			const detailPanel = (screen as any).detailPanel;
			expect(listPanel.box.title).toBe('Submissions');
			expect(detailPanel.box.title).toBe('Detail');
		});

		it('renders a footer keybar including Validate and Cross-check', async () => {
			const screen = new HistoryScreen(mockContext);
			screen.render();

			await new Promise((resolve) => setTimeout(resolve, 50));

			const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
			const children = shellRoot.getChildren();
			const footer = children[children.length - 1];
			expect(footer.content.chunks[0].text).toContain('Validate');
			expect(footer.content.chunks[0].text).toContain('Cross-check');
		});

		it('pushes a validate workflow when Enter is pressed on a healthy entry', async () => {
			const screen = new HistoryScreen(mockContext);
			const resultPromise = screen.render();

			await new Promise((resolve) => setTimeout(resolve, 50));

			const list = (screen as any).submissionList;
			const itemSelectedHandler = (list.on as any).mock.calls.find(
				(call: any[]) => call[0] === 'itemSelected'
			)[1];
			itemSelectedHandler(0, {});

			const result = await resultPromise;
			expect(result).toEqual({
				action: 'push',
				screen: 'workflow',
				data: { filePath: HISTORY_ENTRY.filePath, workflowType: 'validate' },
			});
		});

		it('does not offer Delete for a healthy (non-broken) entry', async () => {
			const screen = new HistoryScreen(mockContext);
			screen.render();

			await new Promise((resolve) => setTimeout(resolve, 50));

			const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
			const children = shellRoot.getChildren();
			const footer = children[children.length - 1];
			expect(footer.content.chunks[0].text).not.toContain('Delete');
		});
	});

	describe('with a broken entry', () => {
		it('offers Delete in the footer keybar for a broken entry', async () => {
			// loadHistory() drives isBroken via a real fs.stat() call, which is awkward
			// to fake through the module mock here — set the post-load state directly
			// and rebuild the UI, mirroring how rebuildListAndHandlers() re-renders
			// after loadHistory() runs in the real delete flow.
			const screen = new HistoryScreen(mockContext);
			(screen as any).historyItems = [
				{ entry: HISTORY_ENTRY, filePath: undefined, fileSize: undefined, isBroken: true },
			];
			const resolve = vi.fn();
			(screen as any).buildUI(resolve);

			const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
			const children = shellRoot.getChildren();
			const footer = children[children.length - 1];
			expect(footer.content.chunks[0].text).toContain('Delete');
		});
	});
});

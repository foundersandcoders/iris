/** ====== History Screen Tests ====== */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoryScreen } from '../../../src/tui/screens/history';
import * as fixtures from '../../fixtures/tui/tui';

// Mock storage so render() can load history without hitting the filesystem
vi.mock('../../../src/lib/storage', () => ({
	createStorage: () => ({
		paths: {
			submissions: '/mock/submissions',
			internalSubmissions: '/mock/.iris/submissions',
		},
		loadHistory: vi.fn().mockResolvedValue({
			success: true,
			data: { formatVersion: 1, submissions: [] },
		}),
	}),
}));

describe('HistoryScreen', () => {
	let mockContext: ReturnType<typeof fixtures.createMockContext>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = fixtures.createMockContext();
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

	it('adds container to renderer on render', async () => {
		const screen = new HistoryScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(mockContext.renderer.root.add).toHaveBeenCalledTimes(1);
		const addedRenderable = (mockContext.renderer.root.add as any).mock.calls[0][0];
		expect(addedRenderable.constructor.name).toBe('BoxRenderable');
	});

	it('registers keypress handler', async () => {
		const screen = new HistoryScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(mockContext.renderer.keyInput.on).toHaveBeenCalledWith(
			'keypress',
			expect.any(Function)
		);
	});

	it('cleanup removes container and keypress handler', async () => {
		const screen = new HistoryScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		screen.cleanup();

		expect(mockContext.renderer.root.remove).toHaveBeenCalledWith('history-root');
		expect(mockContext.renderer.keyInput.off).toHaveBeenCalled();
	});
});

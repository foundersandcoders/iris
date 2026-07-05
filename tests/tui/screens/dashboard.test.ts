import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Dashboard } from '../../../src/tui/screens/dashboard';
import * as fixtures from '../../fixtures/tui/tui';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

// Mock storage so render() can load config/history without hitting the filesystem.
// loadHistory is hoisted so individual tests can override its return value.
const loadHistoryMock = vi.fn().mockResolvedValue({ success: true, data: { submissions: [] } });
vi.mock('../../../src/lib/storage', () => ({
	createStorage: () => ({
		loadConfig: vi.fn().mockResolvedValue({ success: true, data: {} }),
		loadHistory: loadHistoryMock,
	}),
}));

describe('Dashboard', () => {
	let mockContext: ReturnType<typeof fixtures.createMockContext>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = fixtures.createMockContext();
	});

	it('can be instantiated with a render context', () => {
		const dashboard = new Dashboard(mockContext);
		expect(dashboard).toBeInstanceOf(Dashboard);
		expect(dashboard.name).toBe('dashboard');
	});

	it('has a render method that returns a Promise', () => {
		const dashboard = new Dashboard(mockContext);
		const result = dashboard.render();
		expect(result).toBeInstanceOf(Promise);
	});

	it('adds renderable tree to renderer root on render', async () => {
		const dashboard = new Dashboard(mockContext);
		dashboard.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(mockContext.renderer.root.add).toHaveBeenCalledTimes(1);
		const addedRenderable = (mockContext.renderer.root.add as any).mock.calls[0][0];
		expect(addedRenderable).toBeDefined();
		expect(addedRenderable.constructor.name).toBe('BoxRenderable');
	});

	it('registers keypress handler on renderer', async () => {
		const dashboard = new Dashboard(mockContext);
		dashboard.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(mockContext.renderer.keyInput.on).toHaveBeenCalledWith(
			'keypress',
			expect.any(Function)
		);
	});

	it('cleanup removes keypress handler and container', async () => {
		const dashboard = new Dashboard(mockContext);
		dashboard.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		dashboard.cleanup();

		expect(mockContext.renderer.keyInput.off).toHaveBeenCalledWith(
			'keypress',
			expect.any(Function)
		);
		expect(mockContext.renderer.root.remove).toHaveBeenCalledTimes(1);
	});

	it('renders a footer containing "Quit" driven by the keymap', async () => {
		const dashboard = new Dashboard(mockContext);
		dashboard.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		// The shell root is the single child added to renderer.root
		const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
		const children = shellRoot.getChildren();
		// Last child is the footer TextRenderable (header, content, footer)
		const footer = children[children.length - 1];
		expect(footer.constructor.name).toBe('TextRenderable');
		const footerText: string = footer.content.chunks[0].text;
		expect(footerText).toContain('Quit');
	});

	it('shows "No submissions yet" in the Recent Activity panel when history is empty', async () => {
		const dashboard = new Dashboard(mockContext);
		dashboard.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
		const rendered = JSON.stringify(shellRoot, (_key, value) =>
			value && value.chunks ? value.chunks.map((c: { text: string }) => c.text).join('') : value
		);
		expect(rendered).toContain('No submissions yet');
	});

	it('lists recent submissions in the Recent Activity panel', async () => {
		loadHistoryMock.mockResolvedValueOnce({
			success: true,
			data: {
				submissions: [
					{
						filename: 'ILR-12345678-2526-01.xml',
						filePath: '/tmp/ILR-12345678-2526-01.xml',
						timestamp: '2026-06-15T10:00:00.000Z',
						learnerCount: 42,
						checksum: 'abc123',
						schema: 'ILR2526',
					},
				],
			},
		});

		const dashboard = new Dashboard(mockContext);
		dashboard.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
		const rendered = JSON.stringify(shellRoot, (_key, value) =>
			value && value.chunks ? value.chunks.map((c: { text: string }) => c.text).join('') : value
		);
		expect(rendered).toContain('ILR-12345678-2526-01.xml');
		expect(rendered).toContain('42 learner(s)');
	});
});

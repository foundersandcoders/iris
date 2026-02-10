import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Dashboard } from '../../../src/tui/screens/dashboard';
import * as fixtures from '../../fixtures/tui/tui';

// Mock storage so render() can load config without hitting the filesystem
vi.mock('../../../src/lib/storage', () => ({
	createStorage: () => ({
		loadConfig: vi.fn().mockResolvedValue({ success: true, data: {} }),
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
});

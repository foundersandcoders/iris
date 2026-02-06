import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Dashboard } from '../../../src/tui/screens/dashboard';
import * as fixtures from '../../fixtures/tui/tui';

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

	it('adds renderable tree to renderer root on render', () => {
		const dashboard = new Dashboard(mockContext);
		dashboard.render();

		expect(mockContext.renderer.root.add).toHaveBeenCalledTimes(1);
		expect(mockContext.renderer.root.add).toHaveBeenCalledWith(
			expect.objectContaining({
				flexDirection: 'column',
			})
		);
	});

	it('registers keypress handler on renderer', () => {
		const dashboard = new Dashboard(mockContext);
		dashboard.render();

		expect(mockContext.renderer.keyInput.on).toHaveBeenCalledWith(
			'keypress',
			expect.any(Function)
		);
	});

	it('cleanup removes keypress handler and container', () => {
		const dashboard = new Dashboard(mockContext);
		dashboard.render();
		dashboard.cleanup();

		expect(mockContext.renderer.keyInput.off).toHaveBeenCalledWith(
			'keypress',
			expect.any(Function)
		);
		expect(mockContext.renderer.root.remove).toHaveBeenCalledTimes(1);
	});
});

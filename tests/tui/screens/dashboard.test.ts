import { describe, it, expect, beforeEach } from 'vitest';
import { Dashboard } from '../../../src/tui/screens/dashboard';
import * as fixtures from '../../fixtures/tui/tui';

// TODO: Full migration in Phase 2 (2TI.24)
describe.skip('Dashboard', () => {
	let mockContext: ReturnType<typeof fixtures.createMockContext>;

	beforeEach(() => {
		mockContext = fixtures.createMockContext();
	});

	it('can be instantiated with a render context', () => {
		const dashboard = new Dashboard(mockContext);
		expect(dashboard).toBeInstanceOf(Dashboard);
	});

	it('has a render method', () => {
		const dashboard = new Dashboard(mockContext);
		expect(typeof dashboard.render).toBe('function');
	});

	it('render method returns a Promise', () => {
		const dashboard = new Dashboard(mockContext);
		const result = dashboard.render();
		expect(result).toBeInstanceOf(Promise);
	});
});

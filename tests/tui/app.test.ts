import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double. The factory only calls import()
// and closes over nothing, so it's safe under vi.mock's hoisting.
vi.mock('@opentui/core', async () => import('../fixtures/tui/opentui'));

import { TUI } from '../../src/tui/app';

describe('TUI', () => {
	let mockExit: any;

	beforeEach(() => {
		mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
	});

	afterEach(() => {
		mockExit.mockRestore();
	});

	it('can be instantiated without options', () => {
		const tui = new TUI();
		expect(tui).toBeInstanceOf(TUI);
	});

	it('can be instantiated with options', () => {
		const tui = new TUI({ startCommand: 'convert', args: ['test.csv'] });
		expect(tui).toBeInstanceOf(TUI);
	});

	it('has a start method', () => {
		const tui = new TUI();
		expect(typeof tui.start).toBe('function');
	});
});

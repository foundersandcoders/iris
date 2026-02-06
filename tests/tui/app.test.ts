import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TUI } from '../../src/tui/app';

vi.mock('@opentui/core', () => ({
	createCliRenderer: vi.fn().mockResolvedValue({
		root: { add: vi.fn(), remove: vi.fn() },
		keyInput: { on: vi.fn(), off: vi.fn() },
		start: vi.fn(),
		stop: vi.fn(),
	}),
}));

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

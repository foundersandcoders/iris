/** ====== History Screen Tests ====== */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HistoryScreen } from '../../../src/tui/screens/history';
import type { Renderer } from '../../../src/tui/types';

// Mock renderer following dashboard.test.ts pattern
function createMockRenderer(): Renderer {
	const handlers: Array<(key: { name: string }) => void> = [];
	const renderables: any[] = [];

	return {
		root: {
			add: vi.fn((renderable: any) => {
				renderables.push(renderable);
			}),
			remove: vi.fn(),
			getChildren: vi.fn(() => renderables),
		},
		keyInput: {
			on: vi.fn((event: string, handler: any) => {
				if (event === 'keypress') handlers.push(handler);
			}),
			off: vi.fn(),
		},
	} as unknown as Renderer;
}

describe('HistoryScreen', () => {
	let renderer: Renderer;
	let screen: HistoryScreen;

	beforeEach(() => {
		renderer = createMockRenderer();
		screen = new HistoryScreen({ renderer });
	});

	afterEach(() => {
		screen.cleanup();
	});

	it('instantiates without error', () => {
		expect(screen).toBeDefined();
		expect(screen.name).toBe('history');
	});

	it('render returns a Promise', () => {
		const result = screen.render();
		expect(result).toBeInstanceOf(Promise);
	});

	it('adds container to renderer on render', async () => {
		screen.render();
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(renderer.root.add).toHaveBeenCalled();
		const addedRenderable = (renderer.root.add as any).mock.calls[0][0];
		expect(addedRenderable.constructor.name).toBe('BoxRenderable');
	});

	it('registers keypress handler', async () => {
		screen.render();
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(renderer.keyInput.on).toHaveBeenCalledWith('keypress', expect.any(Function));
	});

	it('cleanup removes container and keypress handler', async () => {
		screen.render();
		await new Promise((resolve) => setTimeout(resolve, 10));

		screen.cleanup();

		expect(renderer.root.remove).toHaveBeenCalledWith('history-root');
		expect(renderer.keyInput.off).toHaveBeenCalled();
	});
});

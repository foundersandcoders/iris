import { vi } from 'vitest';
import type { Screen, ScreenResult } from '../../../src/tui/utils/router';
import type { RenderContext, Renderer } from '../../../src/tui/types';

/**
 * Mock OpenTUI renderer matching @opentui/core API
 */
export function createMockRenderer(): Renderer {
	const mockRoot = {
		add: vi.fn(),
		remove: vi.fn(),
	};

	const mockKeyInput = {
		on: vi.fn(),
		off: vi.fn(),
		once: vi.fn(),
		emit: vi.fn(),
		removeAllListeners: vi.fn(),
	};

	const mockInternalKeyInput = {
		on: vi.fn(),
		off: vi.fn(),
		once: vi.fn(),
		emit: vi.fn(),
		onInternal: vi.fn(),
		offInternal: vi.fn(),
		removeAllListeners: vi.fn(),
	};

	return {
		root: mockRoot,
		keyInput: mockKeyInput,
		_internalKeyInput: mockInternalKeyInput,
		start: vi.fn(),
		stop: vi.fn(),
		// RenderContext methods needed by renderables
		requestRender: vi.fn(),
		width: 80,
		height: 24,
		addToHitGrid: vi.fn(),
		pushHitGridScissorRect: vi.fn(),
		popHitGridScissorRect: vi.fn(),
		clearHitGridScissorRects: vi.fn(),
		setCursorPosition: vi.fn(),
		setCursorStyle: vi.fn(),
		setCursorColor: vi.fn(),
		widthMethod: 'wcwidth' as const,
		capabilities: null,
		requestLive: vi.fn(),
		dropLive: vi.fn(),
		hasSelection: false,
		getSelection: vi.fn().mockReturnValue(null),
		requestSelectionUpdate: vi.fn(),
		currentFocusedRenderable: null,
		focusRenderable: vi.fn(),
		registerLifecyclePass: vi.fn(),
		unregisterLifecyclePass: vi.fn(),
		getLifecyclePasses: vi.fn().mockReturnValue(new Set()),
		clearSelection: vi.fn(),
		startSelection: vi.fn(),
		updateSelection: vi.fn(),
		// EventEmitter methods
		on: vi.fn(),
		off: vi.fn(),
		once: vi.fn(),
		emit: vi.fn(),
		removeAllListeners: vi.fn(),
	} as unknown as Renderer;
}

/**
 * Create a mock RenderContext from a mock renderer
 */
export function createMockContext(renderer?: Renderer): RenderContext {
	return { renderer: renderer ?? createMockRenderer() };
}

/**
 * Mock screen for router testing
 */
export function createMockScreen(name: string, result: ScreenResult): Screen {
	return {
		name,
		render: vi.fn().mockResolvedValue(result),
		cleanup: vi.fn(),
	};
}

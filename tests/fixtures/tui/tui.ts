import { vi } from 'vitest';
import type { Screen, ScreenResult } from '../../../src/tui/utils/router';
import type { RenderContext, Renderer } from '../../../src/tui/types';
import type { ToastManager } from '../../../src/tui/utils/toastManager';

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
		setFrameCallback: vi.fn(),
		removeFrameCallback: vi.fn(),
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
export function createMockContext(renderer?: Renderer, toasts?: ToastManager): RenderContext {
	return { renderer: renderer ?? createMockRenderer(), toasts };
}

/**
 * Mock ToastManager — a spy object for screens that fire toasts, without
 * pulling in the real manager's layer/timer machinery.
 */
export function createMockToasts(): ToastManager {
	return {
		attach: vi.fn(),
		detach: vi.fn(),
		show: vi.fn(),
		success: vi.fn(),
		info: vi.fn(),
		warning: vi.fn(),
		error: vi.fn(),
		dismiss: vi.fn(),
		clear: vi.fn(),
		activeIds: vi.fn().mockReturnValue([]),
	} as unknown as ToastManager;
}

/**
 * Mock screen for router testing. `withRoot` opts into a transition target
 * (TR.C4) for tests exercising fadeIn(); omitted by default so the ~13
 * pre-existing router tests without it exercise the graceful-degradation
 * path (a screen with no root simply doesn't animate).
 */
export function createMockScreen(name: string, result: ScreenResult, withRoot = false): Screen {
	return {
		name,
		render: vi.fn().mockResolvedValue(result),
		cleanup: vi.fn(),
		...(withRoot ? { root: { opacity: 1 } } : {}),
	};
}

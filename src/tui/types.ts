/** ====== TUI Type Definitions ======
 * Shared types for OpenTUI-based TUI infrastructure
 */
import type { createCliRenderer } from '@opentui/core';
import type { ToastManager } from './utils/toastManager';

/** The OpenTUI renderer instance returned by createCliRenderer() */
export type Renderer = Awaited<ReturnType<typeof createCliRenderer>>;

/** Context passed to screen factories and screens */
export interface RenderContext {
	renderer: Renderer;
	/** Renderer-scoped toast layer. Optional: tests build bare contexts, and
	 *  only TUI.start() populates it. Deliberately NOT Keymap-owned — toasts
	 *  must outlive the screen that fired them (e.g. WorkflowScreen
	 *  replace()s on completion, tearing its Keymap down immediately). */
	toasts?: ToastManager;
}

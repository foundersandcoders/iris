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
	 *  only TUI.start() populates it. Deliberately NOT Keymap-owned: toasts
	 *  must outlive the screen that fired them (e.g. WorkflowScreen
	 *  replace()s on completion, tearing its Keymap down immediately). */
	toasts?: ToastManager;
	/** Whether screen transitions are enabled, false when reduceMotion is on
	 *  or the session is over SSH. Read once at Router construction; a
	 *  screen reads this once at buildUI() time to decide its initial
	 *  appShell opacity (0 to fade in, 1 to mount instantly). */
	motion?: boolean;
}

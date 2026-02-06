/** ====== TUI Type Definitions ======
 * Shared types for OpenTUI-based TUI infrastructure
 */
import type { createCliRenderer } from '@opentui/core';

/** The OpenTUI renderer instance returned by createCliRenderer() */
export type Renderer = Awaited<ReturnType<typeof createCliRenderer>>;

/** Context passed to screen factories and screens */
export interface RenderContext {
	renderer: Renderer;
}

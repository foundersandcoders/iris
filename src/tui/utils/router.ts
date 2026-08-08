/** ====== Screen Router ======
 * Manages navigation between TUI screens with stack-based history
 */
import type { RenderContext, Renderer } from '../types';
import type { ToastManager } from './toastManager';
import { createTransitions, type TransitionKind, type Transitions } from './transitions';

export type ScreenData = Record<string, unknown>;

export interface ScreenResult {
	/** Action */ action: 'push' | 'pop' | 'replace' | 'quit';
	/** Destination */ screen?: string;
	/** Payload */ data?: ScreenData;
}

export interface Screen {
	readonly name: string;
	render(data?: ScreenData): Promise<ScreenResult>;
	cleanup?(): void;
	/** Optional transition target for the fade-in (TR.C4) — the screen's
	 *  top-level renderable. Screens that omit this simply don't animate,
	 *  so this is purely additive: existing Screen implementations and
	 *  test doubles remain valid without change. */
	readonly root?: { opacity: number };
}

export type ScreenFactory = (ctx: RenderContext) => Screen;

interface StackEntry {
	screenName: string;
	data?: ScreenData;
}

export interface RouterOptions {
	/** Whether screen transitions are enabled. Default true — pass false for
	 *  reduceMotion or an SSH session. */
	motion?: boolean;
}

export class Router {
	private screens: Map<string, ScreenFactory> = new Map();
	private stack: StackEntry[] = [];
	private currentScreen: Screen | null = null;
	private ctx: RenderContext;
	private transitions: Transitions;

	constructor(renderer: Renderer, toasts?: ToastManager, opts: RouterOptions = {}) {
		const motion = opts.motion ?? true;
		this.ctx = { renderer, toasts, motion };
		this.transitions = createTransitions(renderer, motion);
	}

	register(name: string, factory: ScreenFactory): void {
		this.screens.set(name, factory);
	}

	/* Go Forwards */
	async push(screenName: string, data?: ScreenData): Promise<void> {
		const factory = this.screens.get(screenName);
		if (!factory) {
			throw new Error(`Screen not found: ${screenName}`);
		}

		// Cleanup current screen
		this.currentScreen?.cleanup?.();

		// Unwind rather than append when the target is already on the stack.
		// Palette cycling (A -> B -> A -> B) would otherwise grow the stack
		// without bound and turn getBreadcrumbs() into a repeating trail.
		// Truncating to the existing entry keeps the breadcrumbs a real path
		// and keeps ESC/back walking sensibly outwards. The new data wins
		// over the stale entry's payload, since truncate-then-push discards
		// the old entry entirely rather than reusing it in place.
		const existing = this.stack.findIndex((entry) => entry.screenName === screenName);
		if (existing !== -1) {
			this.stack.length = existing;
		}

		// Push to stack
		this.stack.push({ screenName, data });

		// Create and render new screen
		this.currentScreen = factory(this.ctx);
		await this.runScreen(data, 'push');
	}

	/* Go Backwards */
	async pop(data?: ScreenData): Promise<void> {
		if (this.stack.length <= 1) {
			return;
		}

		// Cleanup current screen
		this.currentScreen?.cleanup?.();

		// Pop current screen
		this.stack.pop();

		// Get previous screen
		const previous = this.stack[this.stack.length - 1];
		const factory = this.screens.get(previous.screenName);
		if (!factory) {
			throw new Error(`Screen not found: ${previous.screenName}`);
		}

		// Merge any returned data with original data
		const screenData = { ...previous.data, ...data };

		// Create and render previous screen
		this.currentScreen = factory(this.ctx);
		await this.runScreen(screenData, 'pop');
	}

	/* Go Sideways */
	async replace(screenName: string, data?: ScreenData): Promise<void> {
		const factory = this.screens.get(screenName);
		if (!factory) {
			throw new Error(`Screen not found: ${screenName}`);
		}

		// Cleanup current screen
		this.currentScreen?.cleanup?.();

		// Replace top of stack
		if (this.stack.length > 0) {
			this.stack[this.stack.length - 1] = { screenName, data };
		} else {
			this.stack.push({ screenName, data });
		}

		// Create and render new screen
		this.currentScreen = factory(this.ctx);
		await this.runScreen(data, 'replace');
	}

	getBreadcrumbs(): string[] {
		return this.stack.map((entry) => entry.screenName);
	}

	canGoBack(): boolean {
		return this.stack.length > 1;
	}

	private async runScreen(data?: ScreenData, kind: TransitionKind = 'push'): Promise<void> {
		if (!this.currentScreen) return;

		// Fired before awaiting render() (which resolves on user input, not on
		// mount) so the fade-in starts as soon as possible. transitions.fadeIn
		// tolerates currentScreen.root being undefined at this point — several
		// screens await storage I/O before buildUI() populates it — by polling
		// for it via a frame callback, bounded by its own deadline.
		this.transitions.fadeIn(kind, this.currentScreen);

		const result = await this.currentScreen.render(data);

		switch (result.action) {
			case 'push':
				if (result.screen) {
					await this.push(result.screen, result.data);
				}
				break;
			case 'pop':
				await this.pop(result.data);
				break;
			case 'replace':
				if (result.screen) {
					await this.replace(result.screen, result.data);
				}
				break;
			case 'quit':
				// Signal to exit - handled by TUI
				break;
		}
	}

	/** Detach the transitions engine. Call once at TUI teardown, before
	 *  renderer.destroy(). Idempotent (delegates to Transitions.dispose()). */
	dispose(): void {
		this.transitions.dispose();
	}
}

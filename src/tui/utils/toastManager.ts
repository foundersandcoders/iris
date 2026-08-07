/** ====== Toast Manager ======
 * Renderer-scoped, non-modal stacking layer for transient feedback toasts.
 * Constructed once in TUI.start() and threaded to screens via RenderContext
 * — deliberately NOT owned by a screen or its Keymap. Router.push/pop/replace
 * all call the outgoing screen's cleanup() before the next screen exists, and
 * WorkflowScreen always replace()s to a result screen on completion, so a
 * toast owned by the firing screen would die before the user ever sees it.
 * Being renderer-scoped, this layer outlives every screen transition.
 *
 * Layout: the stack layer is absolutely positioned but NOT full-screen —
 * unlike helpOverlay/confirmOverlay (which are modal, opaque, and cover the
 * whole terminal), this layer anchors to the bottom-right corner with
 * shouldFill:false and no width/height, so Yoga shrink-wraps it to the
 * stacked cards and screen content stays visible everywhere else. See
 * toast.ts for why the individual card IS opaque despite the layer not being.
 */
import { BoxRenderable } from '@opentui/core';
import type { Renderer } from '../types';
import { toast, type Toast, type ToastVariant } from '../components/toast';

export interface ToastManagerOptions {
	/** Layer id, used for renderer.root.remove(). Default 'toast-layer-root'. */
	id?: string;
	/** Paint order among renderer.root siblings. Default 200 — must exceed
	 *  the modal overlays' 100 so a toast stays readable while help/confirm
	 *  is open. */
	zIndex?: number;
	/** Auto-dismiss delay in ms. Default 3000. */
	duration?: number;
	/** Max simultaneously visible toasts; older ones are evicted. Default 3. */
	maxVisible?: number;
}

const DEFAULT_ID = 'toast-layer-root';
const DEFAULT_Z_INDEX = 200;
const DEFAULT_DURATION = 3000;
const DEFAULT_MAX_VISIBLE = 3;

export class ToastManager {
	private readonly renderer: Renderer;
	private readonly layerId: string;
	private readonly zIndex: number;
	private readonly duration: number;
	private readonly maxVisible: number;

	private layer?: BoxRenderable;
	private attached = false;
	private seq = 0;
	private readonly entries = new Map<string, Toast>();
	private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
	// Insertion order — the front is the oldest, and the eviction target.
	private readonly order: string[] = [];

	constructor(renderer: Renderer, opts: ToastManagerOptions = {}) {
		this.renderer = renderer;
		this.layerId = opts.id ?? DEFAULT_ID;
		this.zIndex = opts.zIndex ?? DEFAULT_Z_INDEX;
		this.duration = opts.duration ?? DEFAULT_DURATION;
		this.maxVisible = opts.maxVisible ?? DEFAULT_MAX_VISIBLE;
	}

	/** Mount the layer on renderer.root. Idempotent. Call once from TUI.start(). */
	attach(): void {
		if (this.attached) return;
		this.layer = new BoxRenderable(this.renderer, {
			id: this.layerId,
			position: 'absolute',
			// Anchor bottom-right and omit width/height so Yoga shrink-wraps to
			// content — do NOT copy the modal overlays' top:0/left:0/100%x100%,
			// which combined with a backgroundColor is exactly what blanks the
			// screen behind them.
			bottom: 1, // clear of the appShell footer keybar
			right: 2,
			// Load-bearing: BoxRenderable applies a default backgroundColor
			// regardless of whether one is passed, so shouldFill:false is the
			// only reliable way to guarantee the layer paints nothing of its
			// own. Belt and braces: backgroundColor is also never set below.
			shouldFill: false,
			flexDirection: 'column',
			alignItems: 'flex-end',
			zIndex: this.zIndex,
			visible: false,
		});
		this.renderer.root.add(this.layer);
		this.attached = true;
	}

	/** Unmount the layer and clear every pending timer. Call before renderer.destroy(). */
	detach(): void {
		this.clear();
		if (this.attached) {
			this.renderer.root.remove(this.layerId);
			this.attached = false;
			this.layer = undefined;
		}
	}

	/** Queue a toast. Returns a handle id so callers can dismiss it early. */
	show(message: string, variant?: ToastVariant, duration?: number): string {
		if (!this.layer) return '';

		if (this.order.length >= this.maxVisible) {
			const oldest = this.order[0];
			if (oldest) this.dismiss(oldest);
		}

		const id = `toast-${++this.seq}`;
		const t = toast(this.renderer, { id, message, variant });
		this.layer.add(t.root);
		this.entries.set(id, t);
		this.order.push(id);
		this.layer.visible = true;

		const handle = setTimeout(() => this.dismiss(id), duration ?? this.duration);
		this.timers.set(id, handle);

		return id;
	}

	success(message: string, duration?: number): string {
		return this.show(message, 'success', duration);
	}

	info(message: string, duration?: number): string {
		return this.show(message, 'info', duration);
	}

	warning(message: string, duration?: number): string {
		return this.show(message, 'warning', duration);
	}

	error(message: string, duration?: number): string {
		return this.show(message, 'error', duration);
	}

	/** Dismiss a specific toast early. Idempotent — an unknown id is a no-op,
	 *  so a manual dismiss racing its own timer is safe. */
	dismiss(id: string): void {
		const timer = this.timers.get(id);
		if (timer) {
			clearTimeout(timer);
			this.timers.delete(id);
		}
		if (!this.entries.has(id)) return;

		this.layer?.remove(id);
		this.entries.delete(id);
		const index = this.order.indexOf(id);
		if (index !== -1) this.order.splice(index, 1);

		if (this.entries.size === 0 && this.layer) this.layer.visible = false;
	}

	/** Dismiss everything and clear all timers. */
	clear(): void {
		for (const id of [...this.order]) this.dismiss(id);
	}

	/** Test/introspection hook — ids of currently mounted toasts, oldest first. */
	activeIds(): string[] {
		return [...this.order];
	}
}

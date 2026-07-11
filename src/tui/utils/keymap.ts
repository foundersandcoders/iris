/** ====== Keymap Registry ======
 * Declarative per-screen key bindings: normalisation, dispatch, keybar rendering,
 * and renderer attach/detach. Screens construct a Keymap inside render()'s Promise
 * so handlers can close over resolve(). The Keymap owns the keyInput wiring so
 * screens no longer hand-roll their own keypress listeners.
 */
import type { KeyEvent } from '@opentui/core';
import { symbols } from '../../../assets/brand/theme';
import type { Renderer } from '../types';
import { helpOverlay, type HelpOverlay, type HelpRow } from '../components/helpOverlay';
import { confirmOverlay, type ConfirmOverlay } from '../components/confirmOverlay';

/** A single declarative key binding. */
export interface Binding {
	/** Keys that trigger this binding (vim + arrow aliases welcome as extra entries).
	 *  Each token is matched case-insensitively after alias normalisation. */
	keys: string[];
	/** Human-readable label shown in the footer keybar. */
	label: string;
	/** Keybar display token; defaults to prettyKey(keys[0]).
	 *  Use to override a combined hint, e.g. "↑↓" for a navigation entry. */
	hint?: string;
	/** Guard — binding only matches and shows in the keybar when this returns true.
	 *  Defaults to always-active when omitted. */
	when?: () => boolean;
	/** Dispatches normally but is omitted from the footer keybar (e.g. number shortcuts). */
	hidden?: boolean;
	/** Action to run when matched. */
	handler: () => void;
}

/** Vim + arrow alias map — any member normalises to the representative key. */
const ALIASES: Record<string, string> = {
	j: 'down',
	down: 'down',
	k: 'up',
	up: 'up',
	h: 'left',
	left: 'left',
	l: 'right',
	right: 'right',
	return: 'enter',
	enter: 'enter',
};

/** Normalise a binding key token to its canonical form (lowercase, modifier-prefixed).
 *  e.g. "J" → "down", "ctrl+C" → "ctrl+c", "escape" → "escape". */
export function normaliseKey(token: string): string {
	const lower = token.toLowerCase();
	const match = lower.match(/^((?:ctrl|shift|meta|option)\+)?(.+)$/);
	if (!match) return lower;
	const [, mod = '', base] = match;
	return `${mod}${ALIASES[base] ?? base}`;
}

/** Normalise a live KeyEvent to the canonical key string for dispatch matching. */
export function eventToKey(key: KeyEvent): string {
	const base = (key.name ?? key.sequence ?? '').toLowerCase();
	const mods =
		(key.ctrl ? 'ctrl+' : '') +
		(key.meta ? 'meta+' : '') +
		(key.option ? 'option+' : '') +
		// shift prefix only for named keys; printable shifted chars arrive pre-cased
		(key.shift && base.length > 1 ? 'shift+' : '');
	return `${mods}${ALIASES[base] ?? base}`;
}

export interface KeymapOptions {
	/** Per-screen bindings. Screen bindings take priority over globals. */
	bindings: Binding[];
	/** Canonical key strings to suppress from the auto-generated globals.
	 *  Include "?" to opt a screen out of the help overlay entirely. */
	disableGlobals?: string[];
	/** Handler for "q" — typically resolves quit. Omit on screens where q means back. */
	onQuit?: () => void;
	/** Handler for "escape" — typically resolves pop/back. */
	onBack?: () => void;
}

const HELP_OVERLAY_ID = 'help-overlay-root';
const CONFIRM_OVERLAY_ID = 'confirm-overlay-root';

export class Keymap {
	private readonly bindings: Binding[];
	private readonly helpEnabled: boolean;
	private attachedHandler?: (key: KeyEvent) => void;
	private helpOverlay?: HelpOverlay;
	private helpOpen = false;
	private confirmOverlay?: ConfirmOverlay;
	private confirmOpen = false;
	private confirmResolver?: (ok: boolean) => void;

	constructor(opts: KeymapOptions) {
		this.helpEnabled = !(opts.disableGlobals ?? []).includes('?');
		this.bindings = [
			...opts.bindings,
			...buildGlobals(opts),
			...(this.helpEnabled
				? [{ keys: ['?'], hint: '?', label: 'Help', handler: () => this.toggleHelp() } as Binding]
				: []),
		];
	}

	/** Find the first matching, when-passing binding and run its handler.
	 *  Returns the binding that fired, or null if none matched.
	 *  Pure and synchronous — useful for unit testing dispatch logic.
	 *  While the help overlay is open, every key is swallowed except "?"/"escape"
	 *  (which close it) — no fall-through to other bindings (e.g. "q" won't quit).
	 *  stopPropagation() is load-bearing here: this handler runs as a "global"
	 *  listener on the shared InternalKeyHandler, ahead of the focused
	 *  renderable's own keypress handler (e.g. SelectRenderable's arrow-key
	 *  navigation) — without it, arrow/enter keys would still reach the
	 *  renderable underneath the overlay even though dispatch() ignored them. */
	dispatch(key: KeyEvent): Binding | null {
		const k = eventToKey(key);

		if (this.confirmOpen) {
			key.stopPropagation?.();
			if (k === 'y' || k === 'enter') this.resolveConfirm(true);
			else if (k === 'n' || k === 'escape') this.resolveConfirm(false);
			return null;
		}

		if (this.helpOpen) {
			key.stopPropagation?.();
			if (k === '?' || k === 'escape') this.closeHelp();
			return null;
		}

		for (const binding of this.bindings) {
			if (
				(binding.when?.() ?? true) &&
				binding.keys.some((kk) => normaliseKey(kk) === k)
			) {
				binding.handler();
				return binding;
			}
		}
		return null;
	}

	/** Build the footer hint string from visible, when-passing bindings.
	 *  Format: "[KEY] Label  [KEY] Label" (double-space separator).
	 *  Re-evaluates when() each call — call after state changes for a live bar. */
	toKeybar(): string {
		return this.bindings
			.filter((b) => !b.hidden && (b.when?.() ?? true))
			.map((b) => `[${b.hint ?? prettyKey(b.keys[0])}] ${b.label}`)
			.join('  ');
	}

	/** Display-ready shortcut rows for the help overlay: visible, when-passing
	 *  bindings, excluding the Help entry itself. */
	toHelp(): HelpRow[] {
		return this.bindings
			.filter((b) => !b.hidden && (b.when?.() ?? true) && !b.keys.includes('?'))
			.map((b) => ({ keys: b.hint ?? prettyKey(b.keys[0]), label: b.label }));
	}

	private toggleHelp(): void {
		if (this.helpOpen) this.closeHelp();
		else this.openHelp();
	}

	private openHelp(): void {
		if (!this.helpOverlay) return;
		this.helpOverlay.setRows(this.toHelp());
		this.helpOverlay.setVisible(true);
		this.helpOpen = true;
	}

	private closeHelp(): void {
		this.helpOverlay?.setVisible(false);
		this.helpOpen = false;
	}

	/** Show a confirm modal with the given message. Resolves true on y/Enter,
	 *  false on n/Esc. Only one confirm can be pending at a time — a second
	 *  call before the first resolves replaces the message on the same overlay. */
	confirm(message: string): Promise<boolean> {
		return new Promise((resolve) => {
			this.confirmResolver = resolve;
			this.confirmOverlay?.setMessage(message);
			this.confirmOverlay?.setVisible(true);
			this.confirmOpen = true;
		});
	}

	private resolveConfirm(ok: boolean): void {
		this.confirmOverlay?.setVisible(false);
		this.confirmOpen = false;
		const resolver = this.confirmResolver;
		this.confirmResolver = undefined;
		resolver?.(ok);
	}

	/** Register the keypress listener on the renderer. Call inside render().
	 *  Idempotent — a prior listener is removed before registering the new one. */
	attach(renderer: Renderer): void {
		if (this.attachedHandler) this.detach(renderer);
		if (this.helpEnabled && !this.helpOverlay) {
			this.helpOverlay = helpOverlay(renderer, { id: HELP_OVERLAY_ID });
			renderer.root.add(this.helpOverlay.root);
		}
		if (!this.confirmOverlay) {
			this.confirmOverlay = confirmOverlay(renderer, { id: CONFIRM_OVERLAY_ID });
			renderer.root.add(this.confirmOverlay.root);
		}
		this.attachedHandler = (key) => this.dispatch(key);
		renderer.keyInput.on('keypress', this.attachedHandler);
	}

	/** Remove the keypress listener and the overlays. Call inside cleanup(). */
	detach(renderer: Renderer): void {
		if (this.attachedHandler) {
			renderer.keyInput.off('keypress', this.attachedHandler);
			this.attachedHandler = undefined;
		}
		if (this.helpOverlay) {
			renderer.root.remove(HELP_OVERLAY_ID);
			this.helpOverlay = undefined;
			this.helpOpen = false;
		}
		if (this.confirmOverlay) {
			if (this.confirmOpen) this.resolveConfirm(false);
			renderer.root.remove(CONFIRM_OVERLAY_ID);
			this.confirmOverlay = undefined;
		}
	}
}

function buildGlobals(opts: KeymapOptions): Binding[] {
	const suppressed = new Set(opts.disableGlobals ?? []);
	const globals: Binding[] = [];

	if (opts.onBack && !suppressed.has('escape')) {
		globals.push({ keys: ['escape'], hint: 'ESC', label: 'Back', handler: opts.onBack });
	}
	if (opts.onQuit && !suppressed.has('q')) {
		globals.push({ keys: ['q'], hint: 'q', label: 'Quit', handler: opts.onQuit });
	}
	// Ctrl+C deliberately omitted — createCliRenderer({ exitOnCtrlC: true }) handles it.
	// "?" Help is appended separately in the constructor (self-wired, TR.C1).

	return globals;
}

const KEY_LABELS: Record<string, string> = {
	up: symbols.arrows.up,
	down: symbols.arrows.down,
	left: symbols.arrows.left,
	right: symbols.arrows.right,
	escape: 'ESC',
	enter: 'ENTER',
};

function prettyKey(token: string): string {
	const canonical = normaliseKey(token);
	return KEY_LABELS[canonical] ?? token;
}

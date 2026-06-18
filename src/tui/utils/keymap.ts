/** ====== Keymap Registry ======
 * Declarative per-screen key bindings: normalisation, dispatch, keybar rendering,
 * and renderer attach/detach. Screens construct a Keymap inside render()'s Promise
 * so handlers can close over resolve(). The Keymap owns the keyInput wiring so
 * screens no longer hand-roll their own keypress listeners.
 */
import type { KeyEvent } from '@opentui/core';
import { symbols } from '../../../brand/theme';
import type { Renderer } from '../types';

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
	/** Canonical key strings to suppress from the auto-generated globals. */
	disableGlobals?: string[];
	/** Handler for "?" — wired to the help overlay (TR.C1). No-op if omitted. */
	onHelp?: () => void;
	/** Handler for "q" — typically resolves quit. Omit on screens where q means back. */
	onQuit?: () => void;
	/** Handler for "escape" — typically resolves pop/back. */
	onBack?: () => void;
}

export class Keymap {
	private readonly bindings: Binding[];
	private attachedHandler?: (key: KeyEvent) => void;

	constructor(opts: KeymapOptions) {
		this.bindings = [...opts.bindings, ...buildGlobals(opts)];
	}

	/** Find the first matching, when-passing binding and run its handler.
	 *  Returns the binding that fired, or null if none matched.
	 *  Pure and synchronous — useful for unit testing dispatch logic. */
	dispatch(key: KeyEvent): Binding | null {
		const k = eventToKey(key);
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

	/** Register the keypress listener on the renderer. Call inside render(). */
	attach(renderer: Renderer): void {
		this.attachedHandler = (key) => this.dispatch(key);
		renderer.keyInput.on('keypress', this.attachedHandler);
	}

	/** Remove the keypress listener. Call inside cleanup(). */
	detach(renderer: Renderer): void {
		if (this.attachedHandler) {
			renderer.keyInput.off('keypress', this.attachedHandler);
			this.attachedHandler = undefined;
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
	if (opts.onHelp && !suppressed.has('?')) {
		globals.push({ keys: ['?'], hint: '?', label: 'Help', handler: opts.onHelp });
	}
	// Ctrl+C deliberately omitted — createCliRenderer({ exitOnCtrlC: true }) handles it.

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

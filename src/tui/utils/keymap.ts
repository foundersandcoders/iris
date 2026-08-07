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
import { commandPalette, type CommandPalette, type PaletteEntry } from '../components/commandPalette';
import { fuzzyFilter } from './fuzzy';

/** Screens safe to jump to from the command palette (TR.D1) with no data
 *  payload. Deliberately excludes file-picker, workflow, success,
 *  validation-explorer, check-results and mapping-save — those are
 *  mid-workflow screens that require a payload to render meaningfully (e.g.
 *  `workflow` self-pops without a file path). An explicit list rather than
 *  filtering the router's screen registry, since the registry has no
 *  concept of "safe with no data". */
export const PALETTE_SCREENS: PaletteEntry[] = [
	{ screen: 'dashboard', label: 'Dashboard' },
	{ screen: 'mapping-builder', label: 'Mapping Builder' },
	{ screen: 'mapping-editor', label: 'Mapping Editor' },
	{ screen: 'settings', label: 'Settings' },
	{ screen: 'about', label: 'About' },
	{ screen: 'history', label: 'History' },
];

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
	/** Jump-target screens for the command palette (TR.D1), keyed by route
	 *  name. Supplying this opts the screen into the ctrl+p binding; the
	 *  palette fuzzy-filters entries.values() by label as the user types.
	 *  Omit to leave the screen without a palette (e.g. mid-workflow
	 *  screens with no safe no-payload jump target). */
	paletteEntries?: PaletteEntry[];
	/** Called when the user picks a palette entry (Enter). Typically
	 *  resolves the screen's render() promise with a push action. Ignored
	 *  if paletteEntries is omitted. */
	onCommand?: (screen: string) => void;
}

const HELP_OVERLAY_ID = 'help-overlay-root';
const CONFIRM_OVERLAY_ID = 'confirm-overlay-root';
const PALETTE_OVERLAY_ID = 'command-palette-root';

export class Keymap {
	private readonly bindings: Binding[];
	private readonly helpEnabled: boolean;
	private attachedHandler?: (key: KeyEvent) => void;
	private helpOverlay?: HelpOverlay;
	private helpOpen = false;
	private confirmOverlay?: ConfirmOverlay;
	private confirmOpen = false;
	private confirmResolver?: (ok: boolean) => void;
	private readonly paletteEntries: PaletteEntry[];
	private readonly onCommand?: (screen: string) => void;
	private paletteOverlay?: CommandPalette;
	private paletteOpen = false;
	private paletteQuery = '';

	constructor(opts: KeymapOptions) {
		this.helpEnabled = !(opts.disableGlobals ?? []).includes('?');
		this.paletteEntries = opts.paletteEntries ?? [];
		this.onCommand = opts.onCommand;
		const paletteEnabled =
			this.paletteEntries.length > 0 && !!this.onCommand && !(opts.disableGlobals ?? []).includes('ctrl+p');
		this.bindings = [
			...opts.bindings,
			...buildGlobals(opts),
			...(this.helpEnabled
				? [{ keys: ['?'], hint: '?', label: 'Help', handler: () => this.toggleHelp() } as Binding]
				: []),
			...(paletteEnabled
				? [
						{
							keys: ['ctrl+p'],
							hint: 'ctrl+p',
							label: 'Jump',
							handler: () => this.openPalette(),
						} as Binding,
					]
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

		// Palette first — it's the newest/topmost modal; none of the others
		// can be open beneath it (openPalette() only fires from a normal
		// binding, never while confirm/help are open).
		if (this.paletteOpen) {
			key.stopPropagation?.();
			if (k === 'escape') {
				this.closePalette();
			} else if (k === 'enter') {
				this.commitPalette();
			} else if (k === 'up') {
				this.paletteOverlay?.moveSelection(-1);
			} else if (k === 'down') {
				this.paletteOverlay?.moveSelection(1);
			} else if (k === 'backspace') {
				this.setPaletteQuery(this.paletteQuery.slice(0, -1));
			} else if (isPrintable(key)) {
				this.setPaletteQuery(this.paletteQuery + (key.sequence ?? ''));
			}
			return null;
		}

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

	private openPalette(): void {
		if (!this.paletteOverlay) return;
		this.paletteQuery = '';
		this.paletteOverlay.setQuery('');
		this.paletteOverlay.setEntries(this.paletteEntries);
		this.paletteOverlay.setVisible(true);
		this.paletteOpen = true;
	}

	private closePalette(): void {
		this.paletteOverlay?.setVisible(false);
		this.paletteOpen = false;
		this.paletteQuery = '';
	}

	private setPaletteQuery(query: string): void {
		this.paletteQuery = query;
		this.paletteOverlay?.setQuery(query);
		this.paletteOverlay?.setEntries(fuzzyFilter(query, this.paletteEntries, (entry) => entry.label));
	}

	/** Fire onCommand with the selected entry's screen and close. A no-op if
	 *  the filtered list is empty (nothing selected) — Enter on an empty
	 *  result list does nothing, matching an empty dropdown/select. */
	private commitPalette(): void {
		const selected = this.paletteOverlay?.getSelected();
		this.closePalette();
		if (selected) this.onCommand?.(selected.screen);
	}

	/** Show a confirm modal with the given message. Resolves true on y/Enter,
	 *  false on n/Esc. Only one confirm can be pending at a time — a second
	 *  call before the first resolves replaces the message on the same overlay,
	 *  resolving the superseded promise false so it never dangles. */
	confirm(message: string): Promise<boolean> {
		return new Promise((resolve) => {
			this.confirmResolver?.(false);
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
		if (this.paletteEntries.length > 0 && this.onCommand && !this.paletteOverlay) {
			this.paletteOverlay = commandPalette(renderer, { id: PALETTE_OVERLAY_ID });
			renderer.root.add(this.paletteOverlay.root);
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
		if (this.paletteOverlay) {
			renderer.root.remove(PALETTE_OVERLAY_ID);
			this.paletteOverlay = undefined;
			this.paletteOpen = false;
			this.paletteQuery = '';
		}
	}
}

/** A single, non-modifier, non-control printable character — the palette
 *  query accepts these and nothing else. Rejects multi-character sequences
 *  (e.g. arrow-key escape codes that slip through as `sequence`) and
 *  control characters below 0x20 (Tab, Enter's own \r, etc — Enter/Escape/
 *  Backspace are handled explicitly before this check ever runs). */
function isPrintable(key: KeyEvent): boolean {
	if (key.ctrl || key.meta || key.option) return false;
	const seq = key.sequence;
	if (!seq || seq.length !== 1) return false;
	return seq.charCodeAt(0) >= 0x20;
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

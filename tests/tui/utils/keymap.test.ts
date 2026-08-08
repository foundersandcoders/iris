import { describe, it, expect, vi } from 'vitest';

// keymap.ts imports assets/brand/theme, which has a concrete @opentui/core
// import (RGBA) — see tests/fixtures/tui/opentui.ts for why the real package
// can't load under vitest.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

import { normaliseKey, eventToKey, Keymap, paletteNav, PALETTE_SCREENS } from '../../../src/tui/utils/keymap';
import type { KeyEvent } from '@opentui/core';
import * as fixtures from '../../fixtures/tui/tui';
import * as paletteFixtures from '../../fixtures/tui/palette';

// ——— normaliseKey ————————————————————————————————————————————————————————————

describe('normaliseKey()', () => {
	it('lowercases plain keys', () => {
		expect(normaliseKey('Q')).toBe('q');
		expect(normaliseKey('Escape')).toBe('escape');
	});

	it('maps vim aliases to their canonical direction key', () => {
		expect(normaliseKey('j')).toBe('down');
		expect(normaliseKey('k')).toBe('up');
		expect(normaliseKey('h')).toBe('left');
		expect(normaliseKey('l')).toBe('right');
		expect(normaliseKey('J')).toBe('down');
		expect(normaliseKey('K')).toBe('up');
	});

	it('maps "down"/"up"/"left"/"right" to themselves', () => {
		expect(normaliseKey('down')).toBe('down');
		expect(normaliseKey('up')).toBe('up');
		expect(normaliseKey('left')).toBe('left');
		expect(normaliseKey('right')).toBe('right');
	});

	it('maps "return" to "enter"', () => {
		expect(normaliseKey('return')).toBe('enter');
	});

	it('preserves modifier prefixes and aliases the base key', () => {
		expect(normaliseKey('ctrl+c')).toBe('ctrl+c');
		expect(normaliseKey('ctrl+C')).toBe('ctrl+c');
		expect(normaliseKey('shift+tab')).toBe('shift+tab');
	});
});

// ——— eventToKey ——————————————————————————————————————————————————————————————

function makeKey(overrides: Partial<KeyEvent> = {}): KeyEvent {
	return {
		name: '',
		sequence: '',
		ctrl: false,
		meta: false,
		shift: false,
		option: false,
		number: undefined,
		preventDefault: () => {},
		stopPropagation: () => {},
		...overrides,
	} as KeyEvent;
}

describe('eventToKey()', () => {
	it('normalises a down arrow event', () => {
		expect(eventToKey(makeKey({ name: 'down' }))).toBe('down');
	});

	it('produces the same canonical key for "j" and "down" events', () => {
		expect(eventToKey(makeKey({ name: 'j' }))).toBe(eventToKey(makeKey({ name: 'down' })));
	});

	it('produces the same canonical key for "k" and "up"', () => {
		expect(eventToKey(makeKey({ name: 'k' }))).toBe(eventToKey(makeKey({ name: 'up' })));
	});

	it('prefixes ctrl modifier', () => {
		expect(eventToKey(makeKey({ name: 'c', ctrl: true }))).toBe('ctrl+c');
	});

	it('does not double-prefix when name is already multi-char', () => {
		expect(eventToKey(makeKey({ name: 'escape' }))).toBe('escape');
	});
});

// ——— Keymap — dispatch ————————————————————————————————————————————————————————

describe('Keymap.dispatch()', () => {
	it('runs the handler and returns the matching binding', () => {
		const handler = vi.fn();
		const km = new Keymap({ bindings: [{ keys: ['q'], label: 'Quit', handler }] });
		const result = km.dispatch(makeKey({ name: 'q' }));
		expect(handler).toHaveBeenCalledOnce();
		expect(result?.label).toBe('Quit');
	});

	it('returns null when no binding matches', () => {
		const km = new Keymap({ bindings: [] });
		expect(km.dispatch(makeKey({ name: 'x' }))).toBeNull();
	});

	it('skips a binding whose when() returns false', () => {
		const handler = vi.fn();
		const km = new Keymap({
			bindings: [{ keys: ['q'], label: 'Quit', when: () => false, handler }],
		});
		expect(km.dispatch(makeKey({ name: 'q' }))).toBeNull();
		expect(handler).not.toHaveBeenCalled();
	});

	it('first-match-wins: screen binding overrides a global with the same key', () => {
		const screenHandler = vi.fn();
		const globalHandler = vi.fn();
		const km = new Keymap({
			bindings: [{ keys: ['q'], label: 'Custom', handler: screenHandler }],
			onQuit: globalHandler,
		});
		km.dispatch(makeKey({ name: 'q' }));
		expect(screenHandler).toHaveBeenCalledOnce();
		expect(globalHandler).not.toHaveBeenCalled();
	});

	it('matches vim aliases — "j" triggers a "down" binding', () => {
		const handler = vi.fn();
		const km = new Keymap({ bindings: [{ keys: ['down', 'j'], label: 'Nav', handler }] });
		km.dispatch(makeKey({ name: 'j' }));
		expect(handler).toHaveBeenCalledOnce();
	});

	it('Ctrl+C is not a built-in binding (handled by renderer)', () => {
		const km = new Keymap({ bindings: [], onQuit: vi.fn(), onBack: vi.fn() });
		const result = km.dispatch(makeKey({ name: 'c', ctrl: true }));
		expect(result).toBeNull();
	});
});

// ——— Keymap — toKeybar ———————————————————————————————————————————————————————

describe('Keymap.toKeybar()', () => {
	it('produces "[KEY] Label  [KEY] Label" format with double-space separator', () => {
		const km = new Keymap({
			bindings: [
				{ keys: ['up'], label: 'Select', handler: vi.fn() },
				{ keys: ['enter'], label: 'Confirm', handler: vi.fn() },
			],
			disableGlobals: ['?'], // isolate the format assertion from the auto Help entry
		});
		expect(km.toKeybar()).toBe('[↑] Select  [ENTER] Confirm');
	});

	it('omits hidden bindings', () => {
		const km = new Keymap({
			bindings: [
				{ keys: ['1'], label: 'One', hidden: true, handler: vi.fn() },
				{ keys: ['q'], label: 'Quit', handler: vi.fn() },
			],
		});
		expect(km.toKeybar()).not.toContain('One');
		expect(km.toKeybar()).toContain('Quit');
	});

	it('omits bindings whose when() returns false', () => {
		const km = new Keymap({
			bindings: [
				{ keys: ['s'], label: 'Save', when: () => false, handler: vi.fn() },
				{ keys: ['q'], label: 'Quit', handler: vi.fn() },
			],
		});
		expect(km.toKeybar()).not.toContain('Save');
		expect(km.toKeybar()).toContain('Quit');
	});

	it('uses the hint override instead of prettyKey(keys[0])', () => {
		const km = new Keymap({
			bindings: [{ keys: ['up', 'down'], hint: '↑↓', label: 'Navigate', handler: vi.fn() }],
		});
		expect(km.toKeybar()).toContain('[↑↓] Navigate');
	});

	it('appends globals only when their callbacks are supplied', () => {
		const km = new Keymap({ bindings: [], onQuit: vi.fn() });
		expect(km.toKeybar()).toContain('Quit');
		expect(km.toKeybar()).not.toContain('Back');
	});

	it('includes Help by default — the overlay is automatic on every screen', () => {
		const km = new Keymap({ bindings: [] });
		expect(km.toKeybar()).toContain('[?] Help');
	});

	it('omits Help when "?" is suppressed via disableGlobals', () => {
		const km = new Keymap({ bindings: [], disableGlobals: ['?'] });
		expect(km.toKeybar()).not.toContain('Help');
	});

	it('re-evaluates when() on each call for live keybar updates', () => {
		let visible = false;
		const km = new Keymap({
			bindings: [{ keys: ['s'], label: 'Save', when: () => visible, handler: vi.fn() }],
			disableGlobals: ['?'], // isolate the when() assertion from the auto Help entry
		});
		expect(km.toKeybar()).toBe('');
		visible = true;
		expect(km.toKeybar()).toContain('Save');
	});
});

// ——— Keymap — toHelp —————————————————————————————————————————————————————————

describe('Keymap.toHelp()', () => {
	it('returns display rows for visible bindings', () => {
		const km = new Keymap({
			bindings: [{ keys: ['up'], label: 'Select', handler: vi.fn() }],
		});
		expect(km.toHelp()).toContainEqual({ keys: '↑', label: 'Select' });
	});

	it('omits hidden bindings', () => {
		const km = new Keymap({
			bindings: [{ keys: ['1'], label: 'One', hidden: true, handler: vi.fn() }],
		});
		expect(km.toHelp()).toEqual([]);
	});

	it('omits bindings whose when() returns false', () => {
		const km = new Keymap({
			bindings: [{ keys: ['s'], label: 'Save', when: () => false, handler: vi.fn() }],
		});
		expect(km.toHelp()).toEqual([]);
	});

	it('excludes the auto Help entry itself', () => {
		const km = new Keymap({ bindings: [] });
		expect(km.toHelp().some((row) => row.label === 'Help')).toBe(false);
	});

	it('uses the hint override instead of prettyKey(keys[0])', () => {
		const km = new Keymap({
			bindings: [{ keys: ['up', 'down'], hint: '↑↓', label: 'Navigate', handler: vi.fn() }],
		});
		expect(km.toHelp()).toContainEqual({ keys: '↑↓', label: 'Navigate' });
	});

	it('renders ENTER and ESC glyphs via prettyKey', () => {
		const km = new Keymap({
			bindings: [{ keys: ['enter'], label: 'Confirm', handler: vi.fn() }],
			onBack: vi.fn(),
		});
		expect(km.toHelp()).toContainEqual({ keys: 'ENTER', label: 'Confirm' });
		expect(km.toHelp()).toContainEqual({ keys: 'ESC', label: 'Back' });
	});
});

// ——— Keymap — attach / detach ————————————————————————————————————————————————

describe('Keymap.attach() / detach()', () => {
	it('registers a keypress listener on attach', () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [] });
		km.attach(ctx.renderer);
		expect(ctx.renderer.keyInput.on).toHaveBeenCalledWith('keypress', expect.any(Function));
	});

	it('removes the keypress listener on detach', () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [] });
		km.attach(ctx.renderer);
		km.detach(ctx.renderer);
		expect(ctx.renderer.keyInput.off).toHaveBeenCalledWith('keypress', expect.any(Function));
	});

	it('detach is a no-op if attach was never called', () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [] });
		expect(() => km.detach(ctx.renderer)).not.toThrow();
	});

	it('attach is idempotent — re-attaching removes the previous listener first', () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [] });
		km.attach(ctx.renderer);
		km.attach(ctx.renderer);
		// The second attach() must have called off() to remove the stale handler
		expect(ctx.renderer.keyInput.off).toHaveBeenCalledWith('keypress', expect.any(Function));
		// Two on() calls — one per attach()
		expect(ctx.renderer.keyInput.on).toHaveBeenCalledTimes(2);
	});

	it('mounts the help overlay on renderer.root on attach', () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [] });
		km.attach(ctx.renderer);
		expect(ctx.renderer.root.add).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'help-overlay-root' })
		);
	});

	it('removes the help overlay from renderer.root on detach', () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [] });
		km.attach(ctx.renderer);
		km.detach(ctx.renderer);
		expect(ctx.renderer.root.remove).toHaveBeenCalledWith('help-overlay-root');
	});

	it('does not mount the help overlay when "?" is suppressed', () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [], disableGlobals: ['?'] });
		km.attach(ctx.renderer);
		expect(ctx.renderer.root.add).not.toHaveBeenCalledWith(
			expect.objectContaining({ id: 'help-overlay-root' })
		);
	});

	it('mounts the confirm overlay on renderer.root on attach, regardless of disableGlobals', () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [], disableGlobals: ['?'] });
		km.attach(ctx.renderer);
		expect(ctx.renderer.root.add).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'confirm-overlay-root' })
		);
	});

	it('removes the confirm overlay from renderer.root on detach', () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [] });
		km.attach(ctx.renderer);
		km.detach(ctx.renderer);
		expect(ctx.renderer.root.remove).toHaveBeenCalledWith('confirm-overlay-root');
	});
});

// ——— Keymap — help overlay toggling —————————————————————————————————————————

describe('Keymap help overlay', () => {
	it('"?" opens the overlay; an unrelated key is swallowed while open', () => {
		const ctx = fixtures.createMockContext();
		const handler = vi.fn();
		const km = new Keymap({ bindings: [{ keys: ['enter'], label: 'Confirm', handler }] });
		km.attach(ctx.renderer);

		expect(km.dispatch(makeKey({ name: '?' }))?.label).toBe('Help');
		expect(km.dispatch(makeKey({ name: 'enter' }))).toBeNull();
		expect(handler).not.toHaveBeenCalled();
	});

	it('"?" again closes the overlay and dispatch resumes normally', () => {
		const ctx = fixtures.createMockContext();
		const handler = vi.fn();
		const km = new Keymap({ bindings: [{ keys: ['enter'], label: 'Confirm', handler }] });
		km.attach(ctx.renderer);

		km.dispatch(makeKey({ name: '?' })); // open
		km.dispatch(makeKey({ name: '?' })); // close
		km.dispatch(makeKey({ name: 'enter' }));
		expect(handler).toHaveBeenCalledOnce();
	});

	it('"escape" closes the overlay', () => {
		const ctx = fixtures.createMockContext();
		const handler = vi.fn();
		const km = new Keymap({ bindings: [{ keys: ['enter'], label: 'Confirm', handler }] });
		km.attach(ctx.renderer);

		km.dispatch(makeKey({ name: '?' })); // open
		km.dispatch(makeKey({ name: 'escape' })); // close
		km.dispatch(makeKey({ name: 'enter' }));
		expect(handler).toHaveBeenCalledOnce();
	});

	it('"q" is swallowed while open and does not fall through to onQuit', () => {
		const ctx = fixtures.createMockContext();
		const onQuit = vi.fn();
		const km = new Keymap({ bindings: [], onQuit });
		km.attach(ctx.renderer);

		km.dispatch(makeKey({ name: '?' })); // open
		expect(km.dispatch(makeKey({ name: 'q' }))).toBeNull();
		expect(onQuit).not.toHaveBeenCalled();
	});

	it('stops propagation while open, so a focused renderable (e.g. SelectRenderable) never sees the key', () => {
		// Keymap.attach() registers on the shared InternalKeyHandler as a "global"
		// listener, which runs BEFORE the focused renderable's own keypress
		// handler — but only stopPropagation() actually prevents that handler
		// from firing too. Without it, arrow/enter keys would reach the
		// renderable underneath the overlay even though dispatch() ignored them.
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [] });
		km.attach(ctx.renderer);
		km.dispatch(makeKey({ name: '?' })); // open

		const stopPropagation = vi.fn();
		km.dispatch(makeKey({ name: 'down', stopPropagation }));
		expect(stopPropagation).toHaveBeenCalledOnce();
	});

	it('does not stop propagation once closed — normal dispatch is unaffected', () => {
		const ctx = fixtures.createMockContext();
		const handler = vi.fn();
		const km = new Keymap({ bindings: [{ keys: ['enter'], label: 'Confirm', handler }] });
		km.attach(ctx.renderer);
		km.dispatch(makeKey({ name: '?' })); // open
		km.dispatch(makeKey({ name: '?' })); // close

		const stopPropagation = vi.fn();
		km.dispatch(makeKey({ name: 'enter', stopPropagation }));
		expect(stopPropagation).not.toHaveBeenCalled();
		expect(handler).toHaveBeenCalledOnce();
	});
});

// ——— Keymap — confirm overlay ————————————————————————————————————————————————

describe('Keymap confirm overlay', () => {
	it('confirm() shows the overlay and returns a pending promise', async () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [] });
		km.attach(ctx.renderer);

		let settled = false;
		km.confirm('Delete this?').then(() => {
			settled = true;
		});

		expect(settled).toBe(false);
	});

	it('"y" resolves the confirm promise true', async () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [] });
		km.attach(ctx.renderer);

		const promise = km.confirm('Delete this?');
		km.dispatch(makeKey({ name: 'y' }));
		await expect(promise).resolves.toBe(true);
	});

	it('"enter" resolves the confirm promise true', async () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [] });
		km.attach(ctx.renderer);

		const promise = km.confirm('Delete this?');
		km.dispatch(makeKey({ name: 'enter' }));
		await expect(promise).resolves.toBe(true);
	});

	it('"n" resolves the confirm promise false', async () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [] });
		km.attach(ctx.renderer);

		const promise = km.confirm('Delete this?');
		km.dispatch(makeKey({ name: 'n' }));
		await expect(promise).resolves.toBe(false);
	});

	it('"escape" resolves the confirm promise false', async () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [] });
		km.attach(ctx.renderer);

		const promise = km.confirm('Delete this?');
		km.dispatch(makeKey({ name: 'escape' }));
		await expect(promise).resolves.toBe(false);
	});

	it('swallows unrelated keys while a confirm is open — no fall-through to other bindings', () => {
		const ctx = fixtures.createMockContext();
		const handler = vi.fn();
		const km = new Keymap({ bindings: [{ keys: ['enter'], label: 'Confirm', handler }] });
		km.attach(ctx.renderer);

		km.confirm('Delete this?');
		expect(km.dispatch(makeKey({ name: 'x' }))).toBeNull();
	});

	it('"q" is swallowed while a confirm is open and does not fall through to onQuit', () => {
		const ctx = fixtures.createMockContext();
		const onQuit = vi.fn();
		const km = new Keymap({ bindings: [], onQuit });
		km.attach(ctx.renderer);

		km.confirm('Delete this?');
		expect(km.dispatch(makeKey({ name: 'q' }))).toBeNull();
		expect(onQuit).not.toHaveBeenCalled();
	});

	it('stops propagation while a confirm is open, so the focused renderable never sees the key', () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [] });
		km.attach(ctx.renderer);
		km.confirm('Delete this?');

		const stopPropagation = vi.fn();
		km.dispatch(makeKey({ name: 'down', stopPropagation }));
		expect(stopPropagation).toHaveBeenCalledOnce();
	});

	it('does not stop propagation once resolved — normal dispatch resumes', async () => {
		const ctx = fixtures.createMockContext();
		const handler = vi.fn();
		const km = new Keymap({ bindings: [{ keys: ['enter'], label: 'Confirm', handler }] });
		km.attach(ctx.renderer);

		const promise = km.confirm('Delete this?');
		km.dispatch(makeKey({ name: 'n' })); // resolves false, closes
		await promise;

		const stopPropagation = vi.fn();
		km.dispatch(makeKey({ name: 'enter', stopPropagation }));
		expect(stopPropagation).not.toHaveBeenCalled();
		expect(handler).toHaveBeenCalledOnce();
	});

	it('detach() resolves a pending confirm false so no promise dangles', async () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [] });
		km.attach(ctx.renderer);

		const promise = km.confirm('Delete this?');
		km.detach(ctx.renderer);
		await expect(promise).resolves.toBe(false);
	});
});

// ——— command palette (TR.D1) —————————————————————————————————————————————————

const PALETTE_ENTRIES = paletteFixtures.paletteEntries;

describe('Keymap command palette', () => {
	it('ctrl+p is absent from the keybar without paletteEntries/onCommand', () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [] });
		km.attach(ctx.renderer);

		expect(km.toKeybar()).not.toContain('Jump');
		expect(km.dispatch(makeKey({ name: 'p', ctrl: true }))).toBeNull();
	});

	it('ctrl+p is absent when paletteEntries is supplied without onCommand', () => {
		const ctx = fixtures.createMockContext();
		const km = new Keymap({ bindings: [], paletteEntries: PALETTE_ENTRIES });
		km.attach(ctx.renderer);

		expect(km.toKeybar()).not.toContain('Jump');
	});

	it('ctrl+p opens the palette when both paletteEntries and onCommand are supplied', () => {
		const ctx = fixtures.createMockContext();
		const onCommand = vi.fn();
		const km = new Keymap({ bindings: [], paletteEntries: PALETTE_ENTRIES, onCommand });
		km.attach(ctx.renderer);

		expect(km.toKeybar()).toContain('Jump');
		const binding = km.dispatch(makeKey({ name: 'p', ctrl: true }));
		expect(binding).not.toBeNull();
	});

	it('a false paletteWhen blocks ctrl+p from opening the palette', () => {
		const ctx = fixtures.createMockContext();
		const onCommand = vi.fn();
		const km = new Keymap({
			bindings: [],
			paletteEntries: PALETTE_ENTRIES,
			onCommand,
			paletteWhen: () => false,
		});
		km.attach(ctx.renderer);

		expect(km.dispatch(makeKey({ name: 'p', ctrl: true }))).toBeNull();
		expect((km as any).paletteOpen).toBe(false);
	});

	it('a false paletteWhen also hides Jump from the keybar', () => {
		const ctx = fixtures.createMockContext();
		const onCommand = vi.fn();
		const km = new Keymap({
			bindings: [],
			paletteEntries: PALETTE_ENTRIES,
			onCommand,
			paletteWhen: () => false,
		});
		km.attach(ctx.renderer);

		expect(km.toKeybar()).not.toContain('Jump');
	});

	it('paletteWhen re-evaluates live, so ctrl+p opens once the guard flips true', () => {
		const ctx = fixtures.createMockContext();
		const onCommand = vi.fn();
		let editing = true;
		const km = new Keymap({
			bindings: [],
			paletteEntries: PALETTE_ENTRIES,
			onCommand,
			paletteWhen: () => !editing,
		});
		km.attach(ctx.renderer);

		expect(km.dispatch(makeKey({ name: 'p', ctrl: true }))).toBeNull();
		expect((km as any).paletteOpen).toBe(false);

		editing = false;
		const binding = km.dispatch(makeKey({ name: 'p', ctrl: true }));
		expect(binding).not.toBeNull();
		expect((km as any).paletteOpen).toBe(true);
	});

	it('printable characters build up the query', () => {
		const ctx = fixtures.createMockContext();
		const onCommand = vi.fn();
		const km = new Keymap({ bindings: [], paletteEntries: PALETTE_ENTRIES, onCommand });
		km.attach(ctx.renderer);

		km.dispatch(makeKey({ name: 'p', ctrl: true }));
		km.dispatch(makeKey({ name: 's', sequence: 's' }));
		km.dispatch(makeKey({ name: 'e', sequence: 'e' }));
		km.dispatch(makeKey({ name: 't', sequence: 't' }));

		const overlay = (km as any).paletteOverlay;
		expect(overlay.getSelected()?.screen).toBe('settings');
	});

	it('accepts a multi-byte BMP character into the query', () => {
		// OpenTUI sets stdin to utf8, so an accented/CJK character already
		// arrives as a length-1 JS string (unlike an escape sequence, which
		// is multiple ASCII characters) and should pass isPrintable().
		const ctx = fixtures.createMockContext();
		const onCommand = vi.fn();
		const km = new Keymap({ bindings: [], paletteEntries: PALETTE_ENTRIES, onCommand });
		km.attach(ctx.renderer);

		km.dispatch(makeKey({ name: 'p', ctrl: true }));
		km.dispatch(makeKey({ name: 'e', sequence: 'é' }));

		expect((km as any).paletteQuery).toBe('é');
	});

	it('backspace trims the query', () => {
		const ctx = fixtures.createMockContext();
		const onCommand = vi.fn();
		const km = new Keymap({ bindings: [], paletteEntries: PALETTE_ENTRIES, onCommand });
		km.attach(ctx.renderer);

		km.dispatch(makeKey({ name: 'p', ctrl: true }));
		km.dispatch(makeKey({ name: 'x', sequence: 'x' }));
		km.dispatch(makeKey({ name: 'backspace' }));

		expect((km as any).paletteQuery).toBe('');
	});

	it('up/down move the selection', () => {
		const ctx = fixtures.createMockContext();
		const onCommand = vi.fn();
		const km = new Keymap({ bindings: [], paletteEntries: PALETTE_ENTRIES, onCommand });
		km.attach(ctx.renderer);

		km.dispatch(makeKey({ name: 'p', ctrl: true }));
		km.dispatch(makeKey({ name: 'down' }));

		const overlay = (km as any).paletteOverlay;
		expect(overlay.getSelected()?.screen).toBe('settings');
	});

	it('enter fires onCommand with the selected screen and closes', () => {
		const ctx = fixtures.createMockContext();
		const onCommand = vi.fn();
		const km = new Keymap({ bindings: [], paletteEntries: PALETTE_ENTRIES, onCommand });
		km.attach(ctx.renderer);

		km.dispatch(makeKey({ name: 'p', ctrl: true }));
		km.dispatch(makeKey({ name: 'enter' }));

		expect(onCommand).toHaveBeenCalledWith('dashboard');
		expect((km as any).paletteOpen).toBe(false);
	});

	it('enter on an empty result list does not fire onCommand', () => {
		const ctx = fixtures.createMockContext();
		const onCommand = vi.fn();
		const km = new Keymap({ bindings: [], paletteEntries: PALETTE_ENTRIES, onCommand });
		km.attach(ctx.renderer);

		km.dispatch(makeKey({ name: 'p', ctrl: true }));
		km.dispatch(makeKey({ name: 'z', sequence: 'z' }));
		km.dispatch(makeKey({ name: 'z', sequence: 'z' }));
		km.dispatch(makeKey({ name: 'z', sequence: 'z' }));
		km.dispatch(makeKey({ name: 'enter' }));

		expect(onCommand).not.toHaveBeenCalled();
	});

	it('escape closes the palette without firing onCommand', () => {
		const ctx = fixtures.createMockContext();
		const onCommand = vi.fn();
		const km = new Keymap({ bindings: [], paletteEntries: PALETTE_ENTRIES, onCommand });
		km.attach(ctx.renderer);

		km.dispatch(makeKey({ name: 'p', ctrl: true }));
		km.dispatch(makeKey({ name: 'escape' }));

		expect(onCommand).not.toHaveBeenCalled();
		expect((km as any).paletteOpen).toBe(false);
	});

	it('ctrl+p again closes the palette (toggle), mirroring "?" for the help overlay', () => {
		const ctx = fixtures.createMockContext();
		const onCommand = vi.fn();
		const km = new Keymap({ bindings: [], paletteEntries: PALETTE_ENTRIES, onCommand });
		km.attach(ctx.renderer);

		km.dispatch(makeKey({ name: 'p', ctrl: true })); // open
		km.dispatch(makeKey({ name: 'p', ctrl: true })); // close

		expect(onCommand).not.toHaveBeenCalled();
		expect((km as any).paletteOpen).toBe(false);
	});

	it('swallows unrelated keys while the palette is open — "q" does not quit', () => {
		const ctx = fixtures.createMockContext();
		const onQuit = vi.fn();
		const onCommand = vi.fn();
		const km = new Keymap({ bindings: [], paletteEntries: PALETTE_ENTRIES, onCommand, onQuit });
		km.attach(ctx.renderer);

		km.dispatch(makeKey({ name: 'p', ctrl: true }));
		expect(km.dispatch(makeKey({ name: 'q', sequence: 'q' }))).toBeNull();
		expect(onQuit).not.toHaveBeenCalled();
	});

	it('stops propagation on every key while the palette is open', () => {
		const ctx = fixtures.createMockContext();
		const onCommand = vi.fn();
		const km = new Keymap({ bindings: [], paletteEntries: PALETTE_ENTRIES, onCommand });
		km.attach(ctx.renderer);
		km.dispatch(makeKey({ name: 'p', ctrl: true }));

		const stopPropagation = vi.fn();
		km.dispatch(makeKey({ name: 'x', sequence: 'x', stopPropagation }));
		expect(stopPropagation).toHaveBeenCalledOnce();
	});

	it('detach() removes the overlay and resets palette state', () => {
		const ctx = fixtures.createMockContext();
		const onCommand = vi.fn();
		const km = new Keymap({ bindings: [], paletteEntries: PALETTE_ENTRIES, onCommand });
		km.attach(ctx.renderer);
		km.dispatch(makeKey({ name: 'p', ctrl: true }));

		km.detach(ctx.renderer);

		expect(ctx.renderer.root.remove).toHaveBeenCalledWith('command-palette-root');
		expect((km as any).paletteOpen).toBe(false);
		expect((km as any).paletteQuery).toBe('');
	});

	it('disableGlobals can suppress ctrl+p even with paletteEntries/onCommand', () => {
		const ctx = fixtures.createMockContext();
		const onCommand = vi.fn();
		const km = new Keymap({
			bindings: [],
			paletteEntries: PALETTE_ENTRIES,
			onCommand,
			disableGlobals: ['ctrl+p'],
		});
		km.attach(ctx.renderer);

		expect(km.toKeybar()).not.toContain('Jump');
	});

	it('disableGlobals suppressing ctrl+p also skips constructing the overlay entirely', () => {
		// attach() previously recomputed a weaker enablement check that omitted
		// the disableGlobals test — the binding was correctly suppressed, but
		// the overlay was still built and mounted, an unreachable renderable.
		const ctx = fixtures.createMockContext();
		const onCommand = vi.fn();
		const km = new Keymap({
			bindings: [],
			paletteEntries: PALETTE_ENTRIES,
			onCommand,
			disableGlobals: ['ctrl+p'],
		});
		km.attach(ctx.renderer);

		expect(ctx.renderer.root.add).not.toHaveBeenCalledWith(
			expect.objectContaining({ id: 'command-palette-root' })
		);
	});

	it('cannot be opened while the help overlay is open — help takes precedence', () => {
		const ctx = fixtures.createMockContext();
		const onCommand = vi.fn();
		const km = new Keymap({ bindings: [], paletteEntries: PALETTE_ENTRIES, onCommand });
		km.attach(ctx.renderer);

		km.dispatch(makeKey({ name: '?' })); // open help
		km.dispatch(makeKey({ name: 'p', ctrl: true })); // attempt to open palette

		expect((km as any).paletteOpen).toBe(false);
		expect(onCommand).not.toHaveBeenCalled();
	});
});

describe('paletteNav()', () => {
	it('returns the shared PALETTE_SCREENS list', () => {
		const resolve = vi.fn();
		expect(paletteNav('dashboard', resolve).paletteEntries).toBe(PALETTE_SCREENS);
	});

	it('PALETTE_SCREENS matches the data-only test fixture', () => {
		// fuzzy.test.ts can't import PALETTE_SCREENS directly without pulling
		// in @opentui/core transitively (see fixtures/tui/palette.ts), so it
		// keeps a hand-mirrored copy. This guard is what makes that mirror
		// trustworthy rather than a second, driftable source of truth.
		expect(PALETTE_SCREENS.map((e) => e.screen)).toEqual(paletteFixtures.paletteScreenNames);
	});

	it('resolves a push for a different screen', () => {
		const resolve = vi.fn();
		const { onCommand } = paletteNav('dashboard', resolve);
		onCommand?.('settings');

		expect(resolve).toHaveBeenCalledWith({ action: 'push', screen: 'settings' });
	});

	it('is a no-op for a self-jump', () => {
		const resolve = vi.fn();
		const { onCommand } = paletteNav('dashboard', resolve);
		onCommand?.('dashboard');

		expect(resolve).not.toHaveBeenCalled();
	});
});

// ——— globals ——————————————————————————————————————————————————————————————————

describe('global bindings', () => {
	it('onBack wires ESC to the back handler', () => {
		const onBack = vi.fn();
		const km = new Keymap({ bindings: [], onBack });
		km.dispatch(makeKey({ name: 'escape' }));
		expect(onBack).toHaveBeenCalledOnce();
	});

	it('onQuit wires q to the quit handler', () => {
		const onQuit = vi.fn();
		const km = new Keymap({ bindings: [], onQuit });
		km.dispatch(makeKey({ name: 'q' }));
		expect(onQuit).toHaveBeenCalledOnce();
	});

	it('disableGlobals suppresses the specified global', () => {
		const onQuit = vi.fn();
		const km = new Keymap({ bindings: [], onQuit, disableGlobals: ['q'] });
		km.dispatch(makeKey({ name: 'q' }));
		expect(onQuit).not.toHaveBeenCalled();
	});
});

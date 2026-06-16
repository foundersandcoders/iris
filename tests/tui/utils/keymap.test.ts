import { describe, it, expect, vi } from 'vitest';
import { normaliseKey, eventToKey, Keymap, type Binding } from '../../../src/tui/utils/keymap';
import type { KeyEvent } from '@opentui/core';
import * as fixtures from '../../fixtures/tui/tui';

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
		expect(km.toKeybar()).not.toContain('Help');
	});

	it('re-evaluates when() on each call for live keybar updates', () => {
		let visible = false;
		const km = new Keymap({
			bindings: [{ keys: ['s'], label: 'Save', when: () => visible, handler: vi.fn() }],
		});
		expect(km.toKeybar()).toBe('');
		visible = true;
		expect(km.toKeybar()).toContain('Save');
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

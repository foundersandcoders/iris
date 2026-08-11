import { vi } from 'vitest';
import { createMockRenderer } from './tui';

/**
 * Test double for `@opentui/core`.
 *
 * The real package bundles its tree-sitter grammars AND its native Zig
 * renderer bindings (`bun:ffi`) into one eagerly-evaluated chunk, so it can
 * only ever load under Bun; there is no way to import any symbol from it
 * under vitest/Node. Suites `vi.mock('@opentui/core', ...)` this module
 * instead of the real package.
 *
 * Fidelity is scoped to what tests/tui/** actually observes: constructor
 * names, constructor-options-become-properties (including on later
 * reassignment), child-list management, the string→StyledText coercion on
 * TextRenderable.content, and RGBA channel maths (mirrored from the real
 * hexToRgb so `.equals()`/`toEqual` behave identically to opentui).
 */

/**
 * Colour-shaped option keys opentui coerces from hex string to RGBA, both at
 * construction and on later reassignment (e.g. panel.ts's box.borderColor =
 * theme.accent). Defined as accessors on the prototype so every set, not
 * just the constructor's initial assignment, goes through parseColor.
 */
const COLOUR_KEYS = ['backgroundColor', 'borderColor', 'fg', 'bg', 'color', 'selectedBackgroundColor'];

class BaseRenderable {
	id: string;
	protected colourValues: Record<string, unknown> = {};
	private children: BaseRenderable[] = [];

	constructor(_renderer: unknown, options: Record<string, unknown> = {}) {
		this.id = (options.id as string) ?? `mock-${Math.random().toString(36).slice(2)}`;
		Object.assign(this, options);
	}

	add(child: BaseRenderable): void {
		this.children.push(child);
	}

	remove(id: string): void {
		this.children = this.children.filter((child) => child.id !== id);
	}

	insertBefore(child: BaseRenderable, beforeId: string): void {
		const index = this.children.findIndex((existing) => existing.id === beforeId);
		if (index === -1) {
			this.children.push(child);
		} else {
			this.children.splice(index, 0, child);
		}
	}

	getChildren(): BaseRenderable[] {
		return this.children;
	}

	/** Real Renderable.requestRender() delegates to the render context.
	 *  opentui-spinner's SpinnerRenderable calls this from its color/frames
	 *  setters (including during construction, via Object.assign above), so
	 *  it must exist even though this double never runs an actual render loop. */
	requestRender(): void {}
}

for (const key of COLOUR_KEYS) {
	Object.defineProperty(BaseRenderable.prototype, key, {
		configurable: true,
		enumerable: true,
		get(this: BaseRenderable) {
			return this.colourValues[key];
		},
		set(this: BaseRenderable, value: unknown) {
			this.colourValues[key] = typeof value === 'string' ? parseColor(value) : value;
		},
	});
}

/** Base class opentui-spinner's SpinnerRenderable extends: construction only, no render loop. */
export class Renderable extends BaseRenderable {}

export class BoxRenderable extends BaseRenderable {}

/** Mirrors opentui: assigning a string to `.content` wraps it as StyledText. */
export class TextRenderable extends BaseRenderable {
	private _content: { chunks: { text: string }[] };

	constructor(renderer: unknown, options: Record<string, unknown> = {}) {
		const { content, ...rest } = options;
		super(renderer, rest);
		this._content = TextRenderable.toStyledText(content);
	}

	get content(): { chunks: { text: string }[] } {
		return this._content;
	}

	set content(value: unknown) {
		this._content = TextRenderable.toStyledText(value);
	}

	private static toStyledText(value: unknown): { chunks: { text: string }[] } {
		if (value && typeof value === 'object' && 'chunks' in value) {
			return value as { chunks: { text: string }[] };
		}
		return { chunks: [{ text: (value as string) ?? '' }] };
	}
}

export const SelectRenderableEvents = {
	ITEM_SELECTED: 'itemSelected',
	SELECTION_CHANGED: 'selectionChanged',
} as const;

export const InputRenderableEvents = {
	INPUT: 'input',
	ENTER: 'enter',
} as const;

export class SelectRenderable extends BaseRenderable {
	// Real opentui exposes `selectedIndex` as write-only (a setter with no getter)
	// and reading the current selection goes through getSelectedIndex() instead.
	// Backed by a private field with only a setter defined (no getter), so
	// `screen.leftSelect.selectedIndex` reads back `undefined` here exactly as it
	// does against the real renderable; code that (incorrectly) reads
	// `.selectedIndex` instead of calling `getSelectedIndex()` fails the same way
	// under test as it would in production.
	private _selectedIndex = 0;

	set selectedIndex(index: number) {
		this._selectedIndex = index;
	}

	on = vi.fn();
	once = vi.fn();
	focus = vi.fn();
	blur = vi.fn();
	setSelectedIndex = vi.fn(function (this: SelectRenderable, index: number) {
		this._selectedIndex = index;
	});
	getSelectedIndex = vi.fn(function (this: SelectRenderable) {
		return this._selectedIndex;
	});
	selectCurrent = vi.fn();
}

/** Test double for opentui's InputRenderable.
 *
 *  `value` is real state, not a stub: it starts from the constructor's
 *  `value` option (destructured out before `super()`, same idiom as
 *  TextRenderable.content above, so BaseRenderable's Object.assign doesn't
 *  route the initial value through the setter and fire a spurious `input`
 *  event) and `pressKey()` mutates it exactly like the real
 *  TextareaRenderable.handleKeyPress: an unmodified backspace deletes the
 *  preceding character, and any other unmodified single-char sequence at or
 *  above 0x20 is appended.
 *
 *  `on` records handlers (not just a bare vi.fn()) so `pressKey()` can fire
 *  the registered INPUT/ENTER listeners the same way the real renderable's
 *  keypress handler does, letting tests drive the search box end-to-end
 *  instead of poking `searchQuery` directly. See keymap.ts's textInputActive
 *  guard: the real bug this exists to catch is a global Keymap binding
 *  matching a printable key that should have reached this renderable instead. */
export class InputRenderable extends BaseRenderable {
	private _value: string;
	private handlers: Record<string, ((...args: unknown[]) => void)[]> = {};

	constructor(renderer: unknown, options: Record<string, unknown> = {}) {
		const { value, ...rest } = options;
		super(renderer, rest);
		this._value = (value as string) ?? '';
	}

	get value(): string {
		return this._value;
	}

	set value(next: string) {
		this._value = next;
	}

	on = vi.fn(function (this: InputRenderable, event: string, handler: (...args: unknown[]) => void) {
		(this.handlers[event] ??= []).push(handler);
		return this;
	});

	focus = vi.fn();
	blur = vi.fn();

	private emit(event: string, ...args: unknown[]): void {
		for (const handler of this.handlers[event] ?? []) handler(...args);
	}

	/** Simulates this renderable receiving a keypress that OpenTUI's dispatch
	 *  order let through (i.e. the Keymap's global listener did not
	 *  stopPropagation()). Mirrors the two branches of
	 *  TextareaRenderable.handleKeyPress that tests/tui/** exercises, in the
	 *  real method's order: an unmodified backspace resolves to the
	 *  "backspace" key binding and deletes the character before the cursor,
	 *  and only if no binding matched does a printable single-char sequence
	 *  get appended. Both fire INPUT.
	 *
	 *  Backspace is matched on either shape a caller might build, because the
	 *  real parseKeypress emits both: it sets `name` to "backspace" for DEL
	 *  but leaves `sequence` as the raw "\x7f". That DEL sequence is length-1
	 *  and at or above 0x20, so without this branch it would sail through the
	 *  printable test and get appended as a literal DEL character; the real
	 *  renderable rejects charCode 127 explicitly for exactly that reason.
	 *
	 *  Returns true for any key the input consumes, matching the real
	 *  deleteCharBackward's unconditional true, so a backspace on an empty
	 *  value is still "handled" (a focused input swallows it either way) and
	 *  still emits INPUT, again unconditionally as the real one does.
	 *  Returns false without mutating state for a non-printable/modified key,
	 *  matching the real renderable's refusal to insert those. */
	pressKey(key: { name?: string; sequence?: string; ctrl?: boolean; meta?: boolean; option?: boolean }): boolean {
		if (key.ctrl || key.meta || key.option) return false;
		if (key.name === 'backspace' || key.sequence === '\x7f') {
			this._value = this._value.slice(0, -1);
			this.emit('input', this._value);
			return true;
		}
		const seq = key.sequence;
		if (!seq || seq.length !== 1 || seq.charCodeAt(0) < 0x20) return false;
		this._value += seq;
		this.emit('input', this._value);
		return true;
	}
}

export class TabSelectRenderable extends BaseRenderable {
	selectedIndex = 0;
	on = vi.fn();
	focus = vi.fn();
	moveLeft = vi.fn();
	moveRight = vi.fn();
	setSelectedIndex = vi.fn(function (this: TabSelectRenderable, index: number) {
		this.selectedIndex = index;
	});
}

export class ASCIIFontRenderable extends BaseRenderable {}

/**
 * Mirrors opentui's real RGBA: a Float32Array-backed colour with r/g/b/a
 * getters. Reproducing the real hexToRgb maths (not just a distinct fake
 * shape) means two independent `RGBA.fromHex(x)` calls satisfy `toEqual`
 * structural equality, matching the real assertions in theme.test.ts.
 */
export class RGBA {
	buffer: Float32Array;

	constructor(buffer: Float32Array) {
		this.buffer = buffer;
	}

	static fromHex(hex: string): RGBA {
		let clean = hex.replace(/^#/, '');
		if (clean.length === 3) {
			clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
		}
		const r = parseInt(clean.substring(0, 2), 16) / 255;
		const g = parseInt(clean.substring(2, 4), 16) / 255;
		const b = parseInt(clean.substring(4, 6), 16) / 255;
		const a = clean.length === 8 ? parseInt(clean.substring(6, 8), 16) / 255 : 1;
		return new RGBA(new Float32Array([r, g, b, a]));
	}

	static fromValues(r: number, g: number, b: number, a = 1): RGBA {
		return new RGBA(new Float32Array([r, g, b, a]));
	}

	get r(): number {
		return this.buffer[0];
	}
	get g(): number {
		return this.buffer[1];
	}
	get b(): number {
		return this.buffer[2];
	}
	get a(): number {
		return this.buffer[3];
	}

	equals(other: RGBA | undefined | null): boolean {
		if (!other) return false;
		return this.r === other.r && this.g === other.g && this.b === other.b && this.a === other.a;
	}
}

/** Mirrors opentui's real StyledText: a thin wrapper around a chunks array.
 *  TextRenderable.toStyledText duck-types on `.chunks`, so this only needs
 *  to carry it through. */
export class StyledText {
	chunks: unknown[];

	constructor(chunks: unknown[]) {
		this.chunks = chunks;
	}
}

/** Mirrors opentui's real parseColor: strings become RGBA, everything else passes through. */
export function parseColor(color: unknown): unknown {
	if (typeof color === 'string') {
		if (color.toLowerCase() === 'transparent') {
			return new RGBA(new Float32Array([0, 0, 0, 0]));
		}
		return RGBA.fromHex(color);
	}
	return color;
}

/**
 * The real resolveRenderLib() loads the native Zig binding via bun:ffi, not
 * reproducible under Node. Nothing in tests/tui/** constructs a renderable
 * that calls into it at runtime (opentui-spinner's SpinnerRenderable is only
 * ever imported, never instantiated, by the suites here), so a throwing stub
 * is correct: it surfaces loudly if that assumption ever changes.
 */
export function resolveRenderLib(): never {
	throw new Error(
		'resolveRenderLib() is not mocked; tests must not instantiate renderables that need the native render lib.'
	);
}

/** Styled-text helpers (assets/brand + about.ts): simple passthroughs. */
export function t(strings: TemplateStringsArray, ...values: unknown[]): { chunks: { text: string }[] } {
	const text = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');
	return { chunks: [{ text }] };
}

export function fg(_color: unknown) {
	return (text: string) => text;
}

export function link(_url: string) {
	return (text: string) => text;
}

export function underline(text: string): string {
	return text;
}

export async function createCliRenderer(_options?: unknown) {
	return createMockRenderer();
}

/**
 * Timeline/engine doubles for transitions.ts (TR.C4). `add()` records the
 * target/properties rather than actually animating; tests drive completion
 * deterministically by asserting on the recorded call, not by pumping
 * deltaTime through a fake clock.
 */
export class Timeline {
	items: { target: unknown; properties: Record<string, unknown> }[] = [];
	isPlaying = false;
	isComplete = false;

	add = vi.fn(function (this: Timeline, target: unknown, properties: Record<string, unknown>) {
		this.items.push({ target, properties });
		return this;
	});
	once = vi.fn(function (this: Timeline) {
		return this;
	});
	call = vi.fn(function (this: Timeline) {
		return this;
	});
	play = vi.fn(function (this: Timeline) {
		this.isPlaying = true;
		return this;
	});
	pause = vi.fn(function (this: Timeline) {
		this.isPlaying = false;
		return this;
	});
	restart = vi.fn(function (this: Timeline) {
		return this;
	});
	update = vi.fn();
}

export const engine = {
	attach: vi.fn(),
	detach: vi.fn(),
	register: vi.fn(),
	unregister: vi.fn(),
	clear: vi.fn(),
	update: vi.fn(),
};

export const createTimeline = vi.fn((_options?: unknown) => new Timeline());

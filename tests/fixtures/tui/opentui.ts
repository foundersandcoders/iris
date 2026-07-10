import { vi } from 'vitest';
import { createMockRenderer } from './tui';

/**
 * Test double for `@opentui/core`.
 *
 * The real package bundles its tree-sitter grammars AND its native Zig
 * renderer bindings (`bun:ffi`) into one eagerly-evaluated chunk, so it can
 * only ever load under Bun — there is no way to import any symbol from it
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
 * theme.accent). Defined as accessors on the prototype so every set — not
 * just the constructor's initial assignment — goes through parseColor.
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

/** Base class opentui-spinner's SpinnerRenderable extends — construction only, no render loop. */
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
	on = vi.fn();
	once = vi.fn();
	focus = vi.fn();
	blur = vi.fn();
	setSelectedIndex = vi.fn();
	selectCurrent = vi.fn();
}

export class InputRenderable extends BaseRenderable {
	on = vi.fn();
	focus = vi.fn();
	blur = vi.fn();
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
 * The real resolveRenderLib() loads the native Zig binding via bun:ffi — not
 * reproducible under Node. Nothing in tests/tui/** constructs a renderable
 * that calls into it at runtime (opentui-spinner's SpinnerRenderable is only
 * ever imported, never instantiated, by the suites here), so a throwing stub
 * is correct: it surfaces loudly if that assumption ever changes.
 */
export function resolveRenderLib(): never {
	throw new Error(
		'resolveRenderLib() is not mocked — tests must not instantiate renderables that need the native render lib.'
	);
}

/** Styled-text helpers (assets/brand + about.ts) — simple passthroughs. */
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

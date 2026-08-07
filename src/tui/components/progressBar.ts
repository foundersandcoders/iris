/** ====== Progress Bar Component ======
 * Single-row bar (symbols.progress.filled/empty) + right-aligned status text.
 * Width-reactive: recomputes bar width from the root's measured width via
 * onSizeChange, falling back to a fixed default before the first layout pass.
 */
import { BoxRenderable, TextRenderable } from '@opentui/core';
import type { Renderer } from '../types';
import { theme, symbols } from '../../../assets/brand/theme';

export interface ProgressBarOptions {
	id?: string;
	/** Initial fraction complete, 0-1. Clamped. Default 0. */
	value?: number;
	/** Fixed bar width in cells. Omit to auto-size from the root's measured width. */
	width?: number;
	/** Min/max bar width when auto-sizing. Defaults 10 / 40. */
	minWidth?: number;
	maxWidth?: number;
	/** Show the trailing "  48%" readout. Default true. */
	showPercent?: boolean;
	/** Right-aligned trailing text, e.g. "elapsed 0:02". */
	status?: string;
	/** Filled-segment colour. Default theme.successAccent. */
	fillColor?: string;
	/** Empty-segment colour. Default theme.border. */
	trackColor?: string;
}

export interface ProgressBar {
	/** Row box — add to a panel or container. */
	readonly root: BoxRenderable;
	/** Set completion, 0-1 (clamped; NaN treated as 0). Repaints. */
	setValue(value: number): void;
	/** Replace the right-aligned status text. */
	setStatus(status: string): void;
	/** Recolour the fill (e.g. theme.errorAccent on failure). */
	setFillColor(colour: string): void;
	/** Current clamped value. */
	getValue(): number;
}

/** Design-mock bar width — used whenever the root's measured width isn't a
 *  number yet (before the first Yoga layout pass, and under the test double,
 *  which never runs a layout engine). */
const DEFAULT_BAR_WIDTH = 26;
const DEFAULT_MIN_WIDTH = 10;
const DEFAULT_MAX_WIDTH = 40;
// Reserved cells for "  100%" — two-space gutter + up to 4 percent chars.
const PERCENT_RESERVE = 6;

function clamp(value: number, min: number, max: number): number {
	if (Number.isNaN(value)) return min;
	return Math.min(max, Math.max(min, value));
}

export function progressBar(renderer: Renderer, opts: ProgressBarOptions = {}): ProgressBar {
	const showPercent = opts.showPercent ?? true;
	const minWidth = opts.minWidth ?? DEFAULT_MIN_WIDTH;
	const maxWidth = opts.maxWidth ?? DEFAULT_MAX_WIDTH;
	let fillColor = opts.fillColor ?? theme.successAccent;
	const trackColor = opts.trackColor ?? theme.border;
	let value = clamp(opts.value ?? 0, 0, 1);
	let status = opts.status ?? '';

	const root = new BoxRenderable(renderer, {
		id: opts.id,
		flexDirection: 'row',
		width: '100%',
		justifyContent: 'space-between',
	});

	// Two segments so the filled and empty runs can carry distinct colours
	// (theme.successAccent / theme.border by default), plus a trailing
	// percent readout grouped with the filled segment's colouring.
	const barContainer = new BoxRenderable(renderer, { flexDirection: 'row' });
	const filledText = new TextRenderable(renderer, { content: '', fg: fillColor });
	const emptyText = new TextRenderable(renderer, { content: '', fg: trackColor });
	const percentText = new TextRenderable(renderer, { content: '', fg: fillColor });
	barContainer.add(filledText);
	barContainer.add(emptyText);
	barContainer.add(percentText);

	const statusText = new TextRenderable(renderer, { content: status, fg: theme.textMuted });
	root.add(barContainer);
	root.add(statusText);

	function resolveBarWidth(): number {
		if (typeof opts.width === 'number') return opts.width;
		// root.width is only a measured number after Yoga has laid out the
		// tree; before that (including under the test double, which has no
		// layout engine) it's whatever was passed in options — here '100%'.
		const measured = (root as unknown as { width?: unknown }).width;
		if (typeof measured !== 'number') return DEFAULT_BAR_WIDTH;
		return clamp(measured - PERCENT_RESERVE - status.length, minWidth, maxWidth);
	}

	function render(): void {
		const barWidth = resolveBarWidth();
		// Round first, then clamp into [0, barWidth]: a value of 1.0000001
		// (floating-point drift from e.g. 4/4) must never produce a negative
		// repeat() count, which throws RangeError.
		const filledCells = clamp(Math.round(value * barWidth), 0, barWidth);
		const emptyCells = barWidth - filledCells;

		filledText.fg = fillColor;
		filledText.content = symbols.progress.filled.repeat(filledCells);
		emptyText.content = symbols.progress.empty.repeat(emptyCells);
		percentText.fg = fillColor;
		percentText.content = showPercent ? `  ${Math.round(value * 100)}%` : '';
		statusText.content = status;
	}

	render();

	// Terminal-resize reactivity: OpenTUI calls requestRender() itself after
	// onSizeChange fires, so no manual render call is needed there beyond
	// recomputing our own content.
	root.onSizeChange = () => render();

	return {
		root,
		setValue(next) {
			value = clamp(next, 0, 1);
			render();
		},
		setStatus(next) {
			status = next;
			render();
		},
		setFillColor(colour) {
			fillColor = colour;
			render();
		},
		getValue() {
			return value;
		},
	};
}

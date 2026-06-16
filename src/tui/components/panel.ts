/** ====== Panel Component ======
 * Bordered, titled box with imperative focus-colour toggle.
 * Focus is NOT managed by OpenTUI's focusable system — child renderables
 * (e.g. SelectRenderable) own focus; panel.setFocused() only repaints the border.
 */
import { BoxRenderable } from '@opentui/core';
import type { Renderer } from '../types';
import { theme } from '../../../brand/theme';
import { space, type SpacingStep } from '../utils/layout';

export interface PanelOptions {
	title?: string;
	titleAlignment?: 'left' | 'center' | 'right';
	id?: string;
	borderStyle?: 'single' | 'double' | 'rounded' | 'heavy';
	padding?: SpacingStep | number;
	/** Initial focus state — sets border colour at construction time. Default false. */
	focused?: boolean;
	flexGrow?: number;
	flexDirection?: 'row' | 'column';
	width?: number | string;
	height?: number | string;
}

export interface Panel {
	/** The underlying box — pass to parent.add() or renderer.root.add(). */
	readonly box: BoxRenderable;
	/** Toggle the focused border colour (theme.accent) vs muted (theme.border). */
	setFocused(focused: boolean): void;
	/** Add a child renderable — shorthand for panel.box.add(child). */
	add(child: Parameters<BoxRenderable['add']>[0]): void;
	/** Update the border title in place. */
	setTitle(title: string): void;
}

export function panel(renderer: Renderer, opts: PanelOptions = {}): Panel {
	const box = new BoxRenderable(renderer, {
		id: opts.id,
		title: opts.title,
		titleAlignment: opts.titleAlignment ?? 'left',
		border: true, // must be explicit — defaults false
		borderStyle: opts.borderStyle ?? 'rounded',
		borderColor: opts.focused ? theme.accent : theme.border,
		backgroundColor: theme.background,
		padding: space(opts.padding ?? 'xs'),
		flexDirection: opts.flexDirection ?? 'column',
		flexGrow: opts.flexGrow,
		width: opts.width,
		height: opts.height,
	});

	return {
		box,
		setFocused(focused) {
			box.borderColor = focused ? theme.accent : theme.border;
		},
		add(child) {
			box.add(child);
		},
		setTitle(title) {
			box.title = title;
		},
	};
}

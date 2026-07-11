/** ====== Help Overlay Component ======
 * Full-screen z-index layer listing the current screen's live key bindings.
 * Owned and driven by Keymap (TR.C1) — mounted on renderer.root (a sibling of
 * each screen's shell.root) so its zIndex stacks it above the whole screen.
 */
import { BoxRenderable, TextRenderable, t, fg } from '@opentui/core';
import type { Renderer } from '../types';
import { theme } from '../../../assets/brand/theme';
import { panel, type Panel } from './panel';

/** One display-ready shortcut row for the overlay. */
export interface HelpRow {
	/** Pre-rendered key glyph(s), e.g. "↑↓" or "ENTER". */
	keys: string;
	/** Human-readable action label. */
	label: string;
}

export interface HelpOverlayOptions {
	/** Overlay id, used for renderer.root.remove(). Default 'help-overlay-root'. */
	id?: string;
	/** Paint order among renderer.root siblings — must exceed screen roots. Default 100. */
	zIndex?: number;
	/** Card title. Default 'Keyboard Shortcuts'. */
	title?: string;
}

export interface HelpOverlay {
	/** Full-screen backdrop box — add to renderer.root (sibling of the screen shell). */
	readonly root: BoxRenderable;
	/** Replace the listed shortcut rows in place. */
	setRows(rows: HelpRow[]): void;
	/** Show/hide without remounting. */
	setVisible(visible: boolean): void;
	/** Current visibility. */
	isVisible(): boolean;
}

const FOOTER_HINT = '? or ESC to close';

export function helpOverlay(renderer: Renderer, opts: HelpOverlayOptions = {}): HelpOverlay {
	const root = new BoxRenderable(renderer, {
		id: opts.id ?? 'help-overlay-root',
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		zIndex: opts.zIndex ?? 100,
		backgroundColor: theme.background,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		visible: false,
	});

	// Explicit width — the panel would otherwise size to its (initially empty)
	// rowsBox content and clip a title longer than the placeholder row width.
	const card: Panel = panel(renderer, { title: opts.title ?? 'Keyboard Shortcuts', width: 42 });

	const rowsBox = new BoxRenderable(renderer, { flexDirection: 'column' });
	card.add(rowsBox);

	const footer = new TextRenderable(renderer, { content: FOOTER_HINT, fg: theme.textMuted });
	card.add(footer);

	root.add(card.box);

	let rowIds: string[] = [];

	return {
		root,
		setRows(rows) {
			for (const id of rowIds) rowsBox.remove(id);
			rowIds = [];

			const maxKeysWidth = rows.reduce((max, row) => Math.max(max, row.keys.length), 0);

			rows.forEach((row, index) => {
				const padding = ' '.repeat(Math.max(1, maxKeysWidth - row.keys.length + 2));
				const rowText = new TextRenderable(renderer, {
					id: `help-overlay-row-${index}`,
					content: t`${fg(theme.accent)(`${row.keys}${padding}`)}${fg(theme.text)(row.label)}`,
				});
				rowIds.push(rowText.id);
				rowsBox.add(rowText);
			});
		},
		setVisible(visible) {
			root.visible = visible;
		},
		isVisible() {
			return root.visible ?? false;
		},
	};
}

/** ====== Command Palette Component ======
 * Full-screen z-index layer for fuzzy jump-to-screen (TR.D1). Owned and
 * driven by Keymap: mounted on renderer.root (a sibling of each screen's
 * shell.root) so its zIndex stacks it above the whole screen, matching
 * helpOverlay.ts / confirmOverlay.ts.
 *
 * Unlike those two, this overlay needs a live text query. Rather than an
 * InputRenderable (which would need real focus, inverting the swallow-
 * everything-via-stopPropagation pattern the other overlays rely on), the
 * query is rendered as plain TextRenderable content: Keymap already
 * receives every keypress while the palette is open, so it accumulates
 * the query string itself and pushes it here via setQuery().
 */
import { BoxRenderable, TextRenderable, t, fg } from '@opentui/core';
import type { Renderer } from '../types';
import { theme } from '../../../assets/brand/theme';
import { overlayScaffold } from './overlay';

/** One selectable entry in the palette's result list. */
export interface PaletteEntry {
	/** Screen route name, resolved via onCommand. */
	screen: string;
	/** Display label, e.g. "Mapping Builder". */
	label: string;
}

export interface CommandPaletteOptions {
	/** Overlay id, used for renderer.root.remove(). Default 'command-palette-root'. */
	id?: string;
	/** Paint order among renderer.root siblings, must exceed screen roots. Default 100. */
	zIndex?: number;
	/** Card title. Default 'Command Palette'. */
	title?: string;
}

export interface CommandPalette {
	/** Full-screen backdrop box, add to renderer.root (sibling of the screen shell). */
	readonly root: BoxRenderable;
	/** Replace the displayed query line. */
	setQuery(query: string): void;
	/** Replace the result list in place, resetting selection to the first entry. */
	setEntries(entries: PaletteEntry[]): void;
	/** Move the selection by delta (e.g. -1/+1), clamped to the list bounds. */
	moveSelection(delta: number): void;
	/** The currently selected entry, or null if the list is empty. */
	getSelected(): PaletteEntry | null;
	/** Show/hide without remounting. Does not reset query/selection;
	 *  callers (Keymap) own that on open/close. */
	setVisible(visible: boolean): void;
	/** Current visibility. */
	isVisible(): boolean;
}

const FOOTER_HINT = '↑↓ select  ↵ jump  ESC close';
const EMPTY_HINT = 'No matching screens';

export function commandPalette(renderer: Renderer, opts: CommandPaletteOptions = {}): CommandPalette {
	const { root, card } = overlayScaffold(renderer, {
		id: opts.id ?? 'command-palette-root',
		title: opts.title ?? 'Command Palette',
		zIndex: opts.zIndex,
	});

	const queryLine = new TextRenderable(renderer, {
		content: t`${fg(theme.accent)('> ')}`,
		fg: theme.text,
	});
	card.add(queryLine);

	card.add(new TextRenderable(renderer, { content: '' }));

	const resultsBox = new BoxRenderable(renderer, { flexDirection: 'column' });
	card.add(resultsBox);

	const footer = new TextRenderable(renderer, { content: FOOTER_HINT, fg: theme.textMuted });
	card.add(footer);

	const SELECTED_MARKER = '›';

	let entries: PaletteEntry[] = [];
	let selectedIndex = 0;
	let rows: TextRenderable[] = [];

	/** The styled content for one row: the only thing that differs between
	 *  a selected and unselected row, so moveSelection() can restyle a row
	 *  in place instead of rebuilding it. */
	function contentFor(entry: PaletteEntry, isSelected: boolean) {
		return isSelected
			? t`${fg(theme.highlightFocused)(`${SELECTED_MARKER} ${entry.label}`)}`
			: t`${fg(theme.text)(`  ${entry.label}`)}`;
	}

	let emptyRow: TextRenderable | null = null;

	/** Reconcile the mounted rows against `entries` in place. setEntries()
	 *  fires on every keystroke via the fuzzy filter, so rows are restyled
	 *  where they already exist and only created/removed when the list
	 *  changes length: the same churn-avoidance moveSelection() applies to
	 *  selection changes. */
	function syncRows(): void {
		if (entries.length === 0) {
			for (const row of rows) resultsBox.remove(row.id);
			rows = [];
			if (!emptyRow) {
				emptyRow = new TextRenderable(renderer, {
					id: 'command-palette-empty',
					content: EMPTY_HINT,
					fg: theme.textMuted,
				});
				resultsBox.add(emptyRow);
			}
			return;
		}

		if (emptyRow) {
			resultsBox.remove(emptyRow.id);
			emptyRow = null;
		}

		while (rows.length > entries.length) {
			const surplus = rows.pop();
			if (surplus) resultsBox.remove(surplus.id);
		}

		rows.forEach((row, index) => {
			row.content = contentFor(entries[index], index === selectedIndex);
		});

		for (let index = rows.length; index < entries.length; index++) {
			const row = new TextRenderable(renderer, {
				id: `command-palette-row-${index}`,
				content: contentFor(entries[index], index === selectedIndex),
			});
			rows.push(row);
			resultsBox.add(row);
		}
	}

	return {
		root,
		setQuery(query) {
			queryLine.content = t`${fg(theme.accent)('> ')}${fg(theme.text)(query)}`;
		},
		setEntries(newEntries) {
			entries = newEntries;
			selectedIndex = 0;
			syncRows();
		},
		moveSelection(delta) {
			if (entries.length === 0) return;
			const next = Math.max(0, Math.min(entries.length - 1, selectedIndex + delta));
			// Early-return on a clamped no-op: at either end of the list,
			// repeated arrow presses would otherwise restyle the same row
			// over and over for no visible change.
			if (next === selectedIndex) return;
			const previous = selectedIndex;
			selectedIndex = next;
			// Only the two changed rows need repainting, not the whole list:
			// renderRows() tore down and recreated every TextRenderable on
			// every arrow press.
			rows[previous].content = contentFor(entries[previous], false);
			rows[next].content = contentFor(entries[next], true);
		},
		getSelected() {
			return entries[selectedIndex] ?? null;
		},
		setVisible(visible) {
			root.visible = visible;
		},
		isVisible() {
			return root.visible ?? false;
		},
	};
}

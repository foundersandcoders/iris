/** ====== Modal Overlay Scaffold ======
 * The backdrop + card shared by helpOverlay, confirmOverlay and
 * commandPalette. Each of those owns its own card contents and its own
 * imperative API; only the full-screen z-index layer is shared here.
 */
import { BoxRenderable } from '@opentui/core';
import type { Renderer } from '../types';
import { theme } from '../../../assets/brand/theme';
import { panel, type Panel } from './panel';

/** Paint order among renderer.root siblings. Screen roots sit below both.
 *  Toasts must outrank modals: a toast fired by a screen behind a modal is
 *  still transient feedback the user needs to see. Kept here, in one
 *  place, rather than asserted only by a comment repeated across the
 *  three overlay files and toastManager.ts. */
export const Z_INDEX = {
	/** Modal overlays: help, confirm, command palette. */
	modal: 100,
	/** Non-modal toast layer, above every modal. */
	toast: 200,
} as const;

/** Shared card width for every modal overlay. Explicit rather than
 *  content-sized: each card is populated after construction with
 *  initially-empty content, which would otherwise size the panel to the
 *  placeholder and clip a longer title or row. */
const CARD_WIDTH = 42;

export interface OverlayScaffold {
	/** Full-screen backdrop, add to renderer.root. */
	readonly root: BoxRenderable;
	/** The centred card; add contents to this. */
	readonly card: Panel;
}

export function overlayScaffold(
	renderer: Renderer,
	opts: { id: string; title: string; zIndex?: number }
): OverlayScaffold {
	const root = new BoxRenderable(renderer, {
		id: opts.id,
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		zIndex: opts.zIndex ?? Z_INDEX.modal,
		backgroundColor: theme.background,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		visible: false,
	});

	const card = panel(renderer, { title: opts.title, width: CARD_WIDTH });
	root.add(card.box);

	return { root, card };
}

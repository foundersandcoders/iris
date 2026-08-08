/** ====== Confirm Overlay Component ======
 * Full-screen z-index layer presenting a yes/no confirmation modal.
 * Owned and driven by Keymap (TR.C2) — mounted on renderer.root (a sibling of
 * each screen's shell.root) so its zIndex stacks it above the whole screen.
 */
import type { BoxRenderable } from '@opentui/core';
import { TextRenderable } from '@opentui/core';
import type { Renderer } from '../types';
import { theme } from '../../../assets/brand/theme';
import { overlayScaffold } from './overlay';

export interface ConfirmOverlayOptions {
	/** Overlay id, used for renderer.root.remove(). Default 'confirm-overlay-root'. */
	id?: string;
	/** Paint order among renderer.root siblings — must exceed screen roots. Default 100. */
	zIndex?: number;
	/** Card title. Default 'Confirm'. */
	title?: string;
}

export interface ConfirmOverlay {
	/** Full-screen backdrop box — add to renderer.root (sibling of the screen shell). */
	readonly root: BoxRenderable;
	/** Replace the confirmation message in place. */
	setMessage(message: string): void;
	/** Show/hide without remounting. */
	setVisible(visible: boolean): void;
	/** Current visibility. */
	isVisible(): boolean;
}

const FOOTER_HINT = '[y]es / [n]o';

export function confirmOverlay(renderer: Renderer, opts: ConfirmOverlayOptions = {}): ConfirmOverlay {
	const { root, card } = overlayScaffold(renderer, {
		id: opts.id ?? 'confirm-overlay-root',
		title: opts.title ?? 'Confirm',
		zIndex: opts.zIndex,
	});

	const message = new TextRenderable(renderer, { content: '', fg: theme.text });
	card.add(message);

	const footer = new TextRenderable(renderer, { content: FOOTER_HINT, fg: theme.textMuted });
	card.add(footer);

	return {
		root,
		setMessage(text) {
			message.content = text;
		},
		setVisible(visible) {
			root.visible = visible;
		},
		isVisible() {
			return root.visible ?? false;
		},
	};
}

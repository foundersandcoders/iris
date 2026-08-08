/** ====== Toast Component ======
 * A single transient feedback card (success/info/warning/error).
 * Owned by ToastManager (TR.C2), which stacks these in a non-modal corner
 * layer. Unlike the modal overlays (helpOverlay, confirmOverlay), a toast's
 * CARD is opaque by design — it must stay readable over whatever screen
 * content sits behind it — but the manager's LAYER around it is transparent,
 * so screen content beyond the card stays visible. See toastManager.ts.
 */
import { BoxRenderable, TextRenderable, t, fg } from '@opentui/core';
import type { Renderer } from '../types';
import { theme, symbols } from '../../../assets/brand/theme';
import { space } from '../utils/layout';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface ToastOptions {
	/** Renderable id. The manager generates a unique one per toast if omitted. */
	id?: string;
	/** Body text. */
	message: string;
	/** Colour + glyph family. Default 'info'. */
	variant?: ToastVariant;
}

export interface Toast {
	/** The card box — added to the ToastManager's stack layer. */
	readonly root: BoxRenderable;
	readonly variant: ToastVariant;
	/** Replace the body text in place. */
	setMessage(message: string): void;
}

const GLYPH: Record<ToastVariant, string> = {
	success: symbols.info.success,
	error: symbols.info.error,
	warning: symbols.info.warning,
	info: symbols.bullet.dot,
};

/** Resolve a variant's accent colour from the live theme — NOT a module-level
 *  map, since applyTheme() (TR.D2) mutates `theme`'s properties in place. A
 *  frozen-at-import-time map would keep showing the pre-switch colour after
 *  a theme toggle, same class of bug TR.D2 fixed for the `rgba` export. */
function accentFor(variant: ToastVariant): string {
	switch (variant) {
		case 'success':
			return theme.successAccent;
		case 'error':
			return theme.errorAccent;
		case 'warning':
			return theme.warningAccent;
		case 'info':
			return theme.infoAccent;
	}
}

export function toast(renderer: Renderer, opts: ToastOptions): Toast {
	const variant = opts.variant ?? 'info';
	const accent = accentFor(variant);

	const root = new BoxRenderable(renderer, {
		...(opts.id ? { id: opts.id } : {}),
		border: true,
		borderStyle: 'rounded',
		borderColor: accent,
		backgroundColor: theme.background,
		padding: space('xs'),
		flexDirection: 'row',
		// Content-sized, not fixed-width like the modal overlays' `width: 42`.
		// Those two need a fixed width because their card is populated AFTER
		// construction with initially-empty content (see comments in
		// helpOverlay.ts / confirmOverlay.ts). A toast receives its message
		// at construction, so the clipping hazard those comments describe
		// does not apply here.
		minWidth: 24,
		maxWidth: 48,
	});

	const text = new TextRenderable(renderer, {
		content: t`${fg(accent)(`${GLYPH[variant]} `)}${fg(theme.text)(opts.message)}`,
	});
	root.add(text);

	return {
		root,
		variant,
		setMessage(message) {
			text.content = t`${fg(accent)(`${GLYPH[variant]} `)}${fg(theme.text)(message)}`;
		},
	};
}

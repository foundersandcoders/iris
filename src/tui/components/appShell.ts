/** ====== App Shell Component ======
 * Three-band layout: header band, content region (flexGrow 1), footer keybar.
 * Keymap-agnostic — accepts a plain footer string and exposes setFooter() so
 * the keymap registry (TR.A3) can thread its toKeybar() output through in Phase B.
 */
import { BoxRenderable, TextRenderable } from '@opentui/core';
import type { Renderer } from '../types';
import { theme } from '../../../brand/theme';
import { header as defaultHeader } from '../utils/layout';

export interface AppShellOptions {
	id?: string;
	/** Header title. Defaults to "Iris  v<version>" via layout.header(). */
	title?: string;
	/** Breadcrumb appended to the header, e.g. "Dashboard › Settings". */
	breadcrumb?: string;
	/** Initial footer hint string in "[KEY] Label  " format. */
	footer?: string;
}

export interface AppShell {
	/** Root box — pass to renderer.root.add(). */
	readonly root: BoxRenderable;
	/** Content region (flexGrow 1) — screens mount their own renderables here. */
	readonly content: BoxRenderable;
	/** Replace the footer hint string (supports stateful screens). */
	setFooter(hint: string): void;
	/** Update the header line / breadcrumb in place. */
	setHeader(title: string, breadcrumb?: string): void;
}

function composeHeader(title: string, breadcrumb?: string): string {
	return breadcrumb ? `${title}    ${breadcrumb}` : title;
}

export function appShell(renderer: Renderer, opts: AppShellOptions = {}): AppShell {
	const root = new BoxRenderable(renderer, {
		id: opts.id,
		flexDirection: 'column',
		width: '100%',
		height: '100%',
		backgroundColor: theme.background,
	});

	const headerText = new TextRenderable(renderer, {
		content: composeHeader(opts.title ?? defaultHeader(), opts.breadcrumb),
		fg: theme.primary,
	});
	root.add(headerText);

	const content = new BoxRenderable(renderer, {
		flexGrow: 1,
		flexDirection: 'column',
		backgroundColor: theme.background,
	});
	root.add(content);

	const footerText = new TextRenderable(renderer, {
		content: opts.footer ?? '',
		fg: theme.textMuted,
	});
	root.add(footerText);

	return {
		root,
		content,
		setFooter(hint) {
			footerText.content = hint;
		},
		setHeader(title, breadcrumb) {
			headerText.content = composeHeader(title, breadcrumb);
		},
	};
}

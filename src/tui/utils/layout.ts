/** ====== Layout System ====== */
import type { Terminal } from 'terminal-kit';
import { THEMES, symbols } from '../theme';

const theme = THEMES.themeLight;

export interface LayoutOptions {
	title: string;
	breadcrumbs?: string[];
	statusBar?: string;
	showBack?: boolean;
}

export interface LayoutRegion {
	contentTop: number;
	contentBottom: number;
	contentHeight: number;
	contentWidth: number;
}

export class Layout {
	constructor(private term: Terminal) {}

	draw(options: LayoutOptions): LayoutRegion {
		// Fill background with Rosewash Main
		this.term.bgColorRgbHex(theme.background).clear();

		const width = this.term.width;
		const height = this.term.height;

		this.drawHeader(options);

		const contentTop = 4;
		const contentBottom = height - 1;
		const contentHeight = contentBottom - contentTop;
		const contentWidth = width;

		this.drawStatusBar(options);

		return {
			contentTop,
			contentBottom,
			contentHeight,
			contentWidth,
		};
	}

	private drawHeader(options: LayoutOptions): void {
		// Row 1: Version (Top Right)
		this.term.moveTo(this.term.width - 10, 1);
		this.term.colorRgbHex(theme.textMuted)('v0.11.1');
		this.term.styleReset();

		// Row 2: Title
		this.term.moveTo(1, 2);
		if (options.showBack) this.term.colorRgbHex(theme.textMuted)(`${symbols.arrow} `);

		// Title in Tyrian Midi (Primary)
		this.term.bold.colorRgbHex(theme.primary)(options.title);
		this.term.styleReset();

		// Row 3: Breadcrumbs
		if (options.breadcrumbs && options.breadcrumbs.length > 0) {
			this.term.moveTo(1, 3);
			const breadcrumbText = options.breadcrumbs.join(' › ');
			this.term.colorRgbHex(theme.textMuted)(breadcrumbText);
			this.term.styleReset();
		}
	}

	private drawStatusBar(options: LayoutOptions): void {
		const height = this.term.height;
		this.term.moveTo(1, height);

		const statusText = options.statusBar || '[ESC] Back  [q] Quit';
		// Status in Tyrian Lite (Muted)
		this.term.colorRgbHex(theme.textMuted)(statusText);
		this.term.styleReset();
	}

	clearContent(regions: LayoutRegion): void {
		for (let y = regions.contentTop; y < regions.contentBottom; y++) {
			this.term.moveTo(1, y);
			// Erase with Rosewash Main background
			this.term.bgColorRgbHex(theme.background).eraseLineAfter();
		}
	}
}

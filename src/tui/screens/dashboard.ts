/** ====== Dashboard Screen ======
 * Main menu and entry point for TUI
 */
import {
	BoxRenderable,
	TextRenderable,
	ASCIIFontRenderable,
	SelectRenderable,
	SelectRenderableEvents,
	type KeyEvent,
} from '@opentui/core';
import type { RenderContext, Renderer } from '../types';
import { theme, PALETTE } from '../theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';

interface MenuItem {
	key: string;
	label: string;
	implemented: boolean;
}

export class Dashboard implements Screen {
	readonly name = 'dashboard';
	private renderer: Renderer;
	private container?: BoxRenderable;
	private select?: SelectRenderable;
	private keyHandler?: (key: KeyEvent) => void;

	private menuItems: MenuItem[] = [
		{ key: 'convert', label: 'Convert CSV to ILR XML', implemented: true },
		{ key: 'validate', label: 'Validate XML Submission', implemented: false },
		{ key: 'check', label: 'Cross-Submission Check', implemented: false },
		{ key: 'history', label: 'Browse Submission History', implemented: false },
		{ key: 'settings', label: 'Settings & Configuration', implemented: false },
		{ key: 'quit', label: 'Quit', implemented: true },
	];

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		return new Promise((resolve) => {
			// Root container
			this.container = new BoxRenderable(this.renderer, {
				flexDirection: 'column',
				width: '100%',
				height: '100%',
				backgroundColor: theme.background,
			});

			// Logo with gradient (Tyrian → Blueglass)
			const logo = new ASCIIFontRenderable(this.renderer, {
				text: 'Iris',
				font: 'block',
				color: [PALETTE.foreground.main.midi, PALETTE.foreground.alt.midi],
			});
			this.container.add(logo);

			// Spacer
			this.container.add(new TextRenderable(this.renderer, { content: '' }));

			// Section heading
			const heading = new TextRenderable(this.renderer, {
				content: 'Quick Actions',
				fg: theme.text,
			});
			this.container.add(heading);

			// Spacer
			this.container.add(new TextRenderable(this.renderer, { content: '' }));

			// Menu
			this.select = new SelectRenderable(this.renderer, {
				options: this.menuItems.map((item, index) => ({
					name: `${index + 1}  ${item.label}`,
					description: item.implemented ? '' : '(soon)',
					value: item,
				})),
				selectedBackgroundColor: theme.highlight,
				selectedTextColor: theme.text,
				textColor: theme.text,
				descriptionColor: theme.textMuted,
				flexGrow: 1,
			});
			this.container.add(this.select);

			// Status bar
			const statusBar = new TextRenderable(this.renderer, {
				content: '[↑↓/1-6] Select  [ENTER] Confirm  [q] Quit',
				fg: theme.textMuted,
			});
			this.container.add(statusBar);

			// Add to renderer
			this.renderer.root.add(this.container);

			// Event handlers
			this.select.on(SelectRenderableEvents.ITEM_SELECTED, () => {
				const selected = this.select?.getSelectedOption();
				if (!selected?.value) return;

				const item = selected.value as MenuItem;

				if (item.key === 'quit') {
					resolve({ action: 'quit' });
				} else if (item.implemented) {
					resolve({ action: 'push', screen: item.key });
				}
				// Unimplemented items: do nothing (description already shows "(soon)")
			});

			// Screen-level key handler for number keys and q/escape
			this.keyHandler = (key: KeyEvent) => {
				if (key.name === 'escape' || key.name === 'q') {
					resolve({ action: 'quit' });
				} else if (key.name && key.name >= '1' && key.name <= '6') {
					const index = parseInt(key.name) - 1;
					if (this.select && index < this.menuItems.length) {
						this.select.setSelectedIndex(index);
						this.select.selectCurrent();
					}
				}
			};
			this.renderer.keyInput.on('keypress', this.keyHandler);
		});
	}

	cleanup(): void {
		if (this.keyHandler) {
			this.renderer.keyInput.off('keypress', this.keyHandler);
		}
		if (this.container) {
			this.renderer.root.remove(this.container);
		}
	}
}

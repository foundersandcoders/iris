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
	type SelectOption,
} from '@opentui/core';
import type { RenderContext, Renderer } from '../types';
import { theme, PALETTE } from '../../../brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';

interface MenuItem {
	key: string;
	label: string;
	implemented: boolean;
}

const CONTAINER_ID = 'dashboard-root';

export class Dashboard implements Screen {
	readonly name = 'dashboard';
	private renderer: Renderer;
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
			const container = new BoxRenderable(this.renderer, {
				id: CONTAINER_ID,
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
			container.add(logo);

			// Spacer
			container.add(new TextRenderable(this.renderer, { content: '' }));

			// Section heading
			container.add(
				new TextRenderable(this.renderer, {
					content: 'Quick Actions',
					fg: theme.text,
				})
			);

			// Spacer
			container.add(new TextRenderable(this.renderer, { content: '' }));

			// Menu
			const select = new SelectRenderable(this.renderer, {
				options: this.menuItems.map((item, index) => ({
					name: `${index + 1}  ${item.label}`,
					description: item.implemented ? '' : '(soon)',
					value: item,
				})),
				backgroundColor: theme.background,
				focusedBackgroundColor: theme.background,
				selectedBackgroundColor: theme.highlight,
				selectedTextColor: theme.text,
				textColor: theme.text,
				focusedTextColor: theme.text,
				descriptionColor: theme.textMuted,
				flexGrow: 1,
			});
			container.add(select);

			// Status bar
			container.add(
				new TextRenderable(this.renderer, {
					content: '[↑↓/1-6] Select  [ENTER] Confirm  [q] Quit',
					fg: theme.textMuted,
				})
			);

			// Add to renderer
			this.renderer.root.add(container);
			select.focus();

			// Menu item selected
			select.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
				const item = option.value as MenuItem;
				if (!item) return;

				if (item.key === 'quit') {
					resolve({ action: 'quit' });
				} else if (item.implemented) {
					resolve({ action: 'push', screen: item.key });
				}
			});

			// Screen-level key handler for q/escape/number keys
			this.keyHandler = (key: KeyEvent) => {
				if (key.name === 'escape' || key.name === 'q') {
					resolve({ action: 'quit' });
				} else if (key.name && key.name >= '1' && key.name <= '6') {
					const index = parseInt(key.name) - 1;
					if (index < this.menuItems.length) {
						select.setSelectedIndex(index);
						select.selectCurrent();
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
		this.renderer.root.remove(CONTAINER_ID);
	}
}

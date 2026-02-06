/** ====== File Picker Screen ======
 * Directory browser for selecting CSV files
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {
	BoxRenderable,
	TextRenderable,
	SelectRenderable,
	SelectRenderableEvents,
	type KeyEvent,
	type SelectOption,
} from '@opentui/core';
import type { RenderContext, Renderer } from '../types';
import { theme, PALETTE } from '../../../brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';

interface FileEntry {
	name: string;
	isDirectory: boolean;
	path: string;
}

const CONTAINER_ID = 'file-picker-root';

export class FilePicker implements Screen {
	readonly name = 'file-picker';
	private renderer: Renderer;
	private currentPath: string;
	private entries: FileEntry[] = [];
	private select?: SelectRenderable;
	private breadcrumb?: TextRenderable;
	private emptyMessage?: TextRenderable;
	private keyHandler?: (key: KeyEvent) => void;

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
		this.currentPath = process.cwd();
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		if (data?.path && typeof data.path === 'string') {
			this.currentPath = data.path;
		}

		await this.loadDirectory();

		return new Promise((resolve) => {
			this.buildUI(resolve);
		});
	}

	cleanup(): void {
		if (this.keyHandler) {
			this.renderer.keyInput.off('keypress', this.keyHandler);
		}
		this.renderer.root.remove(CONTAINER_ID);
	}

	private buildUI(resolve: (result: ScreenResult) => void): void {
		// Root container
		const container = new BoxRenderable(this.renderer, {
			id: CONTAINER_ID,
			flexDirection: 'column',
			width: '100%',
			height: '100%',
			backgroundColor: theme.background,
		});

		// Header
		const header = new BoxRenderable(this.renderer, {
			flexDirection: 'column',
		});

		header.add(
			new TextRenderable(this.renderer, {
				content: 'Select CSV File',
				fg: theme.primary,
			})
		);

		this.breadcrumb = new TextRenderable(this.renderer, {
			content: this.shortenPath(this.currentPath),
			fg: theme.textMuted,
		});
		header.add(this.breadcrumb);

		container.add(header);

		// File list or empty message
		if (this.entries.length === 0) {
			this.emptyMessage = new TextRenderable(this.renderer, {
				content: '  No CSV files found in this directory.',
				fg: theme.textMuted,
				flexGrow: 1,
			});
			container.add(this.emptyMessage);
		} else {
			this.select = new SelectRenderable(this.renderer, {
				options: this.entriesToOptions(),
				backgroundColor: theme.background,
				focusedBackgroundColor: theme.background,
				selectedBackgroundColor: theme.highlight,
				selectedTextColor: theme.text,
				textColor: theme.text,
				focusedTextColor: theme.text,
				showScrollIndicator: true,
				flexGrow: 1,
			});
			container.add(this.select);
		}

		// Status bar
		container.add(
			new TextRenderable(this.renderer, {
				content: '[↑↓] Nav  [ENTER] Select  [BACKSPACE] Up Dir  [ESC] Back',
				fg: theme.textMuted,
			})
		);

		// Add to renderer
		this.renderer.root.add(container);

		// Focus select if it exists
		if (this.select) {
			this.select.focus();

			// Item selected
			this.select.on(
				SelectRenderableEvents.ITEM_SELECTED,
				async (index: number, option: SelectOption) => {
					const entry = option.value as FileEntry;
					if (!entry) return;

					if (entry.isDirectory) {
						this.currentPath = entry.path;
						await this.loadDirectory();
						this.updateSelectOptions();
						if (this.breadcrumb) {
							this.breadcrumb.content = this.shortenPath(this.currentPath);
						}
					} else {
						resolve({
							action: 'push',
							screen: 'processing',
							data: { filePath: entry.path },
						});
					}
				}
			);
		}

		// Screen-level key handler
		this.keyHandler = async (key: KeyEvent) => {
			if (key.name === 'backspace' || key.name === 'left') {
				const parent = path.dirname(this.currentPath);
				if (parent !== this.currentPath) {
					this.currentPath = parent;
					await this.loadDirectory();
					this.updateSelectOptions();
					if (this.breadcrumb) {
						this.breadcrumb.content = this.shortenPath(this.currentPath);
					}
				}
			} else if (key.name === 'escape' || key.name === 'q') {
				resolve({ action: 'pop' });
			}
		};
		this.renderer.keyInput.on('keypress', this.keyHandler);
	}

	private updateSelectOptions(): void {
		if (!this.select) return;

		if (this.entries.length === 0) {
			this.select.visible = false;
			if (this.emptyMessage) {
				this.emptyMessage.visible = true;
			}
		} else {
			this.select.options = this.entriesToOptions();
			this.select.setSelectedIndex(0);
			this.select.visible = true;
			this.select.focus();
			if (this.emptyMessage) {
				this.emptyMessage.visible = false;
			}
		}
	}

	private entriesToOptions(): SelectOption[] {
		return this.entries.map((entry) => ({
			name: `${entry.isDirectory ? '📁' : '📄'}  ${entry.name}`,
			description: '',
			value: entry,
		}));
	}

	private async loadDirectory(): Promise<void> {
		try {
			const dirents = await fs.readdir(this.currentPath, { withFileTypes: true });

			const filtered = dirents.filter((d) => {
				if (d.name.startsWith('.') && d.name !== '..') return false;
				if (d.isDirectory()) return true;
				if (d.name.toLowerCase().endsWith('.csv')) return true;
				return false;
			});

			const mapped: FileEntry[] = filtered.map((d) => ({
				name: d.name,
				isDirectory: d.isDirectory(),
				path: path.join(this.currentPath, d.name),
			}));

			mapped.sort((a, b) => {
				if (a.isDirectory && !b.isDirectory) return -1;
				if (!a.isDirectory && b.isDirectory) return 1;
				return a.name.localeCompare(b.name);
			});

			this.entries = mapped;
		} catch (error) {
			this.entries = [];
		}
	}

	private shortenPath(fullPath: string): string {
		const home = process.env.HOME || '';
		if (fullPath.startsWith(home)) {
			return '~' + fullPath.slice(home.length);
		}
		return fullPath;
	}
}

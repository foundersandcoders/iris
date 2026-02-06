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
import { theme } from '../theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';

interface FileEntry {
	name: string;
	isDirectory: boolean;
	path: string;
}

export class FilePicker implements Screen {
	readonly name = 'file-picker';
	private renderer: Renderer;
	private currentPath: string;
	private entries: FileEntry[] = [];
	private container?: BoxRenderable;
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
			this.buildUI();

			// SelectRenderable event handler
			if (this.select) {
				this.select.on(SelectRenderableEvents.ITEM_SELECTED, async () => {
					const selected = this.select?.getSelectedOption();
					if (!selected?.value) return;

					const entry = selected.value as FileEntry;

					if (entry.isDirectory) {
						// Navigate into directory
						this.currentPath = entry.path;
						this.select!.setSelectedIndex(0);
						await this.loadDirectory();
						this.updateSelectOptions();
						if (this.breadcrumb) {
							this.breadcrumb.content = this.shortenPath(this.currentPath);
						}
					} else {
						// File selected - push to processing
						resolve({
							action: 'push',
							screen: 'processing',
							data: { filePath: entry.path },
						});
					}
				});
			}

			// Screen-level key handler
			this.keyHandler = async (key: KeyEvent) => {
				if (key.name === 'backspace' || key.name === 'left') {
					const parent = path.dirname(this.currentPath);
					if (parent !== this.currentPath) {
						this.currentPath = parent;
						this.select?.setSelectedIndex(0);
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

	private buildUI(): void {
		// Root container
		this.container = new BoxRenderable(this.renderer, {
			flexDirection: 'column',
			width: '100%',
			height: '100%',
			backgroundColor: theme.background,
		});

		// Header
		const header = new BoxRenderable(this.renderer, {
			flexDirection: 'column',
		});

		const title = new TextRenderable(this.renderer, {
			content: 'Select CSV File',
			fg: theme.primary,
		});
		header.add(title);

		this.breadcrumb = new TextRenderable(this.renderer, {
			content: this.shortenPath(this.currentPath),
			fg: theme.textMuted,
		});
		header.add(this.breadcrumb);

		this.container.add(header);

		// File list or empty message
		if (this.entries.length === 0) {
			this.emptyMessage = new TextRenderable(this.renderer, {
				content: '  No CSV files found in this directory.',
				fg: theme.textMuted,
				flexGrow: 1,
			});
			this.container.add(this.emptyMessage);
		} else {
			this.select = new SelectRenderable(this.renderer, {
				options: this.entriesToOptions(),
				selectedBackgroundColor: theme.highlight,
				selectedTextColor: theme.text,
				textColor: theme.text,
				showScrollIndicator: true,
				flexGrow: 1,
			});
			this.container.add(this.select);
		}

		// Status bar
		const statusBar = new TextRenderable(this.renderer, {
			content: '[↑↓] Nav  [ENTER] Select  [BACKSPACE] Up Dir  [ESC] Back',
			fg: theme.textMuted,
		});
		this.container.add(statusBar);

		// Add to renderer
		this.renderer.root.add(this.container);
	}

	private updateSelectOptions(): void {
		if (!this.select) return;

		if (this.entries.length === 0) {
			// Hide select, show empty message
			this.select.visible = false;
			if (!this.emptyMessage) {
				this.emptyMessage = new TextRenderable(this.renderer, {
					content: '  No CSV files found in this directory.',
					fg: theme.textMuted,
					flexGrow: 1,
				});
				// Insert before status bar (last child)
				const statusBar = this.container?.children[this.container.children.length - 1];
				if (statusBar && this.container) {
					this.container.remove(statusBar);
					this.container.add(this.emptyMessage);
					this.container.add(statusBar);
				}
			} else {
				this.emptyMessage.visible = true;
			}
		} else {
			// Update select options
			this.select.options = this.entriesToOptions();
			this.select.visible = true;
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

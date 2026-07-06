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
	type SelectOption,
} from '@opentui/core';
import type { RenderContext, Renderer } from '../types';
import { theme, symbols } from '../../../assets/brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import { Keymap } from '../utils/keymap';
import { appShell, panel, type Panel } from '../components';

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
	private emptyMessage?: TextRenderable;
	private keymap?: Keymap;
	private filePanel?: Panel;
	private screenData?: ScreenData;

	private title: string = 'Select CSV File';
	private fileExtensions: string[] = ['.csv'];
	private workflowType: string = 'convert';
	private selectionMode: 'file' | 'directory' = 'file';

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
		this.currentPath = process.cwd();
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		// Store data for forwarding in two-step check flow
		this.screenData = data;

		if (data?.path && typeof data.path === 'string') {
			this.currentPath = data.path;
		}

		// Read configuration from data
		this.title = (data?.title as string) || 'Select CSV File';
		this.workflowType = (data?.workflowType as string) || 'convert';
		this.selectionMode = (data?.selectionMode as 'file' | 'directory') || 'file';

		// Parse file extensions
		const extensionParam = (data?.fileExtension as string) || '.csv';
		this.fileExtensions = extensionParam.split(',').map((ext) => ext.trim());

		await this.loadDirectory();

		return new Promise((resolve) => {
			this.buildUI(resolve);
		});
	}

	cleanup(): void {
		this.keymap?.detach(this.renderer);
		this.renderer.root.remove(CONTAINER_ID);
	}

	private buildUI(resolve: (result: ScreenResult) => void): void {
		// Always create both renderables; toggle visibility based on whether there
		// are entries. This avoids a one-way trap where starting in an empty directory
		// means this.select is never created and updateSelectOptions() can never show
		// a list even after navigating into a populated directory.
		const hasOptions = this.entries.length > 0 || this.selectionMode === 'directory';

		this.emptyMessage = new TextRenderable(this.renderer, {
			content: `  No ${this.fileExtensions.join('/')} files found in this directory.`,
			fg: theme.textMuted,
			flexGrow: 1,
			visible: !hasOptions,
		});

		this.select = new SelectRenderable(this.renderer, {
			options: this.entriesToOptions(),
			backgroundColor: theme.background,
			focusedBackgroundColor: theme.background,
			selectedBackgroundColor: theme.highlightFocused,
			selectedTextColor: theme.text,
			textColor: theme.text,
			focusedTextColor: theme.text,
			showScrollIndicator: true,
			showDescription: false,
			flexGrow: 1,
			visible: hasOptions,
		});

		// Build keymap before the shell so its keybar can seed the footer
		this.keymap = new Keymap({
			onBack: () => resolve({ action: 'pop' }),
			onQuit: () => resolve({ action: 'pop' }), // "q" also pops here — file-picker has no quit-to-desktop concept
			bindings: [
				// Nav hint — arrow keys handled by SelectRenderable; this is bar-only
				{
					keys: ['up', 'down', 'k', 'j'],
					hint: `${symbols.arrows.up}${symbols.arrows.down}`,
					label: 'Nav',
					handler: () => {},
				},
				{
					keys: ['enter'],
					label: this.selectionMode === 'directory' ? 'Open/Select' : 'Select',
					handler: () => this.select?.selectCurrent(),
				},
				{
					keys: ['backspace'],
					hint: 'BKSP',
					label: 'Up',
					handler: () => {
						void this.goUpDirectory();
					},
				},
			],
		});

		// Shell: header + breadcrumb, content region, footer keybar
		const shell = appShell(this.renderer, {
			id: CONTAINER_ID,
			breadcrumb: this.title,
			footer: this.keymap.toKeybar(),
		});

		// File-list panel — border title shows the current directory path
		this.filePanel = panel(this.renderer, {
			title: this.shortenPath(this.currentPath),
			flexGrow: 1,
		});
		this.filePanel.add(this.emptyMessage);
		this.filePanel.add(this.select);

		// Body: the file-list panel (room for a preview pane alongside it later)
		const body = new BoxRenderable(this.renderer, { flexDirection: 'row', flexGrow: 1 });
		body.add(this.filePanel.box);
		shell.content.add(body);

		// Add to renderer
		this.renderer.root.add(shell.root);

		// Focus and wire events — select is always created
		if (hasOptions) {
			this.select.focus();
		}
		this.keymap.attach(this.renderer);

		this.select.on(
			SelectRenderableEvents.ITEM_SELECTED,
			async (index: number, option: SelectOption) => {
				const entry = option.value as FileEntry;
				if (!entry) return;

				if (this.selectionMode === 'directory' && entry.name === '__select__') {
					resolve({
						action: 'pop',
						data: {
							selectedDirectory: this.currentPath,
							fieldKey: this.screenData?.fieldKey,
						},
					});
					return;
				}

				if (entry.isDirectory) {
					this.currentPath = entry.path;
					await this.loadDirectory();
					this.updateSelectOptions();
					this.filePanel?.setTitle(this.shortenPath(this.currentPath));
				} else if (this.workflowType === 'check-current') {
					// First step of check flow: selected current file, now pick previous
					resolve({
						action: 'push',
						screen: 'file-picker',
						data: {
							fileExtension: '.xml',
							title: 'Select Previous XML Submission',
							workflowType: 'check-previous',
							currentFilePath: entry.path,
							path: this.screenData?.path,
						},
					});
				} else if (this.workflowType === 'check-previous') {
					// Second step of check flow: selected previous file, go to workflow
					resolve({
						action: 'push',
						screen: 'workflow',
						data: {
							filePath: this.screenData?.currentFilePath as string,
							previousFilePath: entry.path,
							workflowType: 'check',
						},
					});
				} else if (this.workflowType === 'mapping-create') {
					// CSV selected for new mapping — push to mapping editor
					resolve({
						action: 'push',
						screen: 'mapping-editor',
						data: {
							mode: this.screenData?.mode ?? 'create',
							csvFilePath: entry.path,
						},
					});
				} else {
					// Normal single-file workflows
					resolve({
						action: 'push',
						screen: 'workflow',
						data: {
							filePath: entry.path,
							workflowType: this.workflowType,
							outputDir: this.screenData?.outputDir,
						},
					});
				}
			}
		);
	}

	/** Navigate to the parent directory (bound to Backspace via the keymap). */
	private async goUpDirectory(): Promise<void> {
		const parent = path.dirname(this.currentPath);
		if (parent === this.currentPath) return;

		this.currentPath = parent;
		await this.loadDirectory();
		this.updateSelectOptions();
		this.filePanel?.setTitle(this.shortenPath(this.currentPath));
	}

	private updateSelectOptions(): void {
		const hasOptions = this.entries.length > 0 || this.selectionMode === 'directory';
		if (!hasOptions) {
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
		const options: SelectOption[] = [];

		if (this.selectionMode === 'directory') {
			options.push({
				name: `${symbols.info.success}  Select this directory`,
				description: this.shortenPath(this.currentPath),
				value: { name: '__select__', isDirectory: true, path: this.currentPath },
			});
		}

		for (const entry of this.entries) {
			options.push({
				name: `${entry.isDirectory ? '>' : ' '}  ${entry.name}`,
				description: '',
				value: entry,
			});
		}

		return options;
	}

	private async loadDirectory(): Promise<void> {
		try {
			const dirents = await fs.readdir(this.currentPath, { withFileTypes: true });

			const filtered = dirents.filter((d) => {
				if (d.name.startsWith('.') && d.name !== '..') return false;
				if (d.isDirectory()) return true;
				if (this.selectionMode === 'directory') return false;
				// Check if file matches any of the configured extensions
				const lowerName = d.name.toLowerCase();
				return this.fileExtensions.some((ext) => lowerName.endsWith(ext.toLowerCase()));
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

/** ====== Submission History Screen ======
 * Browse past submissions with metadata and file validation
 */
import { BoxRenderable, TextRenderable, SelectRenderable } from '@opentui/core';
import { join } from 'path';
import { stat } from 'fs/promises';
import type { RenderContext, Renderer } from '../types';
import { theme, symbols } from '../../../assets/brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import { createStorage } from '../../lib/storage';
import type { HistoryEntry, SubmissionMetadata } from '../../lib/types/storageTypes';
import { appShell, panel, type AppShell, type Panel } from '../components';
import { Keymap } from '../utils/keymap';

const CONTAINER_ID = 'history-root';

interface HistoryListItem {
	entry: HistoryEntry; // from loadHistory()
	metadata?: SubmissionMetadata; // from .meta.json sidecar (enrichment)
	filePath?: string; // resolved path if file exists on disk
	fileSize?: number; // from stat() if file exists
	isBroken: boolean; // file missing or unreadable
}

export class HistoryScreen implements Screen {
	readonly name = 'history';
	private renderer: Renderer;
	private shell?: AppShell;
	private listPanel?: Panel;
	private detailPanel?: Panel;
	private detailContainer?: BoxRenderable;
	private keymap?: Keymap;
	private resolve?: (result: ScreenResult) => void;

	// State
	private historyItems: HistoryListItem[] = [];

	// Renderables
	private submissionList?: SelectRenderable;

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(_data?: ScreenData): Promise<ScreenResult> {
		await this.loadHistory();

		return new Promise((resolve) => {
			this.resolve = resolve;
			const keymap = this.buildUI(resolve);

			if (this.submissionList) {
				this.submissionList.on('selectionChanged', (index: number) => {
					this.updateDetailPanel(index);
				});

				this.submissionList.on('itemSelected', (index: number) => {
					const item = this.historyItems[index];
					if (!item || item.isBroken) return;
					resolve({
						action: 'push',
						screen: 'workflow',
						data: { filePath: item.filePath!, workflowType: 'validate' },
					});
				});

				this.submissionList.focus();
			}

			keymap.attach(this.renderer);
		});
	}

	cleanup(): void {
		this.keymap?.detach(this.renderer);
		this.renderer.root.remove(CONTAINER_ID);
	}

	// === Data Loading ===

	private async loadHistory(): Promise<void> {
		const storage = createStorage();
		const historyResult = await storage.loadHistory();
		if (!historyResult.success) return;

		const history = historyResult.data;
		this.historyItems = [];

		for (const entry of history.submissions) {
			// Use stored filePath from history entry (reliable source of truth)
			// Fall back to constructing path from filename for legacy entries without filePath
			const filePath = entry.filePath ?? join(storage.paths.submissions, entry.filename);
			let fileSize: number | undefined;
			let metadata: SubmissionMetadata | undefined;
			let isBroken = false;

			try {
				// Check if XML file exists on disk at stored path
				const fileStat = await stat(filePath);
				fileSize = fileStat.size;

				// Try to load metadata from internal directory
				const metadataPath = join(
					storage.paths.internalSubmissions,
					`${entry.filename}.meta.json`
				);
				try {
					const content = await Bun.file(metadataPath).text();
					metadata = JSON.parse(content);
				} catch {
					// Metadata is optional — ignore read errors
				}
			} catch {
				// File doesn't exist or is unreadable at stored path
				isBroken = true;
			}

			this.historyItems.push({
				entry,
				metadata,
				filePath: isBroken ? undefined : filePath,
				fileSize,
				isBroken,
			});
		}
	}

	// === UI Building ===

	private buildUI(resolve: (result: ScreenResult) => void): Keymap {
		const finish = () => resolve({ action: 'pop' });

		const hasSelection = () => (this.submissionList?.getSelectedIndex() ?? -1) >= 0;
		const selectedIsBroken = () => {
			const index = this.submissionList?.getSelectedIndex() ?? -1;
			return this.historyItems[index]?.isBroken ?? false;
		};

		// Build the list (and its selection state) before the keymap, since the
		// Validate/Cross-check/Delete bindings' `when` guards read selectedIndex.
		let body: BoxRenderable | undefined;
		if (this.historyItems.length > 0) {
			this.submissionList = new SelectRenderable(this.renderer, {
				options: this.buildListOptions(),
				backgroundColor: theme.background,
				focusedBackgroundColor: theme.background,
				selectedBackgroundColor: theme.highlightFocused,
				selectedTextColor: theme.text,
				textColor: theme.text,
				focusedTextColor: theme.text,
				descriptionColor: theme.textMuted,
				flexGrow: 1,
			});

			this.listPanel = panel(this.renderer, { title: 'Submissions', flexGrow: 1, focused: true });
			this.listPanel.add(this.submissionList);

			this.detailContainer = new BoxRenderable(this.renderer, { flexDirection: 'column' });
			this.detailPanel = panel(this.renderer, { title: 'Detail', flexGrow: 1 });
			this.detailPanel.add(this.detailContainer);

			body = new BoxRenderable(this.renderer, { flexDirection: 'row', flexGrow: 1 });
			body.add(this.listPanel.box);
			body.add(this.detailPanel.box);
		}

		// Backspace also pops, mirroring the pre-migration behaviour; hidden from the
		// keybar since ESC already covers "back" there.
		const bindings =
			this.historyItems.length === 0
				? [{ keys: ['backspace'], label: 'Back', hidden: true, handler: finish }]
				: [
						{
							keys: ['up', 'down', 'k', 'j'],
							hint: `${symbols.arrows.up}${symbols.arrows.down}`,
							label: 'Navigate',
							handler: () => {},
						},
						{
							keys: ['enter', 'v'],
							label: 'Validate',
							when: () => hasSelection() && !selectedIsBroken(),
							handler: () => this.validateSelected(resolve),
						},
						{
							keys: ['c'],
							label: 'Cross-check',
							when: () => hasSelection() && !selectedIsBroken(),
							handler: () => this.crossCheckSelected(resolve),
						},
						{
							keys: ['x'],
							label: 'Delete',
							when: () => selectedIsBroken(),
							handler: () => {
								this.handleDelete().catch((error) => {
									const msg = error instanceof Error ? error.message : 'Unknown error';
									this.shell?.setFooter(`${symbols.info.error} Delete failed: ${msg}`);
								});
							},
						},
						{ keys: ['backspace'], label: 'Back', hidden: true, handler: finish },
					];

		this.keymap = new Keymap({ bindings, onBack: finish, onQuit: finish });
		const keymap = this.keymap;

		this.shell = appShell(this.renderer, {
			id: CONTAINER_ID,
			breadcrumb: 'Submission History',
			footer: keymap.toKeybar(),
		});

		const brokenCount = this.historyItems.filter((i) => i.isBroken).length;
		const subtitle =
			this.historyItems.length === 0
				? 'No submissions found'
				: `${this.historyItems.length} submission${this.historyItems.length === 1 ? '' : 's'}${brokenCount > 0 ? ` ${symbols.bullet.dot} ${brokenCount} broken` : ''}`;
		this.shell.content.add(
			new TextRenderable(this.renderer, { content: subtitle, fg: theme.textMuted })
		);
		this.shell.content.add(new TextRenderable(this.renderer, { content: '' }));

		if (this.historyItems.length === 0) {
			this.shell.content.add(
				new TextRenderable(this.renderer, {
					content: 'Convert a CSV to create your first submission.',
					fg: theme.textMuted,
				})
			);
		} else if (body) {
			this.shell.content.add(body);
			this.updateDetailPanel(0);
		}

		this.renderer.root.add(this.shell.root);

		return keymap;
	}

	private validateSelected(resolve: (result: ScreenResult) => void): void {
		const index = this.submissionList?.getSelectedIndex() ?? -1;
		const item = this.historyItems[index];
		if (item && !item.isBroken && item.filePath) {
			resolve({
				action: 'push',
				screen: 'workflow',
				data: { filePath: item.filePath, workflowType: 'validate' },
			});
		}
	}

	private crossCheckSelected(resolve: (result: ScreenResult) => void): void {
		const index = this.submissionList?.getSelectedIndex() ?? -1;
		const item = this.historyItems[index];
		if (item && !item.isBroken && item.filePath) {
			resolve({
				action: 'push',
				screen: 'file-picker',
				data: {
					fileExtension: '.xml',
					title: 'Select Previous Submission to Compare',
					workflowType: 'check-previous',
					currentFilePath: item.filePath,
				},
			});
		}
	}

	private buildListOptions() {
		return this.historyItems.map((item) => {
			if (item.isBroken) {
				return {
					name: `${symbols.info.error} ${item.entry.filename} (missing)`,
					description: 'File not found',
					value: item,
				};
			}

			const date = new Date(item.entry.timestamp);
			const dateStr = date.toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
			});
			const learnerStr = `${item.entry.learnerCount} learner${item.entry.learnerCount === 1 ? '' : 's'}`;

			return {
				name: item.entry.filename,
				description: `${dateStr}  ${learnerStr}`,
				value: item,
			};
		});
	}

	private updateDetailPanel(index: number): void {
		if (!this.detailContainer) return;

		for (const child of this.detailContainer.getChildren()) {
			this.detailContainer.remove(child.id);
		}

		if (index < 0 || index >= this.historyItems.length) return;

		const item = this.historyItems[index];

		if (item.isBroken) {
			this.detailContainer.add(
				new TextRenderable(this.renderer, {
					content: `${symbols.info.error} File not found on disk`,
					fg: theme.error,
				})
			);
			this.detailContainer.add(
				new TextRenderable(this.renderer, {
					content: `Original: ${item.entry.timestamp}  ${item.entry.learnerCount} learners`,
					fg: theme.textMuted,
				})
			);
			if (item.entry.checksum) {
				this.detailContainer.add(
					new TextRenderable(this.renderer, {
						content: `Checksum: ${item.entry.checksum.substring(0, 16)}...`,
						fg: theme.textMuted,
					})
				);
			}
		} else {
			this.detailContainer.add(
				new TextRenderable(this.renderer, {
					content: `Filename: ${item.entry.filename}`,
					fg: theme.text,
				})
			);

			if (item.filePath) {
				const displayPath = item.filePath.replace(/^\/Users\/[^/]+/, '~');
				this.detailContainer.add(
					new TextRenderable(this.renderer, { content: `Path: ${displayPath}`, fg: theme.textMuted })
				);
			}

			if (item.fileSize !== undefined) {
				const sizeKB = (item.fileSize / 1024).toFixed(1);
				this.detailContainer.add(
					new TextRenderable(this.renderer, { content: `Size: ${sizeKB} KB`, fg: theme.textMuted })
				);
			}

			const date = new Date(item.entry.timestamp);
			const dateStr = date.toLocaleString('en-GB', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
			this.detailContainer.add(
				new TextRenderable(this.renderer, { content: `Date: ${dateStr}`, fg: theme.textMuted })
			);

			this.detailContainer.add(
				new TextRenderable(this.renderer, { content: `Schema: ${item.entry.schema}`, fg: theme.textMuted })
			);

			this.detailContainer.add(
				new TextRenderable(this.renderer, {
					content: `Learners: ${item.entry.learnerCount}`,
					fg: theme.textMuted,
				})
			);

			if (item.metadata?.ukprn) {
				this.detailContainer.add(
					new TextRenderable(this.renderer, { content: `UKPRN: ${item.metadata.ukprn}`, fg: theme.textMuted })
				);
			}

			if (item.metadata?.collectionYear && item.metadata?.serialNo) {
				this.detailContainer.add(
					new TextRenderable(this.renderer, {
						content: `Collection: ${item.metadata.collection || 'ILR'}-${item.metadata.collectionYear}-${item.metadata.serialNo}`,
						fg: theme.textMuted,
					})
				);
			}

			if (item.entry.checksum) {
				this.detailContainer.add(
					new TextRenderable(this.renderer, {
						content: `Checksum: ${item.entry.checksum.substring(0, 16)}...`,
						fg: theme.textMuted,
					})
				);
			}
		}
	}

	// === Delete Handling ===

	private async handleDelete(): Promise<void> {
		const index = this.submissionList?.getSelectedIndex() ?? -1;
		if (index < 0 || index >= this.historyItems.length) return;

		const item = this.historyItems[index];
		if (!item.isBroken) return;

		const ok = (await this.keymap?.confirm('Delete this history entry?')) ?? false;
		if (!ok) return;

		const storage = createStorage();
		const result = await storage.deleteHistoryEntry(item.entry.checksum);

		if (!result.success) {
			this.shell?.setFooter(`${symbols.info.error} Failed to delete history entry`);
			return;
		}

		await this.loadHistory();

		try {
			this.rebuildListAndHandlers();

			const newIndex = Math.min(index, this.historyItems.length - 1);
			if (newIndex >= 0 && this.submissionList) {
				this.submissionList.setSelectedIndex(newIndex);
				this.updateDetailPanel(newIndex);
			}

			this.shell?.setFooter(`${symbols.info.success} Entry deleted`);
			setTimeout(() => this.refreshFooter(), 2000);
		} catch (error) {
			throw new Error(`UI rebuild failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private refreshFooter(): void {
		this.shell?.setFooter(this.keymap?.toKeybar() ?? '');
	}

	private rebuildListAndHandlers(): void {
		if (!this.submissionList || !this.listPanel) return;

		this.listPanel.box.remove(this.submissionList.id);

		this.submissionList = new SelectRenderable(this.renderer, {
			options: this.buildListOptions(),
			backgroundColor: theme.background,
			focusedBackgroundColor: theme.background,
			selectedBackgroundColor: theme.highlightFocused,
			selectedTextColor: theme.text,
			textColor: theme.text,
			focusedTextColor: theme.text,
			descriptionColor: theme.textMuted,
			flexGrow: 1,
		});

		this.submissionList.on('selectionChanged', (index: number) => {
			this.updateDetailPanel(index);
		});
		this.submissionList.on('itemSelected', (index: number) => {
			const item = this.historyItems[index];
			if (!item || item.isBroken || !this.resolve) return;
			this.resolve({
				action: 'push',
				screen: 'workflow',
				data: { filePath: item.filePath!, workflowType: 'validate' },
			});
		});

		this.listPanel.add(this.submissionList);
		this.submissionList.focus();
	}
}

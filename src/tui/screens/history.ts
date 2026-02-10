/** ====== Submission History Screen ======
 * Browse past submissions with metadata and file validation
 */
import {
	BoxRenderable,
	TextRenderable,
	SelectRenderable,
	type KeyEvent,
} from '@opentui/core';
import { join } from 'path';
import { stat } from 'fs/promises';
import type { RenderContext, Renderer } from '../types';
import { theme, symbols } from '../../../brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import { createStorage } from '../../lib/storage';
import type { HistoryEntry, SubmissionMetadata } from '../../lib/types/storageTypes';

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
	private keyHandler?: (key: KeyEvent) => void;

	// State
	private historyItems: HistoryListItem[] = [];
	private deleteConfirmIndex = -1;

	// Renderables
	private container?: BoxRenderable;
	private submissionList?: SelectRenderable;
	private detailPanel?: BoxRenderable;
	private statusText?: TextRenderable;

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		await this.loadHistory();
		this.buildUI();

		// Wait for user interaction
		return new Promise((resolve) => {
			// Selection change handler — update detail panel and reset delete confirm
			this.submissionList?.on('selectionChanged', (index: number) => {
				this.deleteConfirmIndex = -1;
				this.updateDetailPanel(index);
				this.updateStatus();
			});

			// Item selected handler (Enter key)
			this.submissionList?.on('itemSelected', (index: number) => {
				const item = this.historyItems[index];
				if (!item || item.isBroken) return;

				// Default action: validate
				resolve({
					action: 'push',
					screen: 'workflow',
					data: {
						filePath: item.filePath!,
						workflowType: 'validate',
					},
				});
			});

			// Keyboard handlers
			this.keyHandler = (key: KeyEvent) => {
				if (key.name === 'escape' || key.name === 'q' || key.name === 'backspace') {
					resolve({ action: 'pop' });
				} else if (key.name === 'v') {
					// Validate selected submission
					const index = this.submissionList?.selectedIndex ?? -1;
					const item = this.historyItems[index];
					if (item && !item.isBroken && item.filePath) {
						resolve({
							action: 'push',
							screen: 'workflow',
							data: {
								filePath: item.filePath,
								workflowType: 'validate',
							},
						});
					}
				} else if (key.name === 'c') {
					// Cross-check selected submission
					const index = this.submissionList?.selectedIndex ?? -1;
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
				} else if (key.name === 'x') {
					// Delete broken entry (don't resolve - stay on screen)
					this.handleDelete().catch((error) => {
						if (this.statusText) {
							const msg = error instanceof Error ? error.message : 'Unknown error';
							this.statusText.content = `${symbols.info.error} Delete failed: ${msg}`;
						}
					});
				} else if (this.deleteConfirmIndex >= 0) {
					// Any other key cancels delete confirmation
					this.deleteConfirmIndex = -1;
					this.updateStatus();
				}
			};
			this.renderer.keyInput.on('keypress', this.keyHandler);

			// Focus list
			this.submissionList?.focus();
		});
	}

	cleanup(): void {
		if (this.keyHandler) {
			this.renderer.keyInput.off('keypress', this.keyHandler);
		}
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

	private buildUI(): void {
		this.container = new BoxRenderable(this.renderer, {
			id: CONTAINER_ID,
			flexDirection: 'column',
			width: '100%',
			height: '100%',
			backgroundColor: theme.background,
		});

		// Title
		this.container.add(
			new TextRenderable(this.renderer, {
				content: 'Submission History',
				fg: theme.primary,
			})
		);

		// Subtitle with count
		const brokenCount = this.historyItems.filter((i) => i.isBroken).length;
		const subtitle =
			this.historyItems.length === 0
				? 'No submissions found'
				: `${this.historyItems.length} submission${this.historyItems.length === 1 ? '' : 's'}${brokenCount > 0 ? ` ${symbols.bullet.dot} ${brokenCount} broken` : ''}`;
		this.container.add(
			new TextRenderable(this.renderer, {
				content: subtitle,
				fg: theme.textMuted,
			})
		);

		// Spacer
		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Submission list
		if (this.historyItems.length === 0) {
			this.container.add(
				new TextRenderable(this.renderer, {
					content: 'Convert a CSV to create your first submission.',
					fg: theme.textMuted,
				})
			);
		} else {
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
			this.container.add(this.submissionList);
		}

		// Detail panel
		this.detailPanel = new BoxRenderable(this.renderer, {
			flexDirection: 'column',
			width: '100%',
			backgroundColor: theme.background,
		});
		this.container.add(this.detailPanel);

		// Status bar
		this.statusText = new TextRenderable(this.renderer, {
			content: '',
			fg: theme.textMuted,
		});
		this.container.add(this.statusText);

		// Add to renderer
		this.renderer.root.add(this.container);

		// Initial status and detail panel
		this.updateStatus();
		if (this.historyItems.length > 0) {
			this.updateDetailPanel(0);
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

			// Format date and learner count
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
		if (!this.detailPanel) return;

		// Clear existing children
		const children = this.detailPanel.getChildren();
		for (const child of children) {
			this.detailPanel.remove(child.id);
		}

		if (index < 0 || index >= this.historyItems.length) return;

		const item = this.historyItems[index];

		// Spacer
		this.detailPanel.add(new TextRenderable(this.renderer, { content: '' }));

		if (item.isBroken) {
			// Broken entry
			this.detailPanel.add(
				new TextRenderable(this.renderer, {
					content: `${symbols.info.error} File not found on disk`,
					fg: theme.error,
				})
			);
			this.detailPanel.add(
				new TextRenderable(this.renderer, {
					content: `Original: ${item.entry.timestamp}  ${item.entry.learnerCount} learners`,
					fg: theme.textMuted,
				})
			);
			if (item.entry.checksum) {
				this.detailPanel.add(
					new TextRenderable(this.renderer, {
						content: `Checksum: ${item.entry.checksum.substring(0, 16)}...`,
						fg: theme.textMuted,
					})
				);
			}
		} else {
			// Healthy entry
			this.detailPanel.add(
				new TextRenderable(this.renderer, {
					content: `Filename: ${item.entry.filename}`,
					fg: theme.text,
				})
			);

			if (item.filePath) {
				// Abbreviate home directory
				const displayPath = item.filePath.replace(/^\/Users\/[^/]+/, '~');
				this.detailPanel.add(
					new TextRenderable(this.renderer, {
						content: `Path: ${displayPath}`,
						fg: theme.textMuted,
					})
				);
			}

			if (item.fileSize !== undefined) {
				const sizeKB = (item.fileSize / 1024).toFixed(1);
				this.detailPanel.add(
					new TextRenderable(this.renderer, {
						content: `Size: ${sizeKB} KB`,
						fg: theme.textMuted,
					})
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
			this.detailPanel.add(
				new TextRenderable(this.renderer, {
					content: `Date: ${dateStr}`,
					fg: theme.textMuted,
				})
			);

			this.detailPanel.add(
				new TextRenderable(this.renderer, {
					content: `Schema: ${item.entry.schema}`,
					fg: theme.textMuted,
				})
			);

			this.detailPanel.add(
				new TextRenderable(this.renderer, {
					content: `Learners: ${item.entry.learnerCount}`,
					fg: theme.textMuted,
				})
			);

			// Metadata fields (if available)
			if (item.metadata?.ukprn) {
				this.detailPanel.add(
					new TextRenderable(this.renderer, {
						content: `UKPRN: ${item.metadata.ukprn}`,
						fg: theme.textMuted,
					})
				);
			}

			if (item.metadata?.collectionYear && item.metadata?.serialNo) {
				this.detailPanel.add(
					new TextRenderable(this.renderer, {
						content: `Collection: ${item.metadata.collection || 'ILR'}-${item.metadata.collectionYear}-${item.metadata.serialNo}`,
						fg: theme.textMuted,
					})
				);
			}

			if (item.entry.checksum) {
				this.detailPanel.add(
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
		const index = this.submissionList?.selectedIndex ?? -1;
		if (index < 0 || index >= this.historyItems.length) return;

		const item = this.historyItems[index];

		// Only allow deletion of broken entries
		if (!item.isBroken) return;

		// Two-press confirm pattern
		if (this.deleteConfirmIndex === index) {
			// Confirmed — delete from history
			const storage = createStorage();
			const result = await storage.deleteHistoryEntry(item.entry.checksum);

			if (!result.success) {
				if (this.statusText) {
					this.statusText.content = `${symbols.info.error} Failed to delete history entry`;
				}
				this.deleteConfirmIndex = -1;
				return;
			}

			this.deleteConfirmIndex = -1;

			// Refresh history list
			await this.loadHistory();

			try {
				this.rebuildListAndHandlers();
				this.updateStatus();

				// Update detail panel for current selection (or clear if empty)
				const newIndex = Math.min(index, this.historyItems.length - 1);
				if (newIndex >= 0 && this.submissionList) {
					this.submissionList.setSelectedIndex(newIndex);
					this.updateDetailPanel(newIndex);
				}

				// Show success message briefly
				if (this.statusText) {
					const originalStatus = this.statusText.content;
					this.statusText.content = `${symbols.info.success} Entry deleted`;
					setTimeout(() => {
						if (this.statusText) {
							this.statusText.content = originalStatus;
						}
					}, 2000);
				}
			} catch (error) {
				throw new Error(`UI rebuild failed: ${error instanceof Error ? error.message : String(error)}`);
			}
		} else {
			// First press — ask for confirmation
			this.deleteConfirmIndex = index;
			this.updateStatus();
		}
	}

	private updateStatus(): void {
		if (!this.statusText) return;

		if (this.deleteConfirmIndex >= 0) {
			this.statusText.content = `${symbols.info.warning} Press x again to confirm deletion, or any other key to cancel`;
		} else if (this.historyItems.length === 0) {
			this.statusText.content = '[ESC/q] Back to Dashboard';
		} else {
			// Check if current selection is broken to show/hide delete option
			const index = this.submissionList?.selectedIndex ?? -1;
			const currentItem = this.historyItems[index];
			const showDelete = currentItem?.isBroken ?? false;

			const statusText = showDelete
				? '[↑↓] Navigate  [ENTER/v] Validate  [c] Cross-check  [x] Delete  [ESC/q] Back'
				: '[↑↓] Navigate  [ENTER/v] Validate  [c] Cross-check  [ESC/q] Back';
			this.statusText.content = statusText;
		}
	}

	private rebuildListAndHandlers(): void {
		if (!this.submissionList || !this.container) return;

		// Remove old list
		this.container.remove(this.submissionList.id);

		// Rebuild list with updated options
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

		// Re-attach selection change handler
		this.submissionList.on('selectionChanged', (index: number) => {
			this.deleteConfirmIndex = -1;
			this.updateDetailPanel(index);
			this.updateStatus();
		});

		// Re-add to container (before detail panel and status bar)
		// Container children order: title, subtitle, spacer, list, detail, status
		const children = this.container.getChildren();
		const detailPanelIndex = children.findIndex(c => c.id === this.detailPanel?.id);
		if (detailPanelIndex > 0) {
			this.container.insertBefore(this.submissionList, children[detailPanelIndex].id);
		} else {
			this.container.add(this.submissionList);
		}

		this.submissionList.focus();
	}
}

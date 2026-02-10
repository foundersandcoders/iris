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

	// Renderables
	private container?: BoxRenderable;
	private submissionList?: SelectRenderable;
	private detailPanel?: BoxRenderable;

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		await this.loadHistory();
		this.buildUI();

		// Wait for user interaction
		return new Promise((resolve) => {
			// Selection change handler — update detail panel
			this.submissionList?.on('selectionChanged', (index: number) => {
				this.updateDetailPanel(index);
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
			// Resolve expected file path in user-visible submissions directory
			const filePath = join(storage.paths.submissions, entry.filename);
			let fileSize: number | undefined;
			let metadata: SubmissionMetadata | undefined;
			let isBroken = false;

			try {
				// Check if XML file exists on disk
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
				// File doesn't exist or is unreadable
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
		const statusText = this.historyItems.length === 0
			? '[ESC/q] Back to Dashboard'
			: '[↑↓] Navigate  [ENTER/v] Validate  [c] Cross-check  [ESC/q] Back';
		this.container.add(
			new TextRenderable(this.renderer, {
				content: statusText,
				fg: theme.textMuted,
			})
		);

		// Add to renderer
		this.renderer.root.add(this.container);

		// Initial detail panel update
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
}

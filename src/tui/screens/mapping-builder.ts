/** ====== Mapping Builder Screen ======
 * List and manage CSV→XSD mapping configurations.
 * Entry point to the mapping editor workflow.
 */
import {
	BoxRenderable,
	TextRenderable,
	SelectRenderable,
	SelectRenderableEvents,
	type KeyEvent,
	type SelectOption,
} from '@opentui/core';
import type { RenderContext, Renderer } from '../types';
import { theme, symbols } from '../../../brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import type { MappingConfig } from '../../lib/types/schemaTypes';
import { createStorage } from '../../lib/storage';

const CONTAINER_ID = 'mapping-builder-root';

/** Bundled mapping ID — cannot be deleted */
const BUNDLED_ID = 'fac-airtable-2025';

interface MappingListItem {
	id: string;
	name: string;
	version: string;
	fieldCount: number;
	isBundled: boolean;
	schemaDisplay?: string;
}

export class MappingBuilderScreen implements Screen {
	readonly name = 'mapping-builder';
	private renderer: Renderer;
	private keyHandler?: (key: KeyEvent) => void;

	// State
	private mappingItems: MappingListItem[] = [];
	private deleteConfirmIndex = -1;

	// Renderables
	private container?: BoxRenderable;
	private listSelect?: SelectRenderable;
	private detailPanel?: BoxRenderable;
	private statusText?: TextRenderable;

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		await this.loadMappings();
		this.buildUI();

		return new Promise((resolve) => {
			// List selection changed — update detail panel
			this.listSelect?.on(SelectRenderableEvents.SELECTION_CHANGED, (index: number) => {
				this.deleteConfirmIndex = -1;
				this.updateDetailPanel(index);
				this.updateStatus();
			});

			// Item selected — edit
			this.listSelect?.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
				const value = option.value as string;

				if (value === '__create__') {
					this.renderer.keyInput.off('keypress', this.keyHandler!);
					resolve({
						action: 'push',
						screen: 'mapping-editor',
						data: { mode: 'create' },
					});
				} else {
					this.renderer.keyInput.off('keypress', this.keyHandler!);
					resolve({
						action: 'push',
						screen: 'mapping-editor',
						data: { mode: 'edit', mappingId: value },
					});
				}
			});

			// Key handler
			this.keyHandler = (key: KeyEvent) => {
				if (key.name === 'escape') {
					this.renderer.keyInput.off('keypress', this.keyHandler!);
					resolve({ action: 'pop' });
				} else if (key.name === 'n') {
					this.renderer.keyInput.off('keypress', this.keyHandler!);
					resolve({
						action: 'push',
						screen: 'mapping-editor',
						data: { mode: 'create' },
					});
				} else if (key.name === 'd') {
					this.duplicateSelected(resolve);
				} else if (key.name === 'x') {
					this.handleDelete(resolve);
				}
			};
			this.renderer.keyInput.on('keypress', this.keyHandler);

			// Initial focus + detail
			this.listSelect?.focus();
			if (this.mappingItems.length > 0) {
				this.updateDetailPanel(0);
			}
		});
	}

	cleanup(): void {
		if (this.keyHandler) {
			this.renderer.keyInput.off('keypress', this.keyHandler);
		}
		this.renderer.root.remove(CONTAINER_ID);
	}

	// === Data Loading ===

	private async loadMappings(): Promise<void> {
		const storage = createStorage();
		const listResult = await storage.listMappings();
		if (!listResult.success) return;

		this.mappingItems = [];

		for (const id of listResult.data) {
			const loadResult = await storage.loadMapping(id);
			if (loadResult.success) {
				const mapping = loadResult.data;
				this.mappingItems.push({
					id: mapping.id,
					name: mapping.name,
					version: mapping.mappingVersion,
					fieldCount: mapping.mappings.length,
					isBundled: mapping.id === BUNDLED_ID,
					schemaDisplay: mapping.targetSchema.displayName,
				});
			} else {
				// Mapping exists but failed to load — show as broken
				this.mappingItems.push({
					id,
					name: `${id} (failed to load)`,
					version: '?',
					fieldCount: 0,
					isBundled: id === BUNDLED_ID,
				});
			}
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
		this.container.add(new TextRenderable(this.renderer, {
			content: 'Mapping Builder',
			fg: theme.primary,
		}));

		this.container.add(new TextRenderable(this.renderer, {
			content: 'Manage CSV→XSD mapping configurations',
			fg: theme.textMuted,
		}));

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Mapping list
		this.listSelect = new SelectRenderable(this.renderer, {
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
		this.container.add(this.listSelect);

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Detail panel
		this.detailPanel = new BoxRenderable(this.renderer, {
			flexDirection: 'column',
		});
		this.container.add(this.detailPanel);

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Status bar
		this.statusText = new TextRenderable(this.renderer, {
			content: '[ENTER] Edit  [n] New  [d] Duplicate  [x] Delete  [ESC] Back',
			fg: theme.textMuted,
		});
		this.container.add(this.statusText);

		this.renderer.root.add(this.container);
	}

	private buildListOptions(): SelectOption[] {
		const options: SelectOption[] = [];

		// Create new option
		options.push({
			name: '+ Create New Mapping',
			description: '',
			value: '__create__',
		});

		// Existing mappings
		for (const item of this.mappingItems) {
			const prefix = item.isBundled ? `${symbols.bullet.dot} ` : '  ';
			const suffix = item.isBundled ? ' (bundled)' : '';
			options.push({
				name: `${prefix}${item.name}${suffix}`,
				description: `${item.fieldCount} fields ${symbols.bullet.dot} v${item.version}`,
				value: item.id,
			});
		}

		return options;
	}

	private updateDetailPanel(index: number): void {
		if (!this.detailPanel) return;

		// Clear existing
		const children = this.detailPanel.getChildren();
		for (const child of children) {
			this.detailPanel.remove(child.id);
		}

		// Offset by 1 for "Create New" option
		const itemIndex = index - 1;
		if (itemIndex < 0 || itemIndex >= this.mappingItems.length) {
			this.detailPanel.add(new TextRenderable(this.renderer, {
				content: 'Create a new mapping configuration',
				fg: theme.textMuted,
			}));
			return;
		}

		const item = this.mappingItems[itemIndex];

		this.detailPanel.add(new TextRenderable(this.renderer, {
			content: `Name: ${item.name}`,
			fg: theme.text,
		}));

		this.detailPanel.add(new TextRenderable(this.renderer, {
			content: `Version: ${item.version} ${symbols.bullet.dot} Schema: ${item.schemaDisplay || 'Unknown'}`,
			fg: theme.textMuted,
		}));

		this.detailPanel.add(new TextRenderable(this.renderer, {
			content: `Fields: ${item.fieldCount} column mappings`,
			fg: theme.textMuted,
		}));

		if (item.isBundled) {
			this.detailPanel.add(new TextRenderable(this.renderer, {
				content: `${symbols.info.warning} Bundled mapping — read-only, duplicate to customise`,
				fg: theme.warning,
			}));
		}
	}

	private updateStatus(): void {
		if (!this.statusText) return;

		if (this.deleteConfirmIndex >= 0) {
			this.statusText.content = `${symbols.info.warning} Press x again to confirm deletion, or any other key to cancel`;
		} else {
			this.statusText.content = '[ENTER] Edit  [n] New  [d] Duplicate  [x] Delete  [ESC] Back';
		}
	}

	// === Actions ===

	private duplicateSelected(resolve: (result: ScreenResult) => void): void {
		if (!this.listSelect) return;

		const index = this.listSelect.selectedIndex - 1; // Offset for "Create New"
		if (index < 0 || index >= this.mappingItems.length) return;

		const item = this.mappingItems[index];
		this.renderer.keyInput.off('keypress', this.keyHandler!);
		resolve({
			action: 'push',
			screen: 'mapping-editor',
			data: { mode: 'duplicate', mappingId: item.id },
		});
	}

	private async handleDelete(resolve: (result: ScreenResult) => void): Promise<void> {
		if (!this.listSelect) return;

		const index = this.listSelect.selectedIndex - 1;
		if (index < 0 || index >= this.mappingItems.length) return;

		const item = this.mappingItems[index];

		// Block bundled deletion
		if (item.isBundled) return;

		// Two-press confirm
		if (this.deleteConfirmIndex === index) {
			// Confirmed — delete
			const storage = createStorage();
			await storage.deleteMapping(item.id);
			this.deleteConfirmIndex = -1;

			// Refresh
			await this.loadMappings();
			if (this.listSelect) {
				this.listSelect.options = this.buildListOptions();
			}
			this.updateStatus();
		} else {
			// First press — ask for confirmation
			this.deleteConfirmIndex = index;
			this.updateStatus();
		}
	}
}

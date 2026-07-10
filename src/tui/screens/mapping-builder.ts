/** ====== Mapping Builder Screen ======
 * List and manage CSV→XSD mapping configurations.
 * Entry point to the mapping editor workflow.
 */
import { BoxRenderable, TextRenderable, SelectRenderable, SelectRenderableEvents, type SelectOption } from '@opentui/core';
import type { RenderContext, Renderer } from '../types';
import { theme, symbols } from '../../../assets/brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import { createStorage } from '../../lib/storage';
import { appShell, panel, type AppShell, type Panel } from '../components';
import { Keymap } from '../utils/keymap';

const CONTAINER_ID = 'mapping-builder-root';

/** Bundled mapping ID — cannot be deleted */
const BUNDLED_ID = 'fac-airtable-2025';

interface MappingListItem {
	id: string;
	name: string;
	version: string;
	fieldCount: number;
	isBundled: boolean;
	isBroken: boolean;
	schemaDisplay?: string;
}

export class MappingBuilderScreen implements Screen {
	readonly name = 'mapping-builder';
	private renderer: Renderer;
	private shell?: AppShell;
	private listPanel?: Panel;
	private keymap?: Keymap;

	// State
	private mappingItems: MappingListItem[] = [];
	private deleteConfirmIndex = -1;

	// Renderables
	private listSelect?: SelectRenderable;
	private detailPanel?: BoxRenderable;

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		// Load config for csvInputDir used by file-picker
		const storage = createStorage();
		const configResult = await storage.loadConfig();
		const csvInputDir = configResult.success ? configResult.data.csvInputDir : undefined;

		await this.loadMappings();

		return new Promise((resolve) => {
			const goCreate = () =>
				resolve({
					action: 'push',
					screen: 'file-picker',
					data: {
						fileExtension: '.csv',
						title: 'Select CSV for New Mapping',
						workflowType: 'mapping-create',
						mode: 'create',
						path: csvInputDir,
					},
				});

			const keymap = this.buildUI(resolve);

			// List selection changed — update detail panel
			this.listSelect?.on(SelectRenderableEvents.SELECTION_CHANGED, (index: number) => {
				this.deleteConfirmIndex = -1;
				this.updateDetailPanel(index);
				this.updateFooter();
			});

			// Item selected — edit
			this.listSelect?.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
				const value = option.value as string;

				// Block edit on broken entries
				const itemIndex = index - 1;
				const item = itemIndex >= 0 ? this.mappingItems[itemIndex] : null;
				if (item?.isBroken) return;

				if (value === '__create__') {
					goCreate();
				} else {
					resolve({ action: 'push', screen: 'mapping-editor', data: { mode: 'edit', mappingId: value } });
				}
			});

			// Initial focus + detail
			this.listSelect?.focus();
			if (this.mappingItems.length > 0) {
				this.updateDetailPanel(0);
			}

			this.keymapGoCreate = goCreate;
			keymap.attach(this.renderer);
		});
	}

	cleanup(): void {
		this.keymap?.detach(this.renderer);
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
					isBroken: false,
					schemaDisplay: mapping.targetSchema.displayName,
				});
			} else {
				// Mapping exists but failed to load — show as broken
				this.mappingItems.push({
					id,
					name: id,
					version: '?',
					fieldCount: 0,
					isBundled: id === BUNDLED_ID,
					isBroken: true,
				});
			}
		}
	}

	// === UI Building ===

	/** Bound during render() so keymap bindings (built before the resolve-closures) can reach it. */
	private keymapGoCreate?: () => void;

	private buildUI(resolve: (result: ScreenResult) => void): Keymap {
		this.keymap = new Keymap({
			bindings: [
				{
					keys: ['up', 'down', 'k', 'j'],
					hint: `${symbols.arrows.up}${symbols.arrows.down}`,
					label: 'Navigate',
					handler: () => {},
				},
				// Edit — SelectRenderable ITEM_SELECTED owns Enter; this is bar-only.
				{ keys: ['enter'], label: 'Edit', handler: () => {} },
				{ keys: ['n'], label: 'New', handler: () => this.keymapGoCreate?.() },
				{ keys: ['d'], label: 'Duplicate', handler: () => this.duplicateSelected(resolve) },
				{
					keys: ['x'],
					label: 'Delete',
					handler: () => {
						this.handleDelete(resolve).catch(() => {
							this.shell?.setFooter(`${symbols.info.error} Delete failed — try again`);
						});
					},
				},
			],
			onBack: () => resolve({ action: 'pop' }),
		});
		const keymap = this.keymap;

		this.shell = appShell(this.renderer, {
			id: CONTAINER_ID,
			breadcrumb: 'Mapping Builder',
			footer: keymap.toKeybar(),
		});

		this.shell.content.add(
			new TextRenderable(this.renderer, {
				content: 'Manage CSV→XSD mapping configurations',
				fg: theme.textMuted,
			})
		);

		this.shell.content.add(new TextRenderable(this.renderer, { content: '' }));

		const body = new BoxRenderable(this.renderer, { flexDirection: 'row', flexGrow: 1 });

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

		this.listPanel = panel(this.renderer, { title: 'Mappings', flexGrow: 1, focused: true });
		this.listPanel.add(this.listSelect);
		body.add(this.listPanel.box);

		// Detail — non-interactive, never a focus target, so a plain box rather than a panel.
		this.detailPanel = new BoxRenderable(this.renderer, { flexDirection: 'column', width: '40%' });
		body.add(this.detailPanel);

		this.shell.content.add(body);

		this.renderer.root.add(this.shell.root);

		return keymap;
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
			if (item.isBroken) {
				options.push({
					name: `${symbols.info.error} ${item.name} (corrupt)`,
					description: 'Failed to load — press [x] to delete',
					value: item.id,
				});
			} else {
				const prefix = item.isBundled ? `${symbols.bullet.dot} ` : '  ';
				const suffix = item.isBundled ? ' (bundled)' : '';
				options.push({
					name: `${prefix}${item.name}${suffix}`,
					description: `${item.fieldCount} fields ${symbols.bullet.dot} v${item.version}`,
					value: item.id,
				});
			}
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
			this.detailPanel.add(
				new TextRenderable(this.renderer, {
					content: 'Create a new mapping configuration',
					fg: theme.textMuted,
				})
			);
			return;
		}

		const item = this.mappingItems[itemIndex];

		if (item.isBroken) {
			this.detailPanel.add(
				new TextRenderable(this.renderer, {
					content: `${symbols.info.error} ${item.name} — corrupt or unreadable`,
					fg: theme.error,
				})
			);
			this.detailPanel.add(
				new TextRenderable(this.renderer, {
					content: 'Press [x] to delete this entry',
					fg: theme.textMuted,
				})
			);
			return;
		}

		this.detailPanel.add(
			new TextRenderable(this.renderer, {
				content: `Name: ${item.name}`,
				fg: theme.text,
			})
		);

		this.detailPanel.add(
			new TextRenderable(this.renderer, {
				content: `Version: ${item.version} ${symbols.bullet.dot} Schema: ${item.schemaDisplay || 'Unknown'}`,
				fg: theme.textMuted,
			})
		);

		this.detailPanel.add(
			new TextRenderable(this.renderer, {
				content: `Fields: ${item.fieldCount} column mappings`,
				fg: theme.textMuted,
			})
		);

		if (item.isBundled) {
			this.detailPanel.add(
				new TextRenderable(this.renderer, {
					content: `${symbols.info.warning} Bundled mapping — read-only, duplicate to customise`,
					fg: theme.warning,
				})
			);
		}
	}

	private updateFooter(): void {
		if (!this.shell || !this.keymap) return;

		if (this.deleteConfirmIndex >= 0) {
			this.shell.setFooter(`${symbols.info.warning} Press x again to confirm deletion, or any other key to cancel`);
		} else {
			this.shell.setFooter(this.keymap.toKeybar());
		}
	}

	// === Actions ===

	private duplicateSelected(resolve: (result: ScreenResult) => void): void {
		if (!this.listSelect) return;

		const index = this.listSelect.selectedIndex - 1; // Offset for "Create New"
		if (index < 0 || index >= this.mappingItems.length) return;

		const item = this.mappingItems[index];
		resolve({ action: 'push', screen: 'mapping-editor', data: { mode: 'duplicate', mappingId: item.id } });
	}

	private async handleDelete(resolve: (result: ScreenResult) => void): Promise<void> {
		if (!this.listSelect) return;

		const index = this.listSelect.selectedIndex - 1;
		if (index < 0 || index >= this.mappingItems.length) return;

		const item = this.mappingItems[index];

		// Block bundled deletion (unless broken — always allow cleaning up corrupt entries)
		if (item.isBundled && !item.isBroken) {
			this.shell?.setFooter(`${symbols.info.warning} Bundled mappings cannot be deleted — duplicate to customise`);
			return;
		}

		// Two-press confirm
		if (this.deleteConfirmIndex === index) {
			// Confirmed — delete
			const storage = createStorage();
			const result = await storage.deleteMapping(item.id);
			if (!result.success) {
				this.shell?.setFooter(`${symbols.info.error} Failed to delete mapping`);
				this.deleteConfirmIndex = -1;
				return;
			}
			this.deleteConfirmIndex = -1;

			// Refresh
			await this.loadMappings();
			if (this.listSelect) {
				this.listSelect.options = this.buildListOptions();
			}
			this.updateFooter();
		} else {
			// First press — ask for confirmation
			this.deleteConfirmIndex = index;
			this.updateFooter();
		}
	}
}

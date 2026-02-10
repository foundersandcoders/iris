/** ====== Mapping Editor Screen ======
 * Two-panel CSV→XSD mapping editor with live preview.
 * Left panel: current mappings. Right panel: XSD paths with search.
 * Template pattern for aim fields ({n} placeholder).
 */
import {
	BoxRenderable,
	TextRenderable,
	SelectRenderable,
	SelectRenderableEvents,
	InputRenderable,
	InputRenderableEvents,
	type KeyEvent,
	type SelectOption,
} from '@opentui/core';
import type { RenderContext, Renderer } from '../types';
import { theme, symbols } from '../../../brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import type { ColumnMapping, MappingConfig, SchemaReference } from '../../lib/types/schemaTypes';
import type { SchemaElement, SchemaRegistry } from '../../lib/types/interpreterTypes';
import { isRequired } from '../../lib/types/interpreterTypes';
import { createStorage } from '../../lib/storage';
import { buildSchemaRegistry } from '../../lib/schema/registryBuilder';
import { validateMappingStructure } from '../../lib/mappings/validate';
import { ALL_BUILDER_PATHS } from '../../lib/mappings/builderPaths';

const CONTAINER_ID = 'mapping-editor-root';

/** Only Learner paths need CSV column mappings — everything else is auto-populated */
const LEARNER_PREFIX = 'Message.Learner.';

/** Learner-level paths that are auto-generated (not from CSV) */
const AUTO_LEARNER_PATHS = new Set<string>([
	'Message.Learner.LearningDelivery.AimSeqNumber',
	'Message.Learner.LearningDelivery.SWSupAimId',
	...ALL_BUILDER_PATHS,
]);

/** Available transform functions */
const TRANSFORMS = ['none', 'trim', 'uppercase', 'lowercase', 'stringToInt', 'postcode', 'dateToISO'];

/** Detect if a CSV column name uses the {n} aim template pattern */
function isAimTemplate(csvColumn: string): boolean {
	return csvColumn.includes('{n}');
}

/** Collapse aim-specific mappings into template rows for display */
function collapseAimMappings(mappings: ColumnMapping[]): ColumnMapping[] {
	const templates = new Map<string, ColumnMapping>();
	const nonAim: ColumnMapping[] = [];

	for (const m of mappings) {
		if (m.aimNumber !== undefined) {
			// Reconstruct template key from the pattern
			const templateCsv = m.csvColumn.replace(/\d+/, '{n}');
			const key = `${templateCsv}::${m.xsdPath}`;
			if (!templates.has(key)) {
				templates.set(key, {
					csvColumn: templateCsv,
					xsdPath: m.xsdPath,
					transform: m.transform,
				});
			}
		} else {
			nonAim.push(m);
		}
	}

	return [...nonAim, ...templates.values()];
}

/** Count how many aims a template would expand to */
function countAimExpansions(mappings: ColumnMapping[], templateCsv: string): number {
	const pattern = templateCsv.replace('{n}', '\\d+');
	const regex = new RegExp(`^${pattern}$`, 'i');
	const aimNumbers = new Set<number>();
	for (const m of mappings) {
		if (m.aimNumber !== undefined && regex.test(m.csvColumn)) {
			aimNumbers.add(m.aimNumber);
		}
	}
	return aimNumbers.size || 5; // Default to 5 if no existing expansions
}

export class MappingEditorScreen implements Screen {
	readonly name = 'mapping-editor';
	private renderer: Renderer;
	private keyHandler?: (key: KeyEvent) => void;

	// State
	private mappings: ColumnMapping[] = [];
	private mappingName = '';
	private mappingId = '';
	private mappingVersion = '1.0.0';
	private targetSchema: SchemaReference = {
		namespace: 'ESFA/ILR/2025-26',
		version: '1.0',
		displayName: 'ILR 2025-26 Schema',
	};
	private existingId?: string;
	private dirty = false;

	// Schema data
	private registry?: SchemaRegistry;
	private leafPaths: string[] = [];
	private filteredPaths: string[] = [];
	private searchQuery = '';

	// UI state
	private activePanel: 'left' | 'right' = 'left';
	private displayMappings: ColumnMapping[] = [];

	// Renderables
	private container?: BoxRenderable;
	private leftSelect?: SelectRenderable;
	private rightSelect?: SelectRenderable;
	private searchInput?: InputRenderable;
	private previewPanel?: BoxRenderable;
	private statusText?: TextRenderable;
	private titleText?: TextRenderable;
	private summaryText?: TextRenderable;

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		const mode = (data?.mode as 'create' | 'edit' | 'duplicate') || 'create';
		const mappingId = data?.mappingId as string | undefined;

		// Load schema registry for XSD paths
		await this.loadSchema();

		// Load existing mapping if editing or duplicating
		if ((mode === 'edit' || mode === 'duplicate') && mappingId) {
			await this.loadMapping(mappingId, mode);
		} else {
			this.mappingName = 'New Mapping';
			this.mappingId = '';
		}

		// Build collapsed display mappings
		this.displayMappings = collapseAimMappings(this.mappings);

		this.buildUI();

		return new Promise((resolve) => {
			// Left panel: mapping list interactions
			this.leftSelect?.on(SelectRenderableEvents.ITEM_SELECTED, (_index: number, option: SelectOption) => {
				const value = option.value as string;
				if (value === '__add__') {
					// Switch to right panel to pick an XSD path for a new mapping
					this.activePanel = 'right';
					this.focusActivePanel();
				} else if (value === '__remove__') {
					// Remove currently highlighted mapping
					this.removeSelectedMapping();
				}
			});

			this.leftSelect?.on(SelectRenderableEvents.SELECTION_CHANGED, (_index: number, option: SelectOption | null) => {
				if (option) {
					this.updatePreview();
				}
			});

			// Right panel: XSD path selection
			this.rightSelect?.on(SelectRenderableEvents.ITEM_SELECTED, (_index: number, option: SelectOption) => {
				const xsdPath = option.value as string;
				if (xsdPath) {
					this.addMapping(xsdPath);
				}
			});

			// Search input
			this.searchInput?.on(InputRenderableEvents.INPUT, () => {
				this.searchQuery = this.searchInput?.value ?? '';
				this.filterPaths();
				this.updateRightPanel();
			});

			this.searchInput?.on(InputRenderableEvents.ENTER, () => {
				// Move focus to right panel after search
				this.activePanel = 'right';
				this.rightSelect?.focus();
			});

			// Key handler
			this.keyHandler = (key: KeyEvent) => {
				if (key.name === 'tab') {
					this.togglePanel();
				} else if (key.name === 'escape') {
					if (this.activePanel === 'right' && this.searchQuery) {
						// Clear search first
						this.searchQuery = '';
						if (this.searchInput) this.searchInput.value = '';
						this.filterPaths();
						this.updateRightPanel();
					} else {
						// Pop back (with dirty check)
						this.renderer.keyInput.off('keypress', this.keyHandler!);
						resolve({ action: 'pop' });
					}
				} else if (key.name === 's' && this.activePanel === 'left') {
					// Save — push to mapping-save screen
					this.renderer.keyInput.off('keypress', this.keyHandler!);
					resolve({
						action: 'push',
						screen: 'mapping-save',
						data: {
							mapping: this.buildMappingConfig(),
							existingId: this.existingId,
						},
					});
				} else if (key.name === 't' && this.activePanel === 'left') {
					this.cycleTransform();
				} else if (key.name === 'x' && this.activePanel === 'left') {
					this.removeSelectedMapping();
				} else if (key.name === '/') {
					// Focus search
					this.activePanel = 'right';
					this.searchInput?.focus();
				}
			};
			this.renderer.keyInput.on('keypress', this.keyHandler);

			// Initial focus
			this.focusActivePanel();
		});
	}

	cleanup(): void {
		if (this.keyHandler) {
			this.renderer.keyInput.off('keypress', this.keyHandler);
		}
		this.renderer.root.remove(CONTAINER_ID);
	}

	// === Data Loading ===

	private async loadSchema(): Promise<void> {
		try {
			const storage = createStorage();
			const schemaResult = await storage.loadSchema('schemafile25.xsd');
			if (schemaResult.success) {
				this.registry = buildSchemaRegistry(schemaResult.data);
				// Extract mappable leaf paths: Learner fields only, excluding auto-generated
				this.leafPaths = [];
				for (const [path, el] of this.registry.elementsByPath) {
					if (el.isComplex) continue;
					if (!path.startsWith(LEARNER_PREFIX)) continue;
					if (AUTO_LEARNER_PATHS.has(path)) continue;
					this.leafPaths.push(path);
				}
				this.leafPaths.sort();
				this.filteredPaths = [...this.leafPaths];
			}
		} catch {
			// Schema loading failed — editor still works, just no XSD paths
		}
	}

	private async loadMapping(id: string, mode: 'edit' | 'duplicate'): Promise<void> {
		try {
			const storage = createStorage();
			const result = await storage.loadMapping(id);
			if (result.success) {
				const mapping = result.data;
				this.mappings = [...mapping.mappings];
				this.mappingName = mode === 'duplicate' ? `${mapping.name} (copy)` : mapping.name;
				this.mappingId = mode === 'duplicate' ? '' : mapping.id;
				this.mappingVersion = mapping.mappingVersion;
				this.targetSchema = { ...mapping.targetSchema };
				this.existingId = mode === 'edit' ? mapping.id : undefined;
			}
		} catch {
			// Failed to load — start fresh
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
		this.titleText = new TextRenderable(this.renderer, {
			content: `Edit Mapping: ${this.mappingName}`,
			fg: theme.primary,
		});
		this.container.add(this.titleText);

		// Summary
		const mappingCount = this.displayMappings.length;
		const validation = validateMappingStructure(this.buildMappingConfig());
		this.summaryText = new TextRenderable(this.renderer, {
			content: `${mappingCount} mappings ${symbols.bullet.dot} ${validation.issues.length} issues`,
			fg: theme.textMuted,
		});
		this.container.add(this.summaryText);

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Editor area: two columns
		const editorRow = new BoxRenderable(this.renderer, {
			flexDirection: 'row',
			width: '100%',
			flexGrow: 1,
		});

		// Left panel: current mappings
		const leftCol = new BoxRenderable(this.renderer, {
			flexDirection: 'column',
			width: '50%',
		});
		leftCol.add(new TextRenderable(this.renderer, {
			content: 'Mapped Fields',
			fg: theme.text,
		}));

		this.leftSelect = new SelectRenderable(this.renderer, {
			options: this.buildLeftOptions(),
			backgroundColor: theme.background,
			focusedBackgroundColor: theme.background,
			selectedBackgroundColor: theme.highlightFocused,
			selectedTextColor: theme.text,
			textColor: theme.text,
			focusedTextColor: theme.text,
			descriptionColor: theme.textMuted,
			flexGrow: 1,
		});
		leftCol.add(this.leftSelect);
		editorRow.add(leftCol);

		// Right panel: XSD paths
		const rightCol = new BoxRenderable(this.renderer, {
			flexDirection: 'column',
			width: '50%',
		});
		rightCol.add(new TextRenderable(this.renderer, {
			content: 'Schema Fields',
			fg: theme.text,
		}));

		this.searchInput = new InputRenderable(this.renderer, {
			placeholder: 'Search XSD paths...',
			width: '100%',
		});
		rightCol.add(this.searchInput);

		this.rightSelect = new SelectRenderable(this.renderer, {
			options: this.buildRightOptions(),
			backgroundColor: theme.background,
			focusedBackgroundColor: theme.background,
			selectedBackgroundColor: theme.highlightUnfocused,
			selectedTextColor: theme.text,
			textColor: theme.text,
			focusedTextColor: theme.text,
			descriptionColor: theme.textMuted,
			flexGrow: 1,
			showScrollIndicator: true,
		});
		rightCol.add(this.rightSelect);
		editorRow.add(rightCol);

		this.container.add(editorRow);

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Preview panel
		this.previewPanel = new BoxRenderable(this.renderer, {
			flexDirection: 'column',
		});
		this.container.add(this.previewPanel);
		this.updatePreview();

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Status bar
		this.statusText = new TextRenderable(this.renderer, {
			content: '[TAB] Panel  [ENTER] Map  [/] Search  [t] Transform  [x] Delete  [s] Save  [ESC] Back',
			fg: theme.textMuted,
		});
		this.container.add(this.statusText);

		this.renderer.root.add(this.container);
	}

	private buildLeftOptions(): SelectOption[] {
		const options: SelectOption[] = [];

		for (const m of this.displayMappings) {
			const isTemplate = isAimTemplate(m.csvColumn);
			const aimCount = isTemplate ? countAimExpansions(this.mappings, m.csvColumn) : 0;
			const pathShort = m.xsdPath.split('.').slice(-1)[0];
			const transformLabel = m.transform ? ` [${m.transform}]` : '';
			const aimLabel = isTemplate ? ` (${symbols.bullet.dot}${aimCount} aims)` : '';

			options.push({
				name: `${m.csvColumn} ${symbols.arrows.right} ${pathShort}${transformLabel}${aimLabel}`,
				description: m.xsdPath,
				value: m.xsdPath,
			});
		}

		options.push({
			name: '+ Add mapping',
			description: '',
			value: '__add__',
		});

		return options;
	}

	private buildRightOptions(): SelectOption[] {
		const mapped = new Set(this.mappings.map((m) => m.xsdPath));

		return this.filteredPaths.map((path) => {
			const el = this.registry?.elementsByPath.get(path);
			const required = el && isRequired(el);
			const isMapped = mapped.has(path);
			const prefix = isMapped ? `${symbols.info.success} ` : required ? `${symbols.info.required} ` : '  ';
			const shortPath = path.split('.').slice(-2).join('.');

			return {
				name: `${prefix}${shortPath}`,
				description: path,
				value: path,
			};
		});
	}

	// === Interactions ===

	private togglePanel(): void {
		this.activePanel = this.activePanel === 'left' ? 'right' : 'left';
		this.focusActivePanel();
	}

	private focusActivePanel(): void {
		if (this.activePanel === 'left') {
			this.leftSelect?.focus();
			if (this.leftSelect) this.leftSelect.selectedBackgroundColor = theme.highlightFocused;
			if (this.rightSelect) this.rightSelect.selectedBackgroundColor = theme.highlightUnfocused;
		} else {
			this.rightSelect?.focus();
			if (this.rightSelect) this.rightSelect.selectedBackgroundColor = theme.highlightFocused;
			if (this.leftSelect) this.leftSelect.selectedBackgroundColor = theme.highlightUnfocused;
		}
	}

	private addMapping(xsdPath: string): void {
		// Prompt-less add: use the last segment as default CSV column name
		const csvColumn = xsdPath.split('.').slice(-1)[0];

		// Check if already mapped
		const existing = this.mappings.find((m) => m.xsdPath === xsdPath && !m.aimNumber);
		if (existing) return; // Already mapped

		this.mappings.push({
			csvColumn,
			xsdPath,
		});

		this.dirty = true;
		this.refreshDisplay();

		// Switch to left panel to show the new mapping
		this.activePanel = 'left';
		this.focusActivePanel();
	}

	private removeSelectedMapping(): void {
		if (!this.leftSelect) return;

		const options = this.leftSelect.options;
		const index = this.leftSelect.selectedIndex;
		if (index < 0 || index >= this.displayMappings.length) return;

		const displayMapping = this.displayMappings[index];
		if (!displayMapping) return;

		if (isAimTemplate(displayMapping.csvColumn)) {
			// Remove all aim expansions matching this template
			const pattern = displayMapping.csvColumn.replace('{n}', '\\d+');
			const regex = new RegExp(`^${pattern}$`, 'i');
			this.mappings = this.mappings.filter(
				(m) => !(m.xsdPath === displayMapping.xsdPath && regex.test(m.csvColumn))
			);
		} else {
			// Remove exact match
			this.mappings = this.mappings.filter(
				(m) => !(m.csvColumn === displayMapping.csvColumn && m.xsdPath === displayMapping.xsdPath)
			);
		}

		this.dirty = true;
		this.refreshDisplay();
	}

	private cycleTransform(): void {
		if (!this.leftSelect) return;

		const index = this.leftSelect.selectedIndex;
		if (index < 0 || index >= this.displayMappings.length) return;

		const displayMapping = this.displayMappings[index];
		if (!displayMapping) return;

		const currentTransform = displayMapping.transform || 'none';
		const currentIdx = TRANSFORMS.indexOf(currentTransform);
		const nextTransform = TRANSFORMS[(currentIdx + 1) % TRANSFORMS.length];
		const newTransform = nextTransform === 'none' ? undefined : nextTransform;

		// Apply to all matching mappings (handles aim templates)
		if (isAimTemplate(displayMapping.csvColumn)) {
			const pattern = displayMapping.csvColumn.replace('{n}', '\\d+');
			const regex = new RegExp(`^${pattern}$`, 'i');
			for (const m of this.mappings) {
				if (m.xsdPath === displayMapping.xsdPath && regex.test(m.csvColumn)) {
					m.transform = newTransform;
				}
			}
		} else {
			for (const m of this.mappings) {
				if (m.csvColumn === displayMapping.csvColumn && m.xsdPath === displayMapping.xsdPath) {
					m.transform = newTransform;
				}
			}
		}

		this.dirty = true;
		this.refreshDisplay();
	}

	private filterPaths(): void {
		if (!this.searchQuery) {
			this.filteredPaths = [...this.leafPaths];
		} else {
			const query = this.searchQuery.toLowerCase();
			this.filteredPaths = this.leafPaths.filter((p) =>
				p.toLowerCase().includes(query)
			);
		}
	}

	// === Display Updates ===

	private refreshDisplay(): void {
		this.displayMappings = collapseAimMappings(this.mappings);

		if (this.leftSelect) {
			this.leftSelect.options = this.buildLeftOptions();
		}
		if (this.rightSelect) {
			this.rightSelect.options = this.buildRightOptions();
		}
		this.updatePreview();
		this.updateSummary();
	}

	private updateRightPanel(): void {
		if (this.rightSelect) {
			this.rightSelect.options = this.buildRightOptions();
		}
	}

	private updateSummary(): void {
		if (!this.summaryText) return;
		const mappingCount = this.displayMappings.length;
		const validation = validateMappingStructure(this.buildMappingConfig());
		this.summaryText.content = `${mappingCount} mappings ${symbols.bullet.dot} ${validation.issues.length} issues${this.dirty ? ' ${symbols.bullet.dot} unsaved' : ''}`;
	}

	private updatePreview(): void {
		if (!this.previewPanel || !this.registry) return;

		// Clear existing children
		const children = this.previewPanel.getChildren();
		for (const child of children) {
			this.previewPanel.remove(child.id);
		}

		// Count mapped vs required — only Learner fields, skip auto-generated
		const mappedPaths = new Set(this.mappings.map((m) => m.xsdPath));
		let mappedCount = 0;
		let unmappedRequired = 0;
		const unmappedRequiredFields: string[] = [];

		for (const [path, el] of this.registry.elementsByPath) {
			if (el.isComplex) continue;
			if (!path.startsWith(LEARNER_PREFIX)) continue;
			if (AUTO_LEARNER_PATHS.has(path)) continue;

			if (mappedPaths.has(path)) {
				mappedCount++;
			} else if (isRequired(el)) {
				unmappedRequired++;
				unmappedRequiredFields.push(path.split('.').slice(-1)[0]);
			}
		}

		// Summary line
		this.previewPanel.add(new TextRenderable(this.renderer, {
			content: `${symbols.info.success} ${mappedCount} mapped  ${symbols.info.error} ${unmappedRequired} unmapped required`,
			fg: unmappedRequired > 0 ? theme.warning : theme.success,
		}));

		// Show first few unmapped required fields
		if (unmappedRequiredFields.length > 0) {
			const shown = unmappedRequiredFields.slice(0, 5);
			const remaining = unmappedRequiredFields.length - shown.length;
			const list = shown.join(', ') + (remaining > 0 ? `, +${remaining} more` : '');
			this.previewPanel.add(new TextRenderable(this.renderer, {
				content: `  Missing: ${list}`,
				fg: theme.textMuted,
			}));
		}
	}

	// === Config Building ===

	private buildMappingConfig(): MappingConfig {
		return {
			id: this.mappingId || 'unsaved',
			name: this.mappingName,
			mappingVersion: this.mappingVersion,
			targetSchema: this.targetSchema,
			mappings: this.mappings,
		};
	}
}

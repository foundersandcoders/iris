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
	type SelectOption,
} from '@opentui/core';
import type { RenderContext, Renderer } from '../types';
import { theme, symbols } from '../../../assets/brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import type { ColumnMapping, SchemaReference } from '../../lib/types/schemaTypes';
import type { IlrMappingConfig } from '../../lib/types/ilrMappingTypes';
import type { SchemaElement, SchemaRegistry } from '../../lib/types/interpreterTypes';
import { isRequired, isEffectivelyRequired } from '../../lib/types/interpreterTypes';
import { createStorage } from '../../lib/storage';
import { buildSchemaRegistry } from '../../lib/schema/registryBuilder';
import { validateMappingStructure } from '../../lib/mappings/validate';
import { ALL_BUILDER_PATHS } from '../../lib/mappings/builderPaths';
import { parseCSV } from '../../lib/utils/csv/csvParser';
import { appShell, panel, type AppShell, type Panel } from '../components';
import { Keymap } from '../utils/keymap';

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
		if (m.group !== undefined) {
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
	const groups = new Set<number>();
	for (const m of mappings) {
		if (m.group !== undefined && regex.test(m.csvColumn)) {
			groups.add(m.group);
		}
	}
	return groups.size || 5; // Default to 5 if no existing expansions
}

/** Which pane owns real keyboard focus. 'search' and 'right' both live inside the
 *  Schema Fields panel, so both light its border — only the input vs list target differs. */
type FocusTarget = 'left' | 'search' | 'right';

export class MappingEditorScreen implements Screen {
	readonly name = 'mapping-editor';
	private renderer: Renderer;
	private shell?: AppShell;
	private leftPanel?: Panel;
	private rightPanel?: Panel;
	private keymap?: Keymap;

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

	// CSV headers (for new mappings)
	private csvHeaders: string[] = [];

	// UI state — the single focus authority. Every focus change (Tab, search, CSV
	// picker) routes through focusPanel() so border colour, real OpenTUI focus, and
	// this field can never desync (the "weak two-panel focus model" TR.B5 fixes).
	private focusTarget: FocusTarget = 'left';
	private displayMappings: ColumnMapping[] = [];

	// Renderables
	private leftSelect?: SelectRenderable;
	private rightSelect?: SelectRenderable;
	private searchInput?: InputRenderable;
	private previewPanel?: BoxRenderable;
	private summaryText?: TextRenderable;

	// CSV column picker overlay
	private csvPickerSelect?: SelectRenderable;
	private pendingXsdPath?: string;

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

		// Load CSV headers for new mappings
		const csvFilePath = data?.csvFilePath as string | undefined;
		if (csvFilePath) {
			try {
				const csvData = await parseCSV(csvFilePath);
				this.csvHeaders = csvData.headers;
			} catch {
				// CSV parsing failed — editor still works, just no CSV column picker
			}
		}

		// Build collapsed display mappings
		this.displayMappings = collapseAimMappings(this.mappings);

		return new Promise((resolve) => {
			const keymap = this.buildUI(resolve);

			// Left panel: mapping list interactions
			this.leftSelect?.on(SelectRenderableEvents.ITEM_SELECTED, (_index: number, option: SelectOption) => {
				const value = option.value as string;

				// CSV column picker mode — intercept selection
				if (this.csvPickerSelect && this.pendingXsdPath) {
					if (value === '__header__') return; // Skip header row
					this.dismissCsvPicker();
					this.commitAddMapping(this.pendingXsdPath!, value);
					return;
				}

				if (value === '__add__') {
					// Switch to right panel to pick an XSD path for a new mapping
					this.focusPanel('right');
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
				// Move focus to the results list, staying in the right panel
				this.focusPanel('right');
			});

			// Initial focus
			this.focusPanel('left');

			keymap.attach(this.renderer);
		});
	}

	cleanup(): void {
		this.keymap?.detach(this.renderer);
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

	private buildUI(resolve: (result: ScreenResult) => void): Keymap {
		this.keymap = new Keymap({
			bindings: [
				{
					keys: ['up', 'down', 'k', 'j'],
					hint: `${symbols.arrows.up}${symbols.arrows.down}`,
					label: 'Navigate',
					handler: () => {},
				},
				{ keys: ['tab'], label: 'Switch Pane', handler: () => this.togglePanel() },
				// Map — SelectRenderable ITEM_SELECTED owns Enter; this is bar-only.
				{ keys: ['enter'], label: 'Map', handler: () => {} },
				{
					keys: ['/'],
					label: 'Search',
					when: () => this.focusTarget !== 'search',
					handler: () => this.focusPanel('search'),
				},
				{ keys: ['t'], label: 'Transform', when: () => this.focusTarget === 'left', handler: () => this.cycleTransform() },
				{ keys: ['x'], label: 'Unmap', when: () => this.focusTarget === 'left', handler: () => this.removeSelectedMapping() },
				{
					keys: ['s'],
					label: 'Save',
					when: () => this.focusTarget === 'left',
					handler: () =>
						resolve({
							action: 'push',
							screen: 'mapping-save',
							data: { mapping: this.buildMappingConfig(), existingId: this.existingId },
						}),
				},
			],
			onBack: () => {
				// 1. CSV picker open → dismiss it
				if (this.csvPickerSelect && this.pendingXsdPath) {
					this.dismissCsvPicker();
					return;
				}
				// 2. Right pane with an active query → clear search first
				if ((this.focusTarget === 'search' || this.focusTarget === 'right') && this.searchQuery) {
					this.searchQuery = '';
					if (this.searchInput) this.searchInput.value = '';
					this.filterPaths();
					this.updateRightPanel();
					return;
				}
				// 3. Pop back
				resolve({ action: 'pop' });
			},
		});
		const keymap = this.keymap;

		this.shell = appShell(this.renderer, {
			id: CONTAINER_ID,
			breadcrumb: `Edit Mapping: ${this.mappingName}`,
			footer: keymap.toKeybar(),
		});

		// Summary
		const mappingCount = this.displayMappings.length;
		const validation = validateMappingStructure(this.buildMappingConfig());
		this.summaryText = new TextRenderable(this.renderer, {
			content: `${mappingCount} mappings ${symbols.bullet.dot} ${validation.issues.length} issues`,
			fg: theme.textMuted,
		});
		this.shell.content.add(this.summaryText);

		this.shell.content.add(new TextRenderable(this.renderer, { content: '' }));

		// Editor area: two panels
		const editorRow = new BoxRenderable(this.renderer, { flexDirection: 'row', flexGrow: 1 });

		// Left panel: current mappings
		this.leftPanel = panel(this.renderer, { title: 'Mapped Fields', flexGrow: 1, focused: true });

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
		this.leftPanel.add(this.leftSelect);
		editorRow.add(this.leftPanel.box);

		// Right panel: search + XSD paths — one panel, one border, for both children
		this.rightPanel = panel(this.renderer, { title: 'Schema Fields', flexGrow: 1 });

		this.searchInput = new InputRenderable(this.renderer, {
			placeholder: 'Search XSD paths...',
			width: '100%',
			textColor: theme.text,
			backgroundColor: theme.background,
			focusedTextColor: theme.text,
			focusedBackgroundColor: theme.highlightFocused,
		});
		this.rightPanel.add(this.searchInput);

		this.rightSelect = new SelectRenderable(this.renderer, {
			options: this.buildRightOptions(),
			backgroundColor: theme.background,
			focusedBackgroundColor: theme.background,
			selectedBackgroundColor: theme.highlightFocused,
			selectedTextColor: theme.text,
			textColor: theme.text,
			focusedTextColor: theme.text,
			descriptionColor: theme.textMuted,
			flexGrow: 1,
			showScrollIndicator: true,
		});
		this.rightPanel.add(this.rightSelect);
		editorRow.add(this.rightPanel.box);

		this.shell.content.add(editorRow);

		this.shell.content.add(new TextRenderable(this.renderer, { content: '' }));

		// Preview panel — non-interactive, never a focus target
		this.previewPanel = new BoxRenderable(this.renderer, { flexDirection: 'column' });
		this.shell.content.add(this.previewPanel);
		this.updatePreview();

		this.renderer.root.add(this.shell.root);

		return keymap;
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
		const mappedPaths = new Set(this.mappings.map((m) => m.xsdPath));

		return this.filteredPaths.map((path) => {
			const el = this.registry?.elementsByPath.get(path);
			const required = el && this.registry ? isEffectivelyRequired(el, this.registry, mappedPaths) : false;
			const isMapped = mappedPaths.has(path);
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

	/** The single focus authority. Every focus change — Tab, search, CSV picker —
	 *  routes through here so border colour, real OpenTUI focus, and `focusTarget`
	 *  can never disagree. 'search' and 'right' both live in the Schema Fields panel,
	 *  so both light its border; only which child owns real input focus differs. */
	private focusPanel(target: FocusTarget): void {
		this.focusTarget = target;
		const rightActive = target === 'search' || target === 'right';

		this.leftPanel?.setFocused(target === 'left');
		this.rightPanel?.setFocused(rightActive);

		if (target === 'left') {
			this.searchInput?.blur();
			this.rightSelect?.blur();
			this.leftSelect?.focus();
		} else if (target === 'search') {
			this.leftSelect?.blur();
			this.rightSelect?.blur();
			this.searchInput?.focus();
		} else {
			this.leftSelect?.blur();
			this.searchInput?.blur();
			this.rightSelect?.focus();
		}

		// Refresh the keybar — the when-guards hide left-only keys (t/x/s) off-left.
		this.shell?.setFooter(this.keymap!.toKeybar());
	}

	private togglePanel(): void {
		this.focusPanel(this.focusTarget === 'left' ? 'right' : 'left');
	}

	private addMapping(xsdPath: string): void {
		// Check if already mapped
		const existing = this.mappings.find((m) => m.xsdPath === xsdPath && !m.group);
		if (existing) return; // Already mapped

		if (this.csvHeaders.length > 0) {
			// Show CSV column picker
			this.showCsvColumnPicker(xsdPath);
		} else {
			// Fallback: use the last segment as default CSV column name
			this.commitAddMapping(xsdPath, xsdPath.split('.').slice(-1)[0]);
		}
	}

	private showCsvColumnPicker(xsdPath: string): void {
		this.pendingXsdPath = xsdPath;

		if (!this.leftSelect) return;

		// Replace left panel options with CSV column headers
		const usedColumns = new Set(this.mappings.map((m) => m.csvColumn));
		const shortPath = xsdPath.split('.').slice(-1)[0];

		this.leftSelect.options = [
			{ name: `Select CSV column for: ${shortPath}`, description: '', value: '__header__' },
			...this.csvHeaders
				.filter((h) => !usedColumns.has(h))
				.map((header) => ({
					name: `  ${header}`,
					description: '',
					value: header,
				})),
		];
		this.leftSelect.setSelectedIndex(1); // Skip header

		// Temporarily rebind left panel selection
		this.csvPickerSelect = this.leftSelect; // Track that we're in picker mode

		this.shell?.setFooter('Select CSV column  [ENTER] Confirm  [ESC] Cancel');

		// Switch to left panel
		this.focusPanel('left');
	}

	private dismissCsvPicker(): void {
		this.pendingXsdPath = undefined;
		this.csvPickerSelect = undefined;

		// Restore left panel
		this.refreshDisplay();
		this.focusPanel('left');
	}

	private commitAddMapping(xsdPath: string, csvColumn: string): void {
		this.mappings.push({
			csvColumn,
			xsdPath,
		});

		this.dirty = true;
		this.refreshDisplay();

		// Switch to left panel to show the new mapping
		this.focusPanel('left');
	}

	private removeSelectedMapping(): void {
		if (!this.leftSelect) return;

		const index = this.leftSelect.getSelectedIndex();
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

		const index = this.leftSelect.getSelectedIndex();
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
			this.filteredPaths = this.leafPaths.filter((p) => p.toLowerCase().includes(query));
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
		const unsaved = this.dirty ? ` ${symbols.bullet.dot} unsaved` : '';
		this.summaryText.content = `${mappingCount} mappings ${symbols.bullet.dot} ${validation.issues.length} issues${unsaved}`;
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
			} else if (isEffectivelyRequired(el, this.registry, mappedPaths)) {
				unmappedRequired++;
				unmappedRequiredFields.push(path.split('.').slice(-1)[0]);
			}
		}

		// Summary line
		this.previewPanel.add(
			new TextRenderable(this.renderer, {
				content: `${symbols.info.success} ${mappedCount} mapped  ${symbols.info.error} ${unmappedRequired} unmapped required`,
				fg: unmappedRequired > 0 ? theme.warning : theme.success,
			})
		);

		// Show all unmapped required fields
		if (unmappedRequiredFields.length > 0) {
			this.previewPanel.add(
				new TextRenderable(this.renderer, {
					content: `  Missing: ${unmappedRequiredFields.join(', ')}`,
					fg: theme.textMuted,
				})
			);
		}
	}

	// === Config Building ===

	private buildMappingConfig(): IlrMappingConfig {
		return {
			id: this.mappingId || 'unsaved',
			name: this.mappingName,
			mappingVersion: this.mappingVersion,
			targetSchema: this.targetSchema,
			mappings: this.mappings,
		};
	}
}

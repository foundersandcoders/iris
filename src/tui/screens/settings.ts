/** ====== Settings Screen ======
 * Inline-edit screen for IrisConfig fields.
 * Navigate with arrows, Enter to edit, save/reset/back.
 */
import {
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
import {
	DEFAULT_CONFIG,
	validateConfig,
	type IrisConfig,
	type ConfigValidationResult,
} from '../../lib/types/configTypes';
import { createStorage } from '../../lib/storage';
import {
	getDefaultOutputDir,
	getDefaultCsvInputDir,
	getDefaultSchemaDir,
} from '../../lib/utils/storage/paths';
import { appShell, panel, type AppShell, type Panel } from '../components';
import { Keymap } from '../utils/keymap';

const CONTAINER_ID = 'settings-root';

/** Flattened field definition for the settings list */
interface SettingsField {
	key: string;
	label: string;
	section: string;
	getValue: (config: IrisConfig) => string;
	setValue: (config: IrisConfig, value: string) => IrisConfig;
	type: 'text' | 'dropdown' | 'directory';
	editable?: boolean; // defaults to true
	dropdownLoader?: () => Promise<string[]>;
}

/** Contextual help text per field */
const FIELD_HELP: Record<string, string> = {
	'provider.ukprn': 'UK Provider Reference Number — 8-digit identifier assigned by UKRLP',
	'provider.name': 'Organisation name as registered with the ESFA',
	'activeSchema': 'XSD schema used for XML generation and validation',
	'activeMapping': 'CSV→XSD mapping configuration for field translation',
	'collection': 'ILR collection period (e.g. "R14" for final return)',
	'serialNo': 'Auto-incremented per submission — leave blank for now',
	'outputDir': 'Directory for generated ILR XML submissions',
	'csvInputDir': 'Starting directory when browsing for CSV files',
	'schemaDir': 'Directory for downloaded government XSD schema files',
};

/** Field definitions — declarative description of every editable setting */
const FIELDS: SettingsField[] = [
	// Provider
	{
		key: 'provider.ukprn',
		label: 'UKPRN',
		section: 'Provider',
		getValue: (c) => String(c.provider.ukprn),
		setValue: (c, v) => ({ ...c, provider: { ...c.provider, ukprn: parseInt(v, 10) || 0 } }),
		type: 'text',
	},
	{
		key: 'provider.name',
		label: 'Name',
		section: 'Provider',
		getValue: (c) => c.provider.name ?? '',
		setValue: (c, v) => ({ ...c, provider: { ...c.provider, name: v || undefined } }),
		type: 'text',
	},
	// Submission
	{
		key: 'activeSchema',
		label: 'Active Schema',
		section: 'Submission',
		getValue: (c) => c.activeSchema,
		setValue: (c, v) => ({ ...c, activeSchema: v }),
		type: 'dropdown',
		dropdownLoader: async () => {
			const storage = createStorage();
			const result = await storage.listSchemas();
			return result.success ? result.data : [];
		},
	},
	{
		key: 'activeMapping',
		label: 'Active Mapping',
		section: 'Submission',
		getValue: (c) => c.activeMapping,
		setValue: (c, v) => ({ ...c, activeMapping: v }),
		type: 'dropdown',
		dropdownLoader: async () => {
			const storage = createStorage();
			const result = await storage.listMappings();
			return result.success ? result.data : [];
		},
	},
	{
		key: 'collection',
		label: 'Collection',
		section: 'Submission',
		getValue: (c) => c.collection ?? '',
		setValue: (c, v) => ({ ...c, collection: v || undefined }),
		type: 'text',
	},
	{
		key: 'serialNo',
		label: 'Serial No',
		section: 'Submission',
		getValue: (c) => c.serialNo ?? '(auto)',
		setValue: (c, v) => ({ ...c, serialNo: v || undefined }),
		type: 'text',
		editable: false,
	},
	// Directories
	{
		key: 'outputDir',
		label: 'XML Outputs',
		section: 'Directories',
		getValue: (c) => c.outputDir ?? getDefaultOutputDir(),
		setValue: (c, v) => ({ ...c, outputDir: v }),
		type: 'directory',
	},
	{
		key: 'csvInputDir',
		label: 'CSV Inputs',
		section: 'Directories',
		getValue: (c) => c.csvInputDir ?? getDefaultCsvInputDir(),
		setValue: (c, v) => ({ ...c, csvInputDir: v }),
		type: 'directory',
	},
	{
		key: 'schemaDir',
		label: 'XSD Schemas',
		section: 'Directories',
		getValue: (c) => c.schemaDir ?? getDefaultSchemaDir(),
		setValue: (c, v) => ({ ...c, schemaDir: v }),
		type: 'directory',
	},
];

export class SettingsScreen implements Screen {
	readonly name = 'settings';
	private renderer: Renderer;
	private shell?: AppShell;
	private fieldPanel?: Panel;
	private keymap?: Keymap;
	private resolveRender?: (result: ScreenResult) => void;

	// State
	private config!: IrisConfig;
	private originalConfig!: IrisConfig;
	private dirty = false;
	private editing = false;
	private resetConfirm = false;
	private validation: ConfigValidationResult = { valid: true, issues: [] };

	// Navigation
	private previousIndex = 0;

	// Inline edit renderables (created/destroyed per edit)
	private editInput?: InputRenderable;
	private editDropdown?: SelectRenderable;
	private editFieldIndex = -1;

	// Renderables
	private fieldList?: SelectRenderable;
	private helpText?: TextRenderable;
	private validationText?: TextRenderable;

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		// Load config
		const storage = createStorage();
		const configResult = await storage.loadConfig();
		if (configResult.success) {
			this.config = { ...configResult.data };
			this.originalConfig = { ...configResult.data };
		} else {
			this.config = { ...DEFAULT_CONFIG };
			this.originalConfig = { ...DEFAULT_CONFIG };
		}

		// Handle returned directory selection from file-picker
		if (data?.selectedDirectory && data?.fieldKey) {
			const field = FIELDS.find((f) => f.key === data.fieldKey);
			if (field) {
				this.config = field.setValue(this.config, data.selectedDirectory as string);
				this.dirty = true;
			}
		}

		this.validation = validateConfig(this.config);

		return new Promise((resolve) => {
			this.resolveRender = resolve;
			const keymap = this.buildUI(resolve);

			// Field selection → edit on Enter
			this.fieldList?.on(SelectRenderableEvents.ITEM_SELECTED, (index: number) => {
				if (!this.editing) {
					this.startEdit(index);
				}
			});

			// Skip section headers on navigation + update help text
			this.fieldList?.on(
				SelectRenderableEvents.SELECTION_CHANGED,
				(index: number, option: SelectOption | null) => {
					if (!option) return;
					const value = option.value as string;

					// Clear reset confirm on any navigation
					if (this.resetConfirm) {
						this.resetConfirm = false;
						this.refreshFooter();
					}

					if (value.startsWith('__section_')) {
						const direction = index > this.previousIndex ? 1 : -1;
						const options = this.fieldList!.options;
						const nextIndex = index + direction;
						if (nextIndex >= 0 && nextIndex < options.length) {
							this.fieldList!.setSelectedIndex(nextIndex);
						} else {
							// At boundary — bounce back
							this.fieldList!.setSelectedIndex(this.previousIndex);
						}
					} else {
						this.previousIndex = index;
						// Update help text
						if (this.helpText) {
							this.helpText.content = FIELD_HELP[value] ?? '';
						}
					}
				}
			);

			// Initial focus
			this.fieldList?.focus();

			keymap.attach(this.renderer);
		});
	}

	cleanup(): void {
		this.keymap?.detach(this.renderer);
		this.renderer.root.remove(CONTAINER_ID);
	}

	// === UI Building ===

	private buildUI(resolve: (result: ScreenResult) => void): Keymap {
		const finish = () => {
			if (this.editing) {
				this.cancelEdit();
			} else {
				resolve({ action: 'pop' });
			}
		};

		const bindings = [
			{
				keys: ['up', 'down', 'k', 'j'],
				hint: `${symbols.arrows.up}${symbols.arrows.down}`,
				label: 'Navigate',
				hidden: true,
				handler: () => {},
			},
			{
				keys: ['enter'],
				label: 'Edit',
				hidden: true,
				when: () => !this.editing,
				handler: () => {},
			},
			{
				keys: ['s'],
				label: 'Save',
				when: () => !this.editing,
				handler: () => {
					if (this.resetConfirm) {
						this.resetConfirm = false;
						this.refreshFooter();
					}
					this.save();
				},
			},
			{
				keys: ['r'],
				label: 'Reset All',
				when: () => !this.editing,
				handler: () => this.resetToDefaults(),
			},
		];

		this.keymap = new Keymap({ bindings, onBack: finish, onQuit: finish });
		const keymap = this.keymap;

		this.fieldList = new SelectRenderable(this.renderer, {
			options: this.buildFieldOptions(),
			backgroundColor: theme.background,
			focusedBackgroundColor: theme.background,
			selectedBackgroundColor: theme.highlightFocused,
			selectedTextColor: theme.text,
			textColor: theme.text,
			focusedTextColor: theme.text,
			descriptionColor: theme.textMuted,
			flexGrow: 1,
		});

		this.fieldPanel = panel(this.renderer, { title: 'Settings', flexGrow: 1, focused: true });
		this.fieldPanel.add(this.fieldList);

		this.helpText = new TextRenderable(this.renderer, {
			content: '',
			fg: theme.textMuted,
		});

		this.validationText = new TextRenderable(this.renderer, {
			content: this.validation.valid
				? `${symbols.info.success} Configuration valid`
				: `${symbols.info.error} ${this.validation.issues.map((i) => `${i.field}: ${i.message}`).join(', ')}`,
			fg: this.validation.valid ? theme.success : theme.error,
		});

		this.shell = appShell(this.renderer, {
			id: CONTAINER_ID,
			breadcrumb: 'Settings',
			footer: keymap.toKeybar(),
		});

		this.shell.content.add(this.fieldPanel.box);
		this.shell.content.add(new TextRenderable(this.renderer, { content: '' }));
		this.shell.content.add(this.helpText);
		this.shell.content.add(new TextRenderable(this.renderer, { content: '' }));
		this.shell.content.add(this.validationText);

		this.renderer.root.add(this.shell.root);

		return keymap;
	}

	private buildFieldOptions(): SelectOption[] {
		const options: SelectOption[] = [];
		let lastSection = '';

		for (const field of FIELDS) {
			// Section headers as non-interactive items
			if (field.section !== lastSection) {
				options.push({
					name: `  ${field.section}`,
					description: '',
					value: `__section_${field.section}`,
				});
				lastSection = field.section;
			}

			const editable = field.editable !== false;
			const value = field.getValue(this.config);
			const padding = ' '.repeat(Math.max(1, 22 - field.label.length));
			options.push({
				name: editable
					? `    ${field.label}${padding}${value}`
					: `    ${field.label}${padding}${value}  ${symbols.bullet.dot} read-only`,
				description: '',
				value: field.key,
			});
		}

		return options;
	}

	// === Inline Editing ===

	private async startEdit(listIndex: number): Promise<void> {
		// Map list index to field index (accounting for section headers)
		const field = this.getFieldFromListIndex(listIndex);
		if (!field) return; // Hit a section header
		if (field.editable === false) return; // Non-editable field

		this.editing = true;
		this.editFieldIndex = FIELDS.indexOf(field);
		this.refreshFooter();

		if (field.type === 'directory') {
			this.startDirectoryEdit(field);
			return;
		}

		if (field.type === 'dropdown' && field.dropdownLoader) {
			const options = await field.dropdownLoader();
			this.showDropdownEdit(field, options);
		} else {
			this.showTextEdit(field);
		}
	}

	private showTextEdit(field: SettingsField): void {
		const currentValue = field.getValue(this.config);

		this.editInput = new InputRenderable(this.renderer, {
			value: currentValue === '(default)' ? '' : currentValue,
			placeholder: field.label,
			width: '40%',
			textColor: theme.text,
			backgroundColor: theme.background,
			focusedTextColor: theme.text,
			focusedBackgroundColor: theme.highlightFocused,
		});

		this.shell?.setFooter(`Editing ${field.label} — [ENTER] Commit  [ESC] Cancel`);

		this.editInput.on(InputRenderableEvents.ENTER, () => {
			const newValue = this.editInput?.value ?? '';
			this.commitEdit(field, newValue);
		});

		// Add input to panel and focus it
		this.fieldPanel?.add(this.editInput);
		this.editInput.focus();
	}

	private showDropdownEdit(field: SettingsField, options: string[]): void {
		const currentValue = field.getValue(this.config);

		this.editDropdown = new SelectRenderable(this.renderer, {
			options: options.map((opt) => ({
				name: opt === currentValue ? `${symbols.info.success} ${opt}` : `  ${opt}`,
				description: '',
				value: opt,
			})),
			backgroundColor: theme.background,
			selectedBackgroundColor: theme.highlightFocused,
			textColor: theme.text,
		});

		this.shell?.setFooter(`Select ${field.label} — [ENTER] Confirm  [ESC] Cancel`);

		this.editDropdown.on(SelectRenderableEvents.ITEM_SELECTED, (_index: number, option: SelectOption) => {
			this.commitEdit(field, option.value as string);
		});

		this.fieldPanel?.add(this.editDropdown);
		this.editDropdown.focus();
	}

	private startDirectoryEdit(field: SettingsField): void {
		this.keymap?.detach(this.renderer);
		this.resolveRender?.({
			action: 'push',
			screen: 'file-picker',
			data: {
				path: field.getValue(this.config),
				selectionMode: 'directory',
				title: `Select ${field.label} Directory`,
				fieldKey: field.key,
			},
		});
	}

	private commitEdit(field: SettingsField, newValue: string): void {
		this.config = field.setValue(this.config, newValue);
		this.dirty = true;
		this.finishEdit();
	}

	private cancelEdit(): void {
		this.finishEdit();
	}

	private finishEdit(): void {
		// Remove inline edit renderables
		if (this.editInput) {
			this.fieldPanel?.box.remove(this.editInput.id);
			this.editInput = undefined;
		}
		if (this.editDropdown) {
			this.fieldPanel?.box.remove(this.editDropdown.id);
			this.editDropdown = undefined;
		}

		this.editing = false;
		this.editFieldIndex = -1;

		// Refresh field list and validation
		this.validation = validateConfig(this.config);

		if (this.fieldList) {
			this.fieldList.options = this.buildFieldOptions();
		}

		if (this.validationText) {
			this.validationText.content = this.validation.valid
				? `${symbols.info.success} Configuration valid`
				: `${symbols.info.error} ${this.validation.issues.map((i) => `${i.field}: ${i.message}`).join(', ')}`;
		}

		this.refreshFooter();

		// Refocus field list
		this.fieldList?.focus();
	}

	private getFieldFromListIndex(listIndex: number): SettingsField | null {
		const options = this.buildFieldOptions();
		if (listIndex < 0 || listIndex >= options.length) return null;

		const option = options[listIndex];
		const key = option.value as string;

		// Section headers have __section_ prefix
		if (key.startsWith('__section_')) return null;

		return FIELDS.find((f) => f.key === key) ?? null;
	}

	// === Status ===

	private refreshFooter(): void {
		if (this.resetConfirm) {
			this.shell?.setFooter(
				`${symbols.info.warning} Press [r] again to confirm reset to defaults, or any other key to cancel`
			);
		} else if (!this.editing) {
			this.shell?.setFooter(this.keymap?.toKeybar() ?? '');
		}
		// While editing, the edit/dropdown prompt set in showTextEdit/showDropdownEdit stands.
	}

	// === Actions ===

	private async save(): Promise<void> {
		if (!this.validation.valid) return; // Block save if invalid

		const storage = createStorage();
		const result = await storage.saveConfig(this.config);
		if (result.success) {
			this.originalConfig = { ...this.config };
			this.dirty = false;
			this.shell?.setFooter(`${symbols.info.success} Saved!`);
			setTimeout(() => this.refreshFooter(), 2000);
		}
	}

	private resetToDefaults(): void {
		// Two-press confirm
		if (!this.resetConfirm) {
			this.resetConfirm = true;
			this.refreshFooter();
			return;
		}

		this.resetConfirm = false;
		this.config = { ...DEFAULT_CONFIG };
		this.dirty = true;
		this.validation = validateConfig(this.config);

		if (this.fieldList) {
			this.fieldList.options = this.buildFieldOptions();
		}

		if (this.validationText) {
			this.validationText.content = this.validation.valid
				? `${symbols.info.success} Configuration valid (reset to defaults)`
				: `${symbols.info.error} ${this.validation.issues.map((i) => `${i.field}: ${i.message}`).join(', ')}`;
		}

		this.refreshFooter();
	}
}

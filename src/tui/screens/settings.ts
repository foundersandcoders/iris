/** ====== Settings Screen ======
 * Inline-edit screen for IrisConfig fields.
 * Navigate with arrows, Enter to edit, save/reset/back.
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
import {
	DEFAULT_CONFIG,
	validateConfig,
	type IrisConfig,
	type ConfigValidationResult,
} from '../../lib/types/configTypes';
import { createStorage } from '../../lib/storage';

const CONTAINER_ID = 'settings-root';

/** Flattened field definition for the settings list */
interface SettingsField {
	key: string;
	label: string;
	section: string;
	getValue: (config: IrisConfig) => string;
	setValue: (config: IrisConfig, value: string) => IrisConfig;
	type: 'text' | 'dropdown';
	dropdownLoader?: () => Promise<string[]>;
}

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
		getValue: (c) => c.serialNo ?? '',
		setValue: (c, v) => ({ ...c, serialNo: v || undefined }),
		type: 'text',
	},
	{
		key: 'outputDir',
		label: 'Output Directory',
		section: 'Submission',
		getValue: (c) => c.outputDir ?? '(default)',
		setValue: (c, v) => ({ ...c, outputDir: v === '(default)' || v === '' ? undefined : v }),
		type: 'text',
	},
	// Software
	{
		key: 'submission.softwareSupplier',
		label: 'Supplier',
		section: 'Software',
		getValue: (c) => c.submission.softwareSupplier ?? '',
		setValue: (c, v) => ({ ...c, submission: { ...c.submission, softwareSupplier: v || undefined } }),
		type: 'text',
	},
	{
		key: 'submission.softwarePackage',
		label: 'Package',
		section: 'Software',
		getValue: (c) => c.submission.softwarePackage ?? '',
		setValue: (c, v) => ({ ...c, submission: { ...c.submission, softwarePackage: v || undefined } }),
		type: 'text',
	},
];

export class SettingsScreen implements Screen {
	readonly name = 'settings';
	private renderer: Renderer;
	private keyHandler?: (key: KeyEvent) => void;

	// State
	private config!: IrisConfig;
	private originalConfig!: IrisConfig;
	private dirty = false;
	private editing = false;
	private validation: ConfigValidationResult = { valid: true, issues: [] };

	// Inline edit renderables (created/destroyed per edit)
	private editInput?: InputRenderable;
	private editDropdown?: SelectRenderable;
	private editFieldIndex = -1;

	// Renderables
	private container?: BoxRenderable;
	private fieldList?: SelectRenderable;
	private validationText?: TextRenderable;
	private statusText?: TextRenderable;

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

		this.validation = validateConfig(this.config);
		this.buildUI();

		return new Promise((resolve) => {
			// Field selection → edit on Enter
			this.fieldList?.on(SelectRenderableEvents.ITEM_SELECTED, (index: number) => {
				if (!this.editing) {
					this.startEdit(index);
				}
			});

			// Key handler
			this.keyHandler = (key: KeyEvent) => {
				if (this.editing) {
					if (key.name === 'escape') {
						this.cancelEdit();
					}
					return; // Don't process other keys while editing
				}

				if (key.name === 'escape') {
					this.renderer.keyInput.off('keypress', this.keyHandler!);
					resolve({ action: 'pop' });
				} else if (key.name === 's') {
					this.save();
				} else if (key.name === 'r') {
					this.resetToDefaults();
				}
			};
			this.renderer.keyInput.on('keypress', this.keyHandler);

			// Initial focus
			this.fieldList?.focus();
		});
	}

	cleanup(): void {
		if (this.keyHandler) {
			this.renderer.keyInput.off('keypress', this.keyHandler);
		}
		this.renderer.root.remove(CONTAINER_ID);
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
			content: 'Settings',
			fg: theme.primary,
		}));

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Field list
		this.fieldList = new SelectRenderable(this.renderer, {
			options: this.buildFieldOptions(),
			backgroundColor: theme.background,
			focusedBackgroundColor: theme.background,
			selectedBackgroundColor: theme.highlight,
			selectedTextColor: theme.text,
			textColor: theme.text,
			focusedTextColor: theme.text,
			descriptionColor: theme.textMuted,
			flexGrow: 1,
		});
		this.container.add(this.fieldList);

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Validation
		this.validationText = new TextRenderable(this.renderer, {
			content: this.validation.valid
				? `${symbols.success} Configuration valid`
				: `${symbols.error} ${this.validation.issues.map((i) => `${i.field}: ${i.message}`).join(', ')}`,
			fg: this.validation.valid ? theme.success : theme.error,
		});
		this.container.add(this.validationText);

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Status bar
		this.statusText = new TextRenderable(this.renderer, {
			content: '[↑↓] Navigate  [ENTER] Edit  [s] Save  [r] Reset  [ESC] Back',
			fg: theme.textMuted,
		});
		this.container.add(this.statusText);

		this.renderer.root.add(this.container);
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

			const value = field.getValue(this.config);
			const padding = ' '.repeat(Math.max(1, 22 - field.label.length));
			options.push({
				name: `    ${field.label}${padding}${value}`,
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

		this.editing = true;
		this.editFieldIndex = FIELDS.indexOf(field);

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
		});

		// Replace the field list option with input (visual feedback)
		if (this.statusText) {
			this.statusText.content = `Editing ${field.label} — [ENTER] Commit  [ESC] Cancel`;
		}

		this.editInput.on(InputRenderableEvents.ENTER, () => {
			const newValue = this.editInput?.value ?? '';
			this.commitEdit(field, newValue);
		});

		// Add input to container and focus it
		this.container?.add(this.editInput);
		this.editInput.focus();
	}

	private showDropdownEdit(field: SettingsField, options: string[]): void {
		const currentValue = field.getValue(this.config);

		this.editDropdown = new SelectRenderable(this.renderer, {
			options: options.map((opt) => ({
				name: opt === currentValue ? `${symbols.success} ${opt}` : `  ${opt}`,
				description: '',
				value: opt,
			})),
			backgroundColor: theme.background,
			selectedBackgroundColor: theme.highlight,
			textColor: theme.text,
		});

		if (this.statusText) {
			this.statusText.content = `Select ${field.label} — [ENTER] Confirm  [ESC] Cancel`;
		}

		this.editDropdown.on(SelectRenderableEvents.ITEM_SELECTED, (_index: number, option: SelectOption) => {
			this.commitEdit(field, option.value as string);
		});

		this.container?.add(this.editDropdown);
		this.editDropdown.focus();
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
			this.container?.remove(this.editInput.id);
			this.editInput = undefined;
		}
		if (this.editDropdown) {
			this.container?.remove(this.editDropdown.id);
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
				? `${symbols.success} Configuration valid`
				: `${symbols.error} ${this.validation.issues.map((i) => `${i.field}: ${i.message}`).join(', ')}`;
		}

		if (this.statusText) {
			this.statusText.content = '[↑↓] Navigate  [ENTER] Edit  [s] Save  [r] Reset  [ESC] Back';
		}

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

	// === Actions ===

	private async save(): Promise<void> {
		if (!this.validation.valid) return; // Block save if invalid

		const storage = createStorage();
		const result = await storage.saveConfig(this.config);
		if (result.success) {
			this.originalConfig = { ...this.config };
			this.dirty = false;
			if (this.statusText) {
				this.statusText.content = `${symbols.success} Saved!  [↑↓] Navigate  [ENTER] Edit  [s] Save  [r] Reset  [ESC] Back`;
			}
		}
	}

	private resetToDefaults(): void {
		this.config = { ...DEFAULT_CONFIG };
		this.dirty = true;
		this.validation = validateConfig(this.config);

		if (this.fieldList) {
			this.fieldList.options = this.buildFieldOptions();
		}

		if (this.validationText) {
			this.validationText.content = this.validation.valid
				? `${symbols.success} Configuration valid (reset to defaults)`
				: `${symbols.error} ${this.validation.issues.map((i) => `${i.field}: ${i.message}`).join(', ')}`;
		}
	}
}

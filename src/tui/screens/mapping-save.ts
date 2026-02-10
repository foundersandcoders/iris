/** ====== Mapping Save Screen ======
 * Form for naming and saving a mapping configuration.
 * Auto-derives kebab-case ID from name, detects duplicates.
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
import type { MappingConfig } from '../../lib/types/schemaTypes';
import { createStorage } from '../../lib/storage';
import { validateMappingStructure } from '../../lib/mappings/validate';

const CONTAINER_ID = 'mapping-save-root';

/** Derive a kebab-case ID from a name */
function toKebabCase(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

type FocusTarget = 'name' | 'version' | 'active' | 'buttons';
const FOCUS_ORDER: FocusTarget[] = ['name', 'version', 'active', 'buttons'];

export class MappingSaveScreen implements Screen {
	readonly name = 'mapping-save';
	private renderer: Renderer;
	private keyHandler?: (key: KeyEvent) => void;

	// Data from mapping-editor
	private mapping!: MappingConfig;
	private existingId?: string;

	// Form state
	private nameValue = '';
	private versionValue = '1.0.0';
	private setActive = false;
	private existingMappings: string[] = [];
	private isDuplicate = false;

	// Focus
	private currentFocus: FocusTarget = 'name';

	// Renderables
	private container?: BoxRenderable;
	private nameInput?: InputRenderable;
	private idText?: TextRenderable;
	private versionInput?: InputRenderable;
	private activeToggle?: SelectRenderable;
	private warningText?: TextRenderable;
	private validationText?: TextRenderable;
	private buttonSelect?: SelectRenderable;
	private statusText?: TextRenderable;

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		this.mapping = data?.mapping as MappingConfig;
		this.existingId = data?.existingId as string | undefined;

		if (!this.mapping) {
			return { action: 'pop', data: { saved: false } };
		}

		// Pre-fill from mapping
		this.nameValue = this.mapping.name || '';
		this.versionValue = this.mapping.mappingVersion || '1.0.0';

		// Load existing mapping IDs for duplicate detection
		const storage = createStorage();
		const listResult = await storage.listMappings();
		if (listResult.success) {
			this.existingMappings = listResult.data;
		}

		this.checkDuplicate();
		this.buildUI();

		return new Promise((resolve) => {
			// Name input events
			this.nameInput?.on(InputRenderableEvents.INPUT, () => {
				this.nameValue = this.nameInput?.value ?? '';
				this.updateIdDisplay();
				this.checkDuplicate();
				this.updateWarning();
				this.updateValidation();
			});

			this.nameInput?.on(InputRenderableEvents.ENTER, () => {
				this.advanceFocus();
			});

			// Version input events
			this.versionInput?.on(InputRenderableEvents.ENTER, () => {
				this.versionValue = this.versionInput?.value ?? this.versionValue;
				this.advanceFocus();
			});

			// Active toggle
			this.activeToggle?.on(SelectRenderableEvents.ITEM_SELECTED, (_index: number, option: SelectOption) => {
				this.setActive = option.value === 'yes';
				this.advanceFocus();
			});

			// Buttons
			this.buttonSelect?.on(SelectRenderableEvents.ITEM_SELECTED, (_index: number, option: SelectOption) => {
				if (option.value === 'save') {
					this.save(resolve);
				} else {
					this.renderer.keyInput.off('keypress', this.keyHandler!);
					resolve({ action: 'pop', data: { saved: false } });
				}
			});

			// Key handler
			this.keyHandler = (key: KeyEvent) => {
				if (key.name === 'escape') {
					this.renderer.keyInput.off('keypress', this.keyHandler!);
					resolve({ action: 'pop', data: { saved: false } });
				} else if (key.name === 'tab') {
					this.advanceFocus();
				}
			};
			this.renderer.keyInput.on('keypress', this.keyHandler);

			// Initial focus
			this.setFocus('name');
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
			content: 'Save Mapping',
			fg: theme.primary,
		}));

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Name field
		this.container.add(new TextRenderable(this.renderer, {
			content: 'Name:',
			fg: theme.text,
		}));

		this.nameInput = new InputRenderable(this.renderer, {
			value: this.nameValue,
			placeholder: 'My Custom Mapping',
			width: '60%',
			textColor: theme.text,
			backgroundColor: theme.background,
			focusedTextColor: theme.text,
			focusedBackgroundColor: theme.highlightFocused,
		});
		this.container.add(this.nameInput);

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// ID (auto-derived, read-only display)
		const derivedId = toKebabCase(this.nameValue);
		this.idText = new TextRenderable(this.renderer, {
			content: `ID: ${derivedId || '(enter a name)'}`,
			fg: theme.textMuted,
		});
		this.container.add(this.idText);

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Version field
		this.container.add(new TextRenderable(this.renderer, {
			content: 'Version:',
			fg: theme.text,
		}));

		this.versionInput = new InputRenderable(this.renderer, {
			value: this.versionValue,
			placeholder: '1.0.0',
			width: '20%',
			textColor: theme.text,
			backgroundColor: theme.background,
			focusedTextColor: theme.text,
			focusedBackgroundColor: theme.highlightFocused,
		});
		this.container.add(this.versionInput);

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Active mapping toggle
		this.activeToggle = new SelectRenderable(this.renderer, {
			options: [
				{ name: `${this.setActive ? symbols.info.success : '○'} Set as active mapping`, description: '', value: this.setActive ? 'no' : 'yes' },
			],
			backgroundColor: theme.background,
			focusedBackgroundColor: theme.background,
			selectedBackgroundColor: theme.highlightFocused,
			textColor: theme.text,
		});
		this.container.add(this.activeToggle);

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Warning (duplicate detection)
		this.warningText = new TextRenderable(this.renderer, {
			content: '',
			fg: theme.warning,
		});
		this.container.add(this.warningText);
		this.updateWarning();

		// Validation summary
		this.validationText = new TextRenderable(this.renderer, {
			content: '',
			fg: theme.success,
		});
		this.container.add(this.validationText);
		this.updateValidation();

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Buttons
		this.buttonSelect = new SelectRenderable(this.renderer, {
			options: [
				{ name: 'Save', description: '', value: 'save' },
				{ name: 'Cancel', description: '', value: 'cancel' },
			],
			backgroundColor: theme.background,
			focusedBackgroundColor: theme.background,
			selectedBackgroundColor: theme.highlightFocused,
			textColor: theme.text,
		});
		this.container.add(this.buttonSelect);

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Status bar
		this.statusText = new TextRenderable(this.renderer, {
			content: '[TAB] Next field  [ENTER] Confirm  [ESC] Cancel',
			fg: theme.textMuted,
		});
		this.container.add(this.statusText);

		this.renderer.root.add(this.container);
	}

	// === Focus Management ===

	private setFocus(target: FocusTarget): void {
		this.currentFocus = target;

		switch (target) {
			case 'name':
				this.nameInput?.focus();
				break;
			case 'version':
				this.versionInput?.focus();
				break;
			case 'active':
				this.activeToggle?.focus();
				break;
			case 'buttons':
				this.buttonSelect?.focus();
				break;
		}
	}

	private advanceFocus(): void {
		const currentIdx = FOCUS_ORDER.indexOf(this.currentFocus);
		const nextIdx = (currentIdx + 1) % FOCUS_ORDER.length;
		this.setFocus(FOCUS_ORDER[nextIdx]);
	}

	// === Display Updates ===

	private updateIdDisplay(): void {
		if (!this.idText) return;
		const derivedId = toKebabCase(this.nameValue);
		this.idText.content = `ID: ${derivedId || '(enter a name)'}`;
	}

	private checkDuplicate(): void {
		const derivedId = toKebabCase(this.nameValue);
		// It's a duplicate if the ID exists and it's not the one we're editing
		this.isDuplicate = derivedId !== '' &&
			this.existingMappings.includes(derivedId) &&
			derivedId !== this.existingId;
	}

	private updateWarning(): void {
		if (!this.warningText) return;
		const derivedId = toKebabCase(this.nameValue);

		if (this.isDuplicate) {
			this.warningText.content = `${symbols.info.warning} Mapping "${derivedId}" already exists (will overwrite)`;
		} else {
			this.warningText.content = '';
		}
	}

	private updateValidation(): void {
		if (!this.validationText) return;

		const config = this.buildSaveConfig();
		const validation = validateMappingStructure(config);

		if (validation.valid) {
			this.validationText.content = `${symbols.info.success} ${config.mappings.length} mappings, 0 issues`;
		} else {
			this.validationText.content = `${symbols.info.error} ${validation.issues.length} issue${validation.issues.length === 1 ? '' : 's'}: ${validation.issues[0].message}`;
		}
	}

	// === Save Logic ===

	private async save(resolve: (result: ScreenResult) => void): Promise<void> {
		const config = this.buildSaveConfig();

		// Validate
		const validation = validateMappingStructure(config);
		if (!validation.valid) return; // Block save

		const storage = createStorage();

		// Save mapping
		const saveResult = await storage.saveMapping(config);
		if (!saveResult.success) return; // Save failed

		// Optionally set as active
		if (this.setActive) {
			const configResult = await storage.loadConfig();
			if (configResult.success) {
				const updatedConfig = { ...configResult.data, activeMapping: config.id };
				await storage.saveConfig(updatedConfig);
			}
		}

		this.renderer.keyInput.off('keypress', this.keyHandler!);
		resolve({ action: 'pop', data: { saved: true } });
	}

	private buildSaveConfig(): MappingConfig {
		const derivedId = toKebabCase(this.nameValue);
		return {
			...this.mapping,
			id: derivedId || this.mapping.id,
			name: this.nameValue || this.mapping.name,
			mappingVersion: this.versionValue,
		};
	}
}

/** ====== Processing Screen ======
 * Displays live progress as the convert workflow runs
 */
import { BoxRenderable, TextRenderable, type KeyEvent } from '@opentui/core';
import { SpinnerRenderable } from 'opentui-spinner';
import type { RenderContext, Renderer } from '../types';
import { theme } from '../../../brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import { buildSchemaRegistry } from '../../lib/schema/registryBuilder';
import { convertWorkflow } from '../../lib/workflows/csvConvert';
import { facAirtableMapping } from '../../lib/mappings/fac-airtable-2025';
import { createStorage } from '../../lib/storage';
import type {
	WorkflowStepEvent,
	WorkflowResult,
	ConvertOutput,
} from '../../lib/types/workflowTypes';
import type { ValidationResult } from '../../lib/utils/csv/csvValidator';

interface StepDisplay {
	id: string;
	name: string;
	status: 'pending' | 'running' | 'complete' | 'failed' | 'skipped';
	message?: string;
	errorSamples?: string[];
}

interface StepRenderables {
	row: BoxRenderable;
	iconContainer: BoxRenderable;
	spinner: SpinnerRenderable | null;
	iconText: TextRenderable | null;
	nameText: TextRenderable;
	messageText: TextRenderable | null;
	errorsContainer: BoxRenderable | null;
}

const CONTAINER_ID = 'processing-root';

export class ProcessingScreen implements Screen {
	readonly name = 'processing';
	private renderer: Renderer;
	private container?: BoxRenderable;
	private stepsContainer?: BoxRenderable;
	private resultContainer?: BoxRenderable;
	private statusBar?: TextRenderable;
	private keyHandler?: (key: KeyEvent) => void;

	private steps: StepDisplay[] = [
		{ id: 'parse', name: 'Parse CSV', status: 'pending' },
		{ id: 'validate', name: 'Validate Data', status: 'pending' },
		{ id: 'generate', name: 'Generate XML', status: 'pending' },
		{ id: 'save', name: 'Save Output', status: 'pending' },
	];
	private stepRenderables: Map<string, StepRenderables> = new Map();
	private result: WorkflowResult<ConvertOutput> | null = null;
	private error: Error | null = null;

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		const filePath = data?.filePath as string;
		if (!filePath) return { action: 'pop' };

		const storage = createStorage();
		const schemaResult = await storage.loadSchema('schemafile25.xsd');

		if (!schemaResult.success) {
			this.error = new Error(`Failed to load schema: ${schemaResult.error.message}`);
			this.buildUI();
			this.showError();
			return this.waitForKeyThenPop();
		}

		const registry = buildSchemaRegistry(schemaResult.data);

		this.buildUI();

		// Single-pass workflow execution (fixes double-generator bug)
		try {
			const gen = convertWorkflow({
				filePath,
				registry,
				mapping: facAirtableMapping,
			});

			while (true) {
				const next = await gen.next();
				if (next.done) {
					this.result = next.value;
					break;
				}
				this.handleEvent(next.value);
			}
		} catch (err) {
			this.error = err instanceof Error ? err : new Error(String(err));
		}

		this.showResult();
		return this.waitForKeyThenPop();
	}

	cleanup(): void {
		if (this.keyHandler) {
			this.renderer.keyInput.off('keypress', this.keyHandler);
		}
		// Stop any running spinners
		for (const renderables of this.stepRenderables.values()) {
			if (renderables.spinner) {
				renderables.spinner.stop();
			}
		}
		this.renderer.root.remove(CONTAINER_ID);
	}

	private buildUI(): void {
		// Root container
		this.container = new BoxRenderable(this.renderer, {
			id: CONTAINER_ID,
			flexDirection: 'column',
			width: '100%',
			height: '100%',
			backgroundColor: theme.background,
		});

		// Title
		const title = new TextRenderable(this.renderer, {
			content: 'Converting',
			fg: theme.primary,
		});
		this.container.add(title);

		// Spacer
		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Steps container
		this.stepsContainer = new BoxRenderable(this.renderer, {
			flexDirection: 'column',
			flexGrow: 1,
		});

		// Build step renderables
		for (const step of this.steps) {
			const stepRow = new BoxRenderable(this.renderer, {
				flexDirection: 'row',
				gap: 1,
			});

			const iconContainer = new BoxRenderable(this.renderer, {
				width: 2,
			});
			const iconText = new TextRenderable(this.renderer, {
				content: this.getStatusIcon(step.status),
				fg: this.getStatusColor(step.status),
			});
			iconContainer.add(iconText);
			stepRow.add(iconContainer);

			const nameText = new TextRenderable(this.renderer, {
				content: step.name,
				fg: this.getStatusColor(step.status),
			});
			stepRow.add(nameText);

			this.stepsContainer.add(stepRow);

			this.stepRenderables.set(step.id, {
				row: stepRow,
				iconContainer,
				spinner: null,
				iconText,
				nameText,
				messageText: null,
				errorsContainer: null,
			});
		}

		this.container.add(this.stepsContainer);

		// Result container (initially empty)
		this.resultContainer = new BoxRenderable(this.renderer, {
			flexDirection: 'column',
		});
		this.container.add(this.resultContainer);

		// Status bar
		this.statusBar = new TextRenderable(this.renderer, {
			content: 'Processing...',
			fg: theme.textMuted,
		});
		this.container.add(this.statusBar);

		// Add to renderer
		this.renderer.root.add(this.container);
	}

	private handleEvent(event: WorkflowStepEvent): void {
		const step = this.steps.find((s) => s.id === event.step.id);
		if (!step) return;

		const renderables = this.stepRenderables.get(step.id);
		if (!renderables) return;

		if (event.type === 'step:start') {
			step.status = 'running';
			step.message = undefined;
			step.errorSamples = undefined;

			// Replace icon with spinner
			if (renderables.iconText) {
				renderables.iconContainer.remove(renderables.iconText.id);
			}
			renderables.spinner = new SpinnerRenderable(this.renderer, {
				autoplay: true,
				color: theme.primary,
			});
			renderables.iconContainer.add(renderables.spinner);

			// Update name color
			renderables.nameText.fg = theme.primary;
		} else if (event.type === 'step:complete') {
			step.status = 'complete';

			// Stop spinner, replace with success icon
			if (renderables.spinner) {
				renderables.spinner.stop();
				renderables.iconContainer.remove(renderables.spinner.id);
				renderables.spinner = null;
			}
			renderables.iconText = new TextRenderable(this.renderer, {
				content: this.getStatusIcon('complete'),
				fg: this.getStatusColor('complete'),
			});
			renderables.iconContainer.add(renderables.iconText);

			// Update name color
			renderables.nameText.fg = theme.success;

			// Special handling for validate step
			if (step.id === 'validate' && event.step.data) {
				const validation = event.step.data as ValidationResult;
				const errorCount = validation.errorCount;
				const warningCount = validation.warningCount;

				const sampleSize = 3;
				const sampleErrors = validation.issues
					.filter((i) => i.severity === 'error')
					.slice(0, sampleSize);

				step.message = validation.valid
					? 'No errors found'
					: `${errorCount} errors, ${warningCount} warnings`;

				step.errorSamples = sampleErrors.map((e) => {
					const rowDisplay = e.row !== undefined ? ` (row ${e.row})` : '';
					const valueDisplay =
						e.actualValue !== undefined ? ` [value: ${JSON.stringify(e.actualValue)}]` : '';
					return `${e.field || 'general'}: ${e.message}${rowDisplay}${valueDisplay}`;
				});

				// Add message
				if (step.message) {
					renderables.messageText = new TextRenderable(this.renderer, {
						content: `    ${step.message}`,
						fg: theme.textMuted,
					});
					this.stepsContainer!.add(renderables.messageText);
				}

				// Add error samples
				if (step.errorSamples && step.errorSamples.length > 0) {
					renderables.errorsContainer = new BoxRenderable(this.renderer, {
						flexDirection: 'column',
					});
					for (const sample of step.errorSamples) {
						const errorText = new TextRenderable(this.renderer, {
							content: `      • ${sample}`,
							fg: theme.error,
						});
						renderables.errorsContainer.add(errorText);
					}
					this.stepsContainer!.add(renderables.errorsContainer);
				}
			} else {
				step.message = event.step.message;
				if (step.message) {
					renderables.messageText = new TextRenderable(this.renderer, {
						content: `    ${step.message}`,
						fg: theme.textMuted,
					});
					this.stepsContainer!.add(renderables.messageText);
				}
			}
		} else if (event.type === 'step:error') {
			step.status = 'failed';
			step.message = event.step.error?.message;

			// Stop spinner, replace with error icon
			if (renderables.spinner) {
				renderables.spinner.stop();
				renderables.iconContainer.remove(renderables.spinner.id);
				renderables.spinner = null;
			}
			renderables.iconText = new TextRenderable(this.renderer, {
				content: this.getStatusIcon('failed'),
				fg: this.getStatusColor('failed'),
			});
			renderables.iconContainer.add(renderables.iconText);

			// Update name color
			renderables.nameText.fg = theme.error;

			// Add error message
			if (step.message) {
				renderables.messageText = new TextRenderable(this.renderer, {
					content: `    ${step.message}`,
					fg: theme.textMuted,
				});
				this.stepsContainer!.add(renderables.messageText);
			}
		}
	}

	private showError(): void {
		if (!this.error || !this.resultContainer) return;

		const errorText = new TextRenderable(this.renderer, {
			content: `Error: ${this.error.message}`,
			fg: theme.error,
		});
		this.resultContainer.add(errorText);
	}

	private showResult(): void {
		if (!this.result || !this.resultContainer) return;

		this.resultContainer.add(new TextRenderable(this.renderer, { content: '' }));

		if (this.result.success) {
			const successText = new TextRenderable(this.renderer, {
				content: '✓ Conversion complete',
				fg: theme.success,
			});
			this.resultContainer.add(successText);

			const durationText = new TextRenderable(this.renderer, {
				content: `Duration: ${this.result.duration}ms`,
				fg: theme.textMuted,
			});
			this.resultContainer.add(durationText);
		} else {
			const failText = new TextRenderable(this.renderer, {
				content: '✗ Conversion failed',
				fg: theme.error,
			});
			this.resultContainer.add(failText);

			if (this.result.error) {
				const errorText = new TextRenderable(this.renderer, {
					content: this.result.error.message,
					fg: theme.textMuted,
				});
				this.resultContainer.add(errorText);
			}
		}
	}

	private waitForKeyThenPop(): Promise<ScreenResult> {
		if (this.statusBar) {
			this.statusBar.content = '[Any key] Continue';
		}
		return new Promise((resolve) => {
			this.keyHandler = () => resolve({ action: 'pop' });
			this.renderer.keyInput.once('keypress', this.keyHandler);
		});
	}

	private getStatusIcon(status: StepDisplay['status']): string {
		switch (status) {
			case 'pending':
				return '○';
			case 'running':
				return '◐';
			case 'complete':
				return '●';
			case 'failed':
				return '✗';
			case 'skipped':
				return '◌';
		}
	}

	private getStatusColor(status: StepDisplay['status']): string {
		switch (status) {
			case 'pending':
				return theme.textMuted;
			case 'running':
				return theme.primary;
			case 'complete':
				return theme.success;
			case 'failed':
				return theme.error;
			case 'skipped':
				return theme.textMuted;
		}
	}
}

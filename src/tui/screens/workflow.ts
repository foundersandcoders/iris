/** ====== Workflow Screen ======
 * Generic workflow runner that handles convert, validate, and check flows
 */
import { BoxRenderable, TextRenderable, type KeyEvent } from '@opentui/core';
import { SpinnerRenderable } from 'opentui-spinner';
import type { RenderContext, Renderer } from '../types';
import { theme } from '../../../brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import { buildSchemaRegistry } from '../../lib/schema/registryBuilder';
import { convertWorkflow } from '../../lib/workflows/csvConvert';
import { validateWorkflow } from '../../lib/workflows/csvValidate';
import { xmlValidateWorkflow } from '../../lib/workflows/xmlValidate';
import { checkWorkflow } from '../../lib/workflows/crossCheck';
import { facAirtableMapping } from '../../lib/mappings/fac-airtable-2025';
import { createStorage } from '../../lib/storage';
import type {
	WorkflowStepEvent,
	WorkflowResult,
	ConvertOutput,
	ValidateOutput,
	CheckOutput,
} from '../../lib/types/workflowTypes';
import type { ValidationResult } from '../../lib/utils/csv/csvValidator';

type WorkflowType = 'convert' | 'validate' | 'check';
type WorkflowOutput = ConvertOutput | ValidateOutput | CheckOutput;

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

interface WorkflowConfig {
	title: string;
	steps: Array<{ id: string; name: string }>;
}

const CONTAINER_ID = 'workflow-root';

// Step configurations per workflow type
const WORKFLOW_CONFIGS: Record<WorkflowType, WorkflowConfig> = {
	convert: {
		title: 'Converting',
		steps: [
			{ id: 'parse', name: 'Parse CSV' },
			{ id: 'validate', name: 'Validate Data' },
			{ id: 'generate', name: 'Generate XML' },
			{ id: 'save', name: 'Save Output' },
		],
	},
	validate: {
		title: 'Validating',
		steps: [
			{ id: 'load', name: 'Load File' },
			{ id: 'parse', name: 'Parse File' },
			{ id: 'validate', name: 'Run Validation' },
			{ id: 'report', name: 'Generate Report' },
		],
	},
	check: {
		title: 'Checking',
		steps: [
			{ id: 'load', name: 'Load XML File' },
			{ id: 'parse', name: 'Parse XML' },
			{ id: 'loadHistory', name: 'Load Submission History' },
			{ id: 'check', name: 'Run Cross-Submission Checks' },
			{ id: 'report', name: 'Generate Report' },
		],
	},
};

export class WorkflowScreen implements Screen {
	readonly name = 'workflow';
	private renderer: Renderer;
	private container?: BoxRenderable;
	private stepsContainer?: BoxRenderable;
	private statusBar?: TextRenderable;
	private keyHandler?: (key: KeyEvent) => void;

	private workflowType: WorkflowType = 'convert';
	private steps: StepDisplay[] = [];
	private stepRenderables: Map<string, StepRenderables> = new Map();
	private result: WorkflowResult<WorkflowOutput> | null = null;
	private error: Error | null = null;

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		const filePath = data?.filePath as string;
		const workflowType = (data?.workflowType as WorkflowType) || 'convert';

		if (!filePath) return { action: 'pop' };

		this.workflowType = workflowType;
		const config = WORKFLOW_CONFIGS[workflowType];

		// Initialise steps from config
		this.steps = config.steps.map((s) => ({
			id: s.id,
			name: s.name,
			status: 'pending' as const,
		}));

		// Load schema for convert/validate workflows only
		let registry;
		if (workflowType === 'convert' || workflowType === 'validate') {
			const storage = createStorage();
			const schemaResult = await storage.loadSchema('schemafile25.xsd');

			if (!schemaResult.success) {
				this.error = new Error(`Failed to load schema: ${schemaResult.error.message}`);
				this.buildUI(config.title);
				return this.waitForKeyThenReplace();
			}

			registry = buildSchemaRegistry(schemaResult.data);
		}

		this.buildUI(config.title);

		// Execute workflow
		try {
			const gen = this.createWorkflowGenerator(workflowType, filePath, registry);

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

		// Route to appropriate result screen
		return this.routeToResultScreen();
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

	private createWorkflowGenerator(
		type: WorkflowType,
		filePath: string,
		registry?: any
	): AsyncGenerator<WorkflowStepEvent, WorkflowResult<WorkflowOutput>, void> {
		switch (type) {
			case 'convert':
				return convertWorkflow({
					filePath,
					registry,
					mapping: facAirtableMapping,
				}) as AsyncGenerator<WorkflowStepEvent, WorkflowResult<WorkflowOutput>, void>;

			case 'validate': {
				// Auto-detect CSV vs XML
				const ext = filePath.toLowerCase();
				if (ext.endsWith('.xml')) {
					// XML validation doesn't actually use mapping, but ValidateInput requires it
					return xmlValidateWorkflow({
						filePath,
						registry,
						mapping: facAirtableMapping, // Unused for XML validation
					}) as AsyncGenerator<WorkflowStepEvent, WorkflowResult<WorkflowOutput>, void>;
				} else {
					return validateWorkflow({
						filePath,
						registry,
						mapping: facAirtableMapping,
					}) as AsyncGenerator<WorkflowStepEvent, WorkflowResult<WorkflowOutput>, void>;
				}
			}

			case 'check':
				return checkWorkflow({
					filePath,
				}) as AsyncGenerator<WorkflowStepEvent, WorkflowResult<WorkflowOutput>, void>;

			default:
				throw new Error(`Unknown workflow type: ${type}`);
		}
	}

	private routeToResultScreen(): ScreenResult {
		if (this.error || (this.result && !this.result.success)) {
			// Failure: go to success screen with error
			return {
				action: 'replace',
				screen: 'success',
				data: {
					type: this.workflowType,
					failed: true,
					error: this.error || this.result?.error,
				},
			};
		}

		if (!this.result) {
			// Should never happen, but handle gracefully
			return { action: 'replace', screen: 'dashboard' };
		}

		const { data, duration } = this.result;

		switch (this.workflowType) {
			case 'convert': {
				const convertData = data as ConvertOutput;
				const hasIssues = !convertData.validation.valid;

				return {
					action: 'replace',
					screen: 'success',
					data: {
						type: 'convert',
						duration,
						outputPath: convertData.outputPath,
						learnerCount: convertData.csvData.rows.length,
						hasIssues,
						validation: convertData.validation,
					},
				};
			}

			case 'validate': {
				const validateData = data as ValidateOutput;
				const hasIssues = !validateData.validation.valid;

				if (hasIssues) {
					// Route to validation explorer
					return {
						action: 'replace',
						screen: 'validation-explorer',
						data: {
							validation: validateData.validation,
							sourceType: this.isXMLSource(validateData) ? 'xml' : 'csv',
						},
					};
				} else {
					// No issues: success screen
					return {
						action: 'replace',
						screen: 'success',
						data: {
							type: 'validate',
							duration,
							validation: validateData.validation,
						},
					};
				}
			}

			case 'check': {
				const checkData = data as CheckOutput;
				return {
					action: 'replace',
					screen: 'check-results',
					data: {
						report: checkData.report,
						hasIssues: checkData.hasIssues,
						duration,
					},
				};
			}

			default:
				return { action: 'replace', screen: 'dashboard' };
		}
	}

	private isXMLSource(validateData: ValidateOutput): boolean {
		return typeof validateData.sourceData === 'string'; // XML is string, CSV is CSVData object
	}

	private buildUI(title: string): void {
		// Root container
		this.container = new BoxRenderable(this.renderer, {
			id: CONTAINER_ID,
			flexDirection: 'column',
			width: '100%',
			height: '100%',
			backgroundColor: theme.background,
		});

		// Title
		const titleText = new TextRenderable(this.renderer, {
			content: title,
			fg: theme.primary,
		});
		this.container.add(titleText);

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

			// Update name colour
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

			// Update name colour
			renderables.nameText.fg = theme.success;

			// Special handling for validate step in convert/validate workflows
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

			// Update name colour
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

	private waitForKeyThenReplace(): Promise<ScreenResult> {
		if (this.statusBar) {
			this.statusBar.content = '[Any key] Continue';
		}
		return new Promise((resolve) => {
			this.keyHandler = () =>
				resolve({
					action: 'replace',
					screen: 'dashboard',
				});
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

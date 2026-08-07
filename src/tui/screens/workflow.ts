/** ====== Workflow Screen ======
 * Generic workflow runner that handles convert, validate, and check flows
 */
import { BoxRenderable, TextRenderable } from '@opentui/core';
import { SpinnerRenderable } from 'opentui-spinner';
import type { RenderContext, Renderer } from '../types';
import { theme, symbols } from '../../../assets/brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import { appShell, panel, progressBar, type AppShell, type Panel, type ProgressBar } from '../components';
import { Keymap } from '../utils/keymap';
import type { ToastManager } from '../utils/toastManager';
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
	/** 0-100, mirroring WorkflowStep.progress. Only meaningful while running —
	 *  terminal states (complete/failed/skipped) count as a whole step
	 *  regardless of this value; see computeAggregateProgress(). */
	progress: number;
	message?: string;
	errorSamples?: string[];
}

/** Format milliseconds as m:ss. Floor, not round, so the readout never runs
 *  ahead of reality (e.g. 1999ms reads "0:01", not "0:02"). */
export function formatElapsed(ms: number): string {
	const total = Math.max(0, Math.floor(ms / 1000));
	const minutes = Math.floor(total / 60);
	const seconds = total % 60;
	return `elapsed ${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Aggregate completion across steps, 0-1. Each step contributes 1/n; a
 *  running step contributes its own fractional progress, so a workflow that
 *  later starts emitting step:progress refines the estimate automatically —
 *  today no workflow does, so running steps sit at 0 and this degenerates
 *  exactly to completedSteps/totalSteps.
 *
 *  Skipped and failed both count as a WHOLE step, not zero: csvConvert.ts
 *  marks the generate/save steps 'skipped' when validation blocks the run,
 *  leaving their progress at 0. If skipped didn't count, a blocked
 *  conversion would freeze the bar at 50% while the workflow visibly
 *  finishes and navigates away — a bar that lies. Failed steps stop the
 *  workflow the same way, so the bar should settle rather than hang. */
export function computeAggregateProgress(steps: StepDisplay[]): number {
	if (steps.length === 0) return 0;
	const done = steps.reduce((sum, step) => {
		if (step.status === 'complete' || step.status === 'skipped' || step.status === 'failed') {
			return sum + 1;
		}
		if (step.status === 'running') {
			return sum + Math.min(100, Math.max(0, step.progress)) / 100;
		}
		return sum;
	}, 0);
	// Guards a malformed progress value (or floating-point drift) pushing the
	// total fractionally over 1.
	return Math.min(1, done / steps.length);
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
	private toasts?: ToastManager;
	private shell?: AppShell;
	private stepsPanel?: Panel;
	private stepsContainer?: BoxRenderable;
	private progress?: ProgressBar;
	private elapsedTimer?: ReturnType<typeof setInterval>;
	private startTime = 0;
	private keymap?: Keymap;

	private workflowType: WorkflowType = 'convert';
	private steps: StepDisplay[] = [];
	private stepRenderables: Map<string, StepRenderables> = new Map();
	private result: WorkflowResult<WorkflowOutput> | null = null;
	private error: Error | null = null;

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
		this.toasts = ctx.toasts;
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
			progress: 0,
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
		this.startTime = Date.now();
		this.startElapsedTimer();
		try {
			const gen = this.createWorkflowGenerator(workflowType, filePath, registry, data);

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
		} finally {
			// Covers success, error, and early return alike — one place, before
			// routeToResultScreen() navigates away.
			this.stopElapsedTimer();
		}

		// Route to appropriate result screen
		return this.routeToResultScreen();
	}

	private startElapsedTimer(): void {
		this.elapsedTimer ??= setInterval(() => {
			this.progress?.setStatus(formatElapsed(Date.now() - this.startTime));
		}, 1000);
	}

	private stopElapsedTimer(): void {
		if (this.elapsedTimer) {
			clearInterval(this.elapsedTimer);
			this.elapsedTimer = undefined;
		}
	}

	private updateProgress(): void {
		this.progress?.setValue(computeAggregateProgress(this.steps));
	}

	cleanup(): void {
		// The single most important line in this feature: a surviving interval
		// holds a reference to this screen and keeps calling setStatus on
		// renderables that cleanup() is about to remove, forever. The finally
		// in render() covers the normal (success/error) exit; this covers
		// teardown while the workflow is still running (e.g. the router
		// replacing the screen mid-flight). stopElapsedTimer() is idempotent,
		// so the two calls never conflict.
		this.stopElapsedTimer();
		this.keymap?.detach(this.renderer);
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
		registry?: any,
		data?: ScreenData
	): AsyncGenerator<WorkflowStepEvent, WorkflowResult<WorkflowOutput>, void> {
		switch (type) {
			case 'convert':
				return convertWorkflow({
					filePath,
					registry,
					mapping: facAirtableMapping,
					outputDir: data?.outputDir as string | undefined,
				}) as AsyncGenerator<WorkflowStepEvent, WorkflowResult<WorkflowOutput>, void>;

			case 'validate': {
				// Auto-detect CSV vs XML
				const ext = filePath.toLowerCase();
				if (ext.endsWith('.xml')) {
					return xmlValidateWorkflow({
						filePath,
						registry,
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
					previousFilePath: data?.previousFilePath as string | undefined,
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

				// If blocked by validation errors, route to validation explorer
				if (convertData.blocked) {
					return {
						action: 'replace',
						screen: 'validation-explorer',
						data: {
							validation: convertData.validation,
							sourceType: 'csv',
						},
					};
				}

				const hasIssues = !convertData.validation.valid;
				const learnerCount = convertData.csvData.rows.length;

				// Fired here, not on the success screen: this toast must survive
				// this screen's teardown, which is exactly what proves the toast
				// manager is renderer-scoped rather than screen-owned (TR.C2).
				this.toasts?.success(
					`Converted ${learnerCount} learner${learnerCount === 1 ? '' : 's'}`
				);

				return {
					action: 'replace',
					screen: 'success',
					data: {
						type: 'convert',
						duration,
						outputPath: convertData.outputPath,
						learnerCount,
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
		this.shell = appShell(this.renderer, {
			id: CONTAINER_ID,
			breadcrumb: title,
			footer: 'Processing...',
		});

		this.stepsPanel = panel(this.renderer, { title, flexGrow: 1 });

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

		this.stepsPanel.add(this.stepsContainer);

		// Sibling of stepsContainer, not nested inside it: stepsContainer has
		// flexGrow:1 and absorbs the slack, which pins this to the panel's
		// bottom edge and keeps it there as messages/error samples get
		// appended above.
		this.progress = progressBar(this.renderer, {
			value: 0,
			status: formatElapsed(0),
			fillColor: theme.successAccent,
		});
		this.stepsPanel.add(this.progress.root);

		this.shell.content.add(this.stepsPanel.box);

		// Add to renderer
		this.renderer.root.add(this.shell.root);
	}

	private handleEvent(event: WorkflowStepEvent): void {
		const step = this.steps.find((s) => s.id === event.step.id);
		if (!step) return;

		const renderables = this.stepRenderables.get(step.id);
		if (!renderables) return;

		if (event.type === 'step:start') {
			step.status = 'running';
			step.progress = 0;
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
			this.updateProgress();
		} else if (event.type === 'step:progress') {
			// Dead code today by construction — no workflow yields this event —
			// present so the bar's wiring is correct the day one does. Must NOT
			// touch the spinner or icon: the step is still running.
			step.progress = event.step.progress ?? 0;
			if (event.step.message) step.message = event.step.message;
			this.updateProgress();
		} else if (event.type === 'step:complete') {
			// Check if step was skipped (e.g. blocked by validation)
			const isSkipped = event.step.status === 'skipped';
			step.status = isSkipped ? 'skipped' : 'complete';
			step.progress = 100;
			this.updateProgress();

			// Stop spinner, replace with appropriate icon
			if (renderables.spinner) {
				renderables.spinner.stop();
				renderables.iconContainer.remove(renderables.spinner.id);
				renderables.spinner = null;
			}
			renderables.iconText = new TextRenderable(this.renderer, {
				content: this.getStatusIcon(step.status),
				fg: this.getStatusColor(step.status),
			});
			renderables.iconContainer.add(renderables.iconText);

			// Update name colour
			renderables.nameText.fg = isSkipped ? theme.textMuted : theme.success;

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
					const rowDisplay = e.row !== undefined ? ` (row ${e.row + 1})` : '';
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
			step.progress = 100;
			step.message = event.step.error?.message;
			this.updateProgress();
			this.progress?.setFillColor(theme.errorAccent);

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
		return new Promise((resolve) => {
			const finish = () => resolve({ action: 'replace', screen: 'dashboard' });
			this.keymap = new Keymap({
				bindings: [{ keys: ['enter'], label: 'Continue', handler: finish }],
				onQuit: finish,
			});
			this.shell?.setFooter(this.keymap.toKeybar());
			this.keymap.attach(this.renderer);
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
				return symbols.info.error;
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

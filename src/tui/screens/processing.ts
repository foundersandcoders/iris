/** Processing Screen
 *
 * Displays live progress as the convert workflow runs.
 * Shows step status, messages, and handles completion/errors.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type { Terminal } from 'terminal-kit';
import { THEMES } from '../theme';
import { Layout } from '../utils/layout';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import { buildSchemaRegistry } from '../../lib/schema/registryBuilder';
import { convertWorkflow } from '../../lib/workflows/csvConvert';
import { facAirtableMapping } from '../../lib/mappings/fac-airtable-2025';
import type {
	WorkflowStepEvent,
	WorkflowResult,
	ConvertOutput,
} from '../../lib/types/workflowTypes';
import type { ValidationResult } from '../../lib/utils/csv/csvValidator';

const theme = THEMES.themeLight;

interface StepDisplay {
	id: string;
	name: string;
	status: 'pending' | 'running' | 'complete' | 'failed' | 'skipped';
	message?: string;
	errorSamples?: string[];
}

export class ProcessingScreen implements Screen {
	readonly name = 'processing';
	private layout: Layout;
	private steps: StepDisplay[] = [
		{ id: 'parse', name: 'Parse CSV', status: 'pending' },
		{ id: 'validate', name: 'Validate Data', status: 'pending' },
		{ id: 'generate', name: 'Generate XML', status: 'pending' },
		{ id: 'save', name: 'Save Output', status: 'pending' },
	];
	private result: WorkflowResult<ConvertOutput> | null = null;
	private error: Error | null = null;

	constructor(private term: Terminal) {
		this.layout = new Layout(term);
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		const filePath = data?.filePath as string;
		if (!filePath) return { action: 'pop' };

		const xsdPath = join(process.cwd(), 'docs/schemas/schemafile25.xsd');
		const xsd = readFileSync(xsdPath, 'utf-8');
		const registry = buildSchemaRegistry(xsd);

		this.drawScreen();

		try {
			const workflow = convertWorkflow({ filePath, registry, mapping: facAirtableMapping });

			for await (const event of workflow) {
				this.handleEvent(event);
				this.drawScreen();
			}

			/* LOG (25-01-16): Capturing generator returns
			 *
			 * Get final result - need to run again to capture return value (for-await doesn't give us the return)
			 */
			const gen = convertWorkflow({ filePath, registry, mapping: facAirtableMapping });

			let done = false;
			while (!done) {
				const next = await gen.next();
				if (next.done) {
					this.result = next.value;
					done = true;
				}
			}
		} catch (err) {
			this.error = err instanceof Error ? err : new Error(String(err));
		}

		this.drawScreen();

		return new Promise((resolve) => {
			this.term.on('key', (key: string) => {
				this.cleanup();

				if (this.result?.success) {
					this.term.on('key', (key: string) => {
						this.cleanup();
						resolve({ action: 'pop' });
					});
				} else {
					resolve({ action: 'pop' });
				}
			});
		});
	}

	cleanup(): void {
		this.term.removeAllListeners('key');
	}

	private handleEvent(event: WorkflowStepEvent): void {
		const step = this.steps.find((s) => s.id === event.step.id);
		if (!step) return;

		if (event.type === 'step:start') {
			step.status = 'running';
			step.message = undefined;
			step.errorSamples = undefined;
		} else if (event.type === 'step:complete') {
			step.status = 'complete';

			// Special handling for validate step to show error samples
			if (step.id === 'validate' && event.step.data) {
				const validation = event.step.data as ValidationResult;
				const errorCount = validation.errorCount;
				const warningCount = validation.warningCount;

				// Show count + sample of first few errors
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
			} else {
				step.message = event.step.message;
			}
		} else if (event.type === 'step:error') {
			step.status = 'failed';
			step.message = event.step.error?.message;
		}
	}

	private drawScreen(): void {
		const region = this.layout.draw({
			title: 'Converting',
			statusBar: this.result ? '[Any key] Continue' : 'Processing...',
		});

		let currentY = region.contentTop + 1;

		this.steps.forEach((step) => {
			this.term.moveTo(4, currentY);

			const icon = this.getStatusIcon(step.status);
			const color = this.getStatusColor(step.status);

			this.term.colorRgbHex(color)(`${icon}  ${step.name}`);
			currentY++;

			if (step.message) {
				this.term.moveTo(8, currentY);
				this.term.colorRgbHex(theme.textMuted)(step.message);
				currentY++;
			}

			if (step.errorSamples && step.errorSamples.length > 0) {
				step.errorSamples.forEach((sample) => {
					this.term.moveTo(8, currentY);
					this.term.colorRgbHex(theme.error)(`  • ${sample}`);
					currentY++;
				});
			}

			currentY++;
		});

		if (this.result) {
			const summaryY = currentY + 1;
			this.term.moveTo(4, summaryY);

			if (this.result.success) {
				this.term.colorRgbHex(theme.success)('✓ Conversion complete');
				this.term.moveTo(4, summaryY + 1);
				this.term.colorRgbHex(theme.textMuted)(`Duration: ${this.result.duration}ms`);
			} else {
				this.term.colorRgbHex(theme.error)('✗ Conversion failed');
				if (this.result.error) {
					this.term.moveTo(4, summaryY + 1);
					this.term.colorRgbHex(theme.textMuted)(this.result.error.message);
				}
			}
		}

		if (this.error) {
			const errorY = currentY + 1;
			this.term.moveTo(4, errorY);
			this.term.colorRgbHex(theme.error)(`Error: ${this.error.message}`);
		}
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

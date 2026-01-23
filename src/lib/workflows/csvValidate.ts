/** |===================|| CSV Validation Workflow ||==================|
 *  | Validates CSV files before conversion to XML. Yields step events
 *  | for UI consumption.
 *  |
 *  | NOTE: XML validation is separate (see validate-xml workflow)
 *  |==================================================================|
 */

/** Validate Workflow (CSV)
 *
 *
 */
import { parseCSV, type CSVData } from '../utils/csv/csvParser';
import { validateRows, type ValidationResult } from '../utils/csv/csvValidator';
import type {
	ValidateInput,
	ValidateOutput,
	WorkflowStep,
	WorkflowStepEvent,
	WorkflowResult,
} from '../types/workflow';

const STEPS = {
	load: { id: 'load', name: 'Load File' },
	parse: { id: 'parse', name: 'Parse CSV' },
	validate: { id: 'validate', name: 'Run Validation' },
	report: { id: 'report', name: 'Generate Report' },
} as const;

export async function* validateWorkflow(
	input: ValidateInput
): AsyncGenerator<WorkflowStepEvent, WorkflowResult<ValidateOutput>, void> {
	const startTime = Date.now();
	const steps: WorkflowStep[] = [];

	// --- Step 1: Load File ---
	const loadStep = createStep(STEPS.load);

	steps.push(loadStep);
	yield stepEvent('step:start', loadStep);

	try {
		const file = Bun.file(input.filePath);
		if (!(await file.exists())) throw new Error(`File not found: ${input.filePath}`);

		if (!input.filePath.toLowerCase().endsWith('.csv'))
			throw new Error(
				'Only CSV files are supported. For XML validation, use validate-xml workflow.'
			);

		const size = file.size;
		loadStep.status = 'complete';
		loadStep.progress = 100;
		loadStep.message = `Loaded ${(size / 1024).toFixed(1)} KB`;

		yield stepEvent('step:complete', loadStep);
	} catch (error) {
		loadStep.status = 'failed';
		loadStep.error = error instanceof Error ? error : new Error(String(error));

		yield stepEvent('step:error', loadStep);

		return failedResult(steps, loadStep.error, startTime);
	}

	// --- Step 2: Parse CSV ---
	let csvData: CSVData;
	const parseStep = createStep(STEPS.parse);

	steps.push(parseStep);
	yield stepEvent('step:start', parseStep);

	try {
		csvData = await parseCSV(input.filePath);

		parseStep.status = 'complete';
		parseStep.progress = 100;
		parseStep.data = csvData;
		parseStep.message = `Parsed ${csvData.rows.length} rows`;

		yield stepEvent('step:complete', parseStep);
	} catch (error) {
		parseStep.status = 'failed';
		parseStep.error = error instanceof Error ? error : new Error(String(error));

		yield stepEvent('step:error', parseStep);

		return failedResult(steps, parseStep.error, startTime);
	}

	// --- Step 3: Validate ---
	let validation: ValidationResult;
	const validateStep = createStep(STEPS.validate);

	steps.push(validateStep);
	yield stepEvent('step:start', validateStep);

	try {
		validation = validateRows(csvData.rows, csvData.headers, input.registry);

		validateStep.status = 'complete';
		validateStep.progress = 100;
		validateStep.data = validation;
		validateStep.message = validation.valid
			? 'No errors found'
			: `Found ${validation.errorCount} errors, ${validation.warningCount} warnings`;

		yield stepEvent('step:complete', validateStep);
	} catch (error) {
		validateStep.status = 'failed';
		validateStep.error = error instanceof Error ? error : new Error(String(error));

		yield stepEvent('step:error', validateStep);

		return failedResult(steps, validateStep.error, startTime);
	}

	// --- Step 4: Generate Report ---
	const reportStep = createStep(STEPS.report);

	steps.push(reportStep);
	yield stepEvent('step:start', reportStep);

	try {
		reportStep.status = 'complete';
		reportStep.progress = 100;
		reportStep.message = 'Validation complete';

		yield stepEvent('step:complete', reportStep);
	} catch (error) {
		reportStep.status = 'failed';
		reportStep.error = error instanceof Error ? error : new Error(String(error));

		yield stepEvent('step:error', reportStep);

		return failedResult(steps, reportStep.error, startTime);
	}

	// --- IS WIN ---
	return {
		success: true,
		data: { validation, sourceData: csvData },
		steps,
		duration: Date.now() - startTime,
	};
}

function createStep(def: { id: string; name: string }): WorkflowStep {
	return {
		id: def.id,
		name: def.name,
		status: 'pending',
		progress: 0,
	};
}

function stepEvent<T>(
	type: WorkflowStepEvent['type'],
	step: WorkflowStep<T>
): WorkflowStepEvent<T> {
	return { type, step, timestamp: Date.now() };
}

function failedResult(
	steps: WorkflowStep[],
	error: Error,
	startTime: number
): WorkflowResult<ValidateOutput> {
	return {
		success: false,
		error,
		steps,
		duration: Date.now() - startTime,
	};
}

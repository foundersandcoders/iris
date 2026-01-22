/** Convert Workflow
 *
 * Orchestrates CSV → XML conversion with validation.
 * Yields step events for UI consumption.
 */
import { parseCSV, type CSVData } from '../parser';
import { validateRows, type ValidationResult } from '../validator';
import { generateILR, type ILRMessage, type Learner, type LearningDelivery } from '../generator';
import type {
	ConvertInput,
	ConvertOutput,
	WorkflowStep,
	WorkflowStepEvent,
	WorkflowResult,
} from '../types/workflow';
import { homedir } from 'os';
import { join } from 'path';

const STEPS = {
	parse: { id: 'parse', name: 'Parse CSV' },
	validate: { id: 'validate', name: 'Validate Data' },
	generate: { id: 'generate', name: 'Generate XML' },
	save: { id: 'save', name: 'Save Output' },
} as const;

/* LOG (25-01-16): Async Generators
 * Who knew??
 */
export async function* convertWorkflow(
	input: ConvertInput
): AsyncGenerator<WorkflowStepEvent, WorkflowResult<ConvertOutput>, void> {
	const startTime = Date.now();
	const steps: WorkflowStep[] = [];

	// --- Step 1: Parse CSV ---
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

	// --- Step 2: Validate ---
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
			? 'Validation passed'
			: `${validation.errorCount} errors, ${validation.warningCount} warnings`;
		yield stepEvent('step:complete', validateStep);
	} catch (error) {
		validateStep.status = 'failed';
		validateStep.error = error instanceof Error ? error : new Error(String(error));
		yield stepEvent('step:error', validateStep);
		return failedResult(steps, validateStep.error, startTime);
	}

	// --- Step 3: Generate XML ---
	let xml: string;
	const generateStep = createStep(STEPS.generate);
	steps.push(generateStep);

	yield stepEvent('step:start', generateStep);

	try {
		const message = buildILRMessage(csvData);
		xml = generateILR(message);
		generateStep.status = 'complete';
		generateStep.progress = 100;
		generateStep.message = 'XML generated';
		yield stepEvent('step:complete', generateStep);
	} catch (error) {
		generateStep.status = 'failed';
		generateStep.error = error instanceof Error ? error : new Error(String(error));
		yield stepEvent('step:error', generateStep);
		return failedResult(steps, generateStep.error, startTime);
	}

	// --- Step 4: Save Output ---
	let outputPath: string;
	const saveStep = createStep(STEPS.save);
	steps.push(saveStep);

	yield stepEvent('step:start', saveStep);

	try {
		const outputDir = input.outputDir ?? join(homedir(), '.iris', 'submissions');
		await Bun.write(join(outputDir, '.keep'), ''); // Ensure dir exists

		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const filename = `ILR-${timestamp}.xml`;
		outputPath = join(outputDir, filename);

		await Bun.write(outputPath, xml);

		saveStep.status = 'complete';
		saveStep.progress = 100;
		saveStep.message = `Saved to ${filename}`;
		yield stepEvent('step:complete', saveStep);
	} catch (error) {
		saveStep.status = 'failed';
		saveStep.error = error instanceof Error ? error : new Error(String(error));
		yield stepEvent('step:error', saveStep);
		return failedResult(steps, saveStep.error, startTime);
	}

	// --- Success ---
	return {
		success: true,
		data: { xml, outputPath, csvData, validation },
		steps,
		duration: Date.now() - startTime,
	};
}

/**
 * Create a workflow step object initialized to the pending state.
 *
 * @param def - Object with `id` (unique step identifier) and `name` (human-readable step name)
 * @returns A `WorkflowStep` with the provided `id` and `name`, `status` set to `'pending'`, and `progress` set to `0`
 */
function createStep(def: { id: string; name: string }): WorkflowStep {
	return {
		id: def.id,
		name: def.name,
		status: 'pending',
		progress: 0,
	};
}

/**
 * Create a workflow step event combining an event type, a step snapshot, and a timestamp.
 *
 * @param type - The event type (e.g., 'step:start', 'step:complete', 'step:error')
 * @param step - The workflow step state to include in the event
 * @returns A WorkflowStepEvent containing the provided `type` and `step` and a `timestamp` (milliseconds since the UNIX epoch)
 */
function stepEvent<T>(
	type: WorkflowStepEvent['type'],
	step: WorkflowStep<T>
): WorkflowStepEvent<T> {
	return { type, step, timestamp: Date.now() };
}

/**
 * Build a failed workflow result object containing the provided steps, error, and elapsed duration.
 *
 * @param steps - The workflow steps recorded up to the failure
 * @param error - The error that caused the workflow to fail
 * @param startTime - The workflow start time in milliseconds since the epoch; used to compute duration
 * @returns A WorkflowResult with `success` set to `false`, the provided `error` and `steps`, and `duration` set to the elapsed milliseconds since `startTime`
 */
function failedResult(
	steps: WorkflowStep[],
	error: Error,
	startTime: number
): WorkflowResult<ConvertOutput> {
	return {
		success: false,
		error,
		steps,
		duration: Date.now() - startTime,
	};
}

/**
 * Builds an ILR message object from parsed CSV data.
 *
 * @param csvData - Parsed CSV payload containing `headers` and `rows`; each row is converted into a learner entry
 * @returns An `ILRMessage` containing a `header` (collection details with today's date as `filePreparationDate` and current timestamp), `source` metadata, `learningProvider` info, and `learners` mapped from the CSV rows
 */
function buildILRMessage(csvData: CSVData): ILRMessage {
	const now = new Date();

	return {
		header: {
			collectionDetails: {
				collection: 'ILR',
				year: '2526',
				filePreparationDate: now.toISOString().split('T')[0],
			},
			source: {
				protectiveMarking: 'OFFICIAL-SENSITIVE-Personal',
				ukprn: 10000000, // TODO: Get from config
				softwareSupplier: 'Founders and Coders',
				softwarePackage: 'Iris',
				release: '0.9.0',
				serialNo: '01',
				dateTime: now.toISOString(),
			},
		},
		learningProvider: {
			ukprn: 10000000, // TODO: Get from config
		},
		learners: csvData.rows.map(rowToLearner),
	};
}

/**
 * Builds a Learner object from a CSV row mapping expected ILR CSV columns to domain fields.
 *
 * Numeric columns (ULN, Ethnicity, LLDDHealthProb) are parsed to numbers with 0 used when absent; string columns fall back to empty string when appropriate. The returned learner includes a single `learningDeliveries` entry produced from the same row.
 *
 * @param row - A record representing a parsed CSV row with keys like `LearnRefNumber`, `ULN`, `FamilyName`, `GivenNames`, `DateOfBirth`, `Ethnicity`, `Sex`, `LLDDHealthProb`, `NINumber`, `PostcodePrior`, `Postcode`, and `Email`.
 * @returns A populated `Learner` object derived from the CSV row
 */
function rowToLearner(row: Record<string, string>): Learner {
	return {
		learnRefNumber: row['LearnRefNumber'] ?? '',
		uln: parseInt(row['ULN'] ?? '0', 10),
		familyName: row['FamilyName'],
		givenNames: row['GivenNames'],
		dateOfBirth: row['DateOfBirth'],
		ethnicity: parseInt(row['Ethnicity'] ?? '0', 10),
		sex: row['Sex'] ?? '',
		llddHealthProb: parseInt(row['LLDDHealthProb'] ?? '0', 10),
		niNumber: row['NINumber'],
		postcodePrior: row['PostcodePrior'] ?? '',
		postcode: row['Postcode'] ?? '',
		email: row['Email'],
		learningDeliveries: [rowToDelivery(row)],
	};
}

/**
 * Convert a parsed CSV row into a LearningDelivery object for the ILR message.
 *
 * @param row - CSV row values keyed by column header names
 * @returns A LearningDelivery with fields populated from the row:
 * - `learnAimRef`: aim reference string
 * - `aimType`: aim type as a number
 * - `aimSeqNumber`: aim sequence number as a number
 * - `learnStartDate`: learning start date string
 * - `learnPlanEndDate`: planned end date string
 * - `fundModel`: funding model as a number
 * - `progType`: programme type as a number, or `undefined` if not provided
 * - `stdCode`: standard code as a number, or `undefined` if not provided
 * - `delLocPostCode`: delivery location postcode string
 * - `compStatus`: completion status as a number
 * - `learnActEndDate`: actual end date string or `undefined`
 * - `outcome`: outcome as a number, or `undefined` if not provided
 */
function rowToDelivery(row: Record<string, string>): LearningDelivery {
	return {
		learnAimRef: row['LearnAimRef'] ?? '',
		aimType: parseInt(row['AimType'] ?? '0', 10),
		aimSeqNumber: parseInt(row['AimSeqNumber'] ?? '1', 10),
		learnStartDate: row['LearnStartDate'] ?? '',
		learnPlanEndDate: row['LearnPlanEndDate'] ?? '',
		fundModel: parseInt(row['FundModel'] ?? '0', 10),
		progType: row['ProgType'] ? parseInt(row['ProgType'], 10) : undefined,
		stdCode: row['StdCode'] ? parseInt(row['StdCode'], 10) : undefined,
		delLocPostCode: row['DelLocPostCode'] ?? '',
		compStatus: parseInt(row['CompStatus'] ?? '0', 10),
		learnActEndDate: row['LearnActEndDate'],
		outcome: row['Outcome'] ? parseInt(row['Outcome'], 10) : undefined,
	};
}
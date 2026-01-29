/** |===================|| Convert Workflow ||==================|
 *  | Orchestrates CSV → XML conversion with validation. Yields
 *  | step events for UI consumption.
 *  |===========================================================|
 */
import { parseCSV, type CSVData } from '../utils/csv/csvParser';
import { validateRows, type ValidationResult } from '../utils/csv/csvValidator';
import { generateFromSchema } from '../utils/xml/xmlGenerator';
import { getConfig } from '../types/configTypes';
import { mapCsvToSchema } from '../schema/columnMapper';
import { facAirtableMapping } from '../mappings/fac-airtable-2025';
import type {
	ConvertInput,
	ConvertOutput,
	WorkflowStep,
	WorkflowStepEvent,
	WorkflowResult,
} from '../types/workflowTypes';
import { homedir } from 'os';
import { join } from 'path';
import type { SchemaRegistry } from '$lib/schema';

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
		const message = buildILRMessage(csvData, input.registry);
		const result = generateFromSchema(message, input.registry);
		xml = result.xml;

		generateStep.status = 'complete';
		generateStep.progress = 100;
		generateStep.message =
			result.warnings.length > 0
				? `Generated with ${result.warnings.length} warning(s)`
				: 'XML generated';
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

// === Helpers ===
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
): WorkflowResult<ConvertOutput> {
	return {
		success: false,
		error,
		steps,
		duration: Date.now() - startTime,
	};
}

// === CSV --> ILR Message Mapping ===
function buildILRMessage(csvData: CSVData, registry: SchemaRegistry): Record<string, unknown> {
	const now = new Date();
	const config = getConfig();

	// Build header and provider sections (not from CSV)
	const baseStructure: Record<string, unknown> = {
		Header: {
			CollectionDetails: {
				Collection: 'ILR',
				Year: '2526',
				FilePreparationDate: now.toISOString().split('T')[0],
			},
			Source: {
				ProtectiveMarking: 'OFFICIAL-SENSITIVE-Personal',
				UKPRN: config.provider.ukprn,
				SoftwareSupplier: config.submission.softwareSupplier ?? 'Founders and Coders',
				SoftwarePackage: config.submission.softwarePackage ?? 'Iris',
				Release: config.submission.release ?? 'Unspecified Release',
				SerialNo: '01',
				DateTime: now.toISOString(),
			},
		},
		LearningProvider: {
			UKPRN: config.provider.ukprn,
		},
		Learner: [],
	};

	// Map each CSV row to a Learner using column mapper
	const learners: Record<string, unknown>[] = [];

	for (const row of csvData.rows) {
		const mappedData = mapCsvToSchema(row, facAirtableMapping.mappings, registry);

		// Extract the Learner data from Message.Learner path
		if (mappedData.Message && typeof mappedData.Message === 'object') {
			const messageData = mappedData.Message as Record<string, unknown>;
			if (messageData.Learner && typeof messageData.Learner === 'object') {
				learners.push(messageData.Learner as Record<string, unknown>);
			}
		}
	}

	baseStructure.Learner = learners;

	return baseStructure;
}

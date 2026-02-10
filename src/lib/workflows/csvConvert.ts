/** |===================|| Convert Workflow ||==================|
 *  | Orchestrates CSV → XML conversion with validation. Yields
 *  | step events for UI consumption.
 *  |===========================================================|
 */
import { parseCSV, type CSVData } from '../utils/csv/csvParser';
import { validateRows, type ValidationResult } from '../utils/csv/csvValidator';
import { generateFromSchema } from '../utils/xml/xmlGenerator';
import { getConfig } from '../types/configTypes';
import { mapCsvToSchemaWithAims } from '../schema/columnMapper';
import { deriveCollectionYear } from '../utils/config/namespace';
import { createStep, stepEvent, failedResult } from './utils';
import type {
	ConvertInput,
	ConvertOutput,
	WorkflowStep,
	WorkflowStepEvent,
	WorkflowResult,
} from '../types/workflowTypes';
import type { HistoryEntry } from '../types/storageTypes';
import { createStorage } from '../storage';
import type { SchemaRegistry } from '../schema';
import type { MappingConfig } from '../types/schemaTypes';
import packageJson from '../../../package.json';

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

	// Load config once for reuse (needed for buildILRMessage and save metadata)
	const config = await getConfig();

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
		validation = validateRows(csvData.rows, csvData.headers, input.registry, input.mapping);
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

	// Hard block: abort if validation found errors
	if (validation.errorCount > 0) {
		// Mark generate and save steps as skipped
		const generateStep = createStep(STEPS.generate);
		generateStep.status = 'skipped';
		steps.push(generateStep);
		yield stepEvent('step:complete', generateStep);

		const saveStep = createStep(STEPS.save);
		saveStep.status = 'skipped';
		steps.push(saveStep);
		yield stepEvent('step:complete', saveStep);

		return {
			success: true,
			data: {
				xml: '',
				outputPath: '',
				csvData,
				validation,
				blocked: true,
			},
			steps,
			duration: Date.now() - startTime,
		};
	}

	// --- Step 3: Generate XML ---
	let xml: string;
	let message: Record<string, unknown>; // Hoist for later use in save step (history)
	const generateStep = createStep(STEPS.generate);
	steps.push(generateStep);

	yield stepEvent('step:start', generateStep);

	try {
		message = await buildILRMessage(csvData, input.registry, input.mapping, config);
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
		const storage = createStorage({
			outputDir: input.outputDir,
			internalRoot: input.internalRoot,
		});
		await storage.init(); // Ensures directories exist

		const collectionYear = deriveCollectionYear(input.registry.namespace);
		const saveResult = await storage.saveSubmission(xml, {
			timestamp: new Date().toISOString(),
			learnerCount: csvData.rows.length,
			schema: input.registry.namespace,
			ukprn: config.provider.ukprn,
			collectionYear,
			serialNo: config.serialNo ?? '01',
			collection: config.collection ?? 'ILR',
		});

		if (!saveResult.success) {
			throw new Error(`Failed to save submission: ${saveResult.error.message}`);
		}

		outputPath = saveResult.data;
		const filename = outputPath.split('/').pop() ?? 'unknown';

		// Append to submission history (non-fatal — log warning if fails)
		const checksum = new Bun.CryptoHasher('sha256').update(xml).digest('hex');
		const learnerRefs = (message.Learner as Record<string, unknown>[])
			.map(l => String(l.LearnRefNumber ?? ''))
			.filter(ref => ref.length > 0);

		const historyEntry: HistoryEntry = {
			filename,
			filePath: outputPath, // Store full path for reliable file access
			timestamp: new Date().toISOString(),
			learnerCount: csvData.rows.length,
			checksum,
			schema: collectionYear, // Store 4-char year for consistency with cross-check display
			learnerRefs,
		};

		const historyResult = await storage.appendHistory(historyEntry);
		if (!historyResult.success) {
			saveStep.message = `Saved to ${filename}, but history update failed: ${historyResult.error.message}`;
		} else {
			saveStep.message = `Saved to ${filename}`;
		}

		saveStep.status = 'complete';
		saveStep.progress = 100;
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


// === CSV --> ILR Message Mapping ===
async function buildILRMessage(
	csvData: CSVData,
	registry: SchemaRegistry,
	mapping: MappingConfig,
	config: Awaited<ReturnType<typeof getConfig>>
): Promise<Record<string, unknown>> {
	const now = new Date();

	// Build header and provider sections (not from CSV)
	const baseStructure: Record<string, unknown> = {
		Header: {
			CollectionDetails: {
				Collection: config.collection ?? 'ILR',
				Year: deriveCollectionYear(registry.namespace),
				FilePreparationDate: now.toISOString().split('T')[0],
			},
			Source: {
				ProtectiveMarking: 'OFFICIAL-SENSITIVE-Personal',
				UKPRN: config.provider.ukprn,
				SoftwareSupplier: config.submission.softwareSupplier ?? 'Founders and Coders',
				SoftwarePackage: config.submission.softwarePackage ?? 'Iris',
				Release: packageJson.version,
				SerialNo: config.serialNo ?? '01',
				DateTime: now.toISOString().slice(0, 19), // Format: YYYY-MM-DDTHH:MM:SS (no milliseconds/timezone)
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
		const mappedData = mapCsvToSchemaWithAims(row, mapping, registry);

		// Extract the Learner data from Message.Learner path
		// Note: mapCsvToSchemaWithAims returns Learner as an array since it's a repeatable element
		if (mappedData.Message && typeof mappedData.Message === 'object') {
			const messageData = mappedData.Message as Record<string, unknown>;
			if (Array.isArray(messageData.Learner) && messageData.Learner.length > 0) {
				// Extract the first (and only) learner from the array
				learners.push(messageData.Learner[0] as Record<string, unknown>);
			}
		}
	}

	baseStructure.Learner = learners;

	return baseStructure;
}

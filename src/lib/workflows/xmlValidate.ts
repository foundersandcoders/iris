/** |===================|| XML Validation Workflow ||==================|
 *  | Validates ILR XML files against the schema. Yields step events
 *  | for UI consumption.
 *  |==================================================================|
 */

import { readFileSync } from 'fs';

import { createStep, stepEvent, failedResult } from './utils';
import { parseILR, type ParseResult } from '../utils/xml/xmlParser';
import type { ILRMessage } from '../utils/xml/xmlGenerator';
import type { SchemaRegistry } from '../schema/schemaInterpreter';
import { validateValue } from '../schema/schemaValidator';

import type { SchemaValidationIssue } from '../types/schemaValidation';
import type {
	ValidateInput,
	ValidateOutput,
	WorkflowStep,
	WorkflowStepEvent,
	WorkflowResult,
} from '../types/workflow';

// |==================================================================|

const STEPS = {
	load: { id: 'load', name: 'Load File' },
	parse: { id: 'parse', name: 'Parse XML' },
	validate: { id: 'validate', name: 'Validate Against Schema' },
} as const;

export async function* xmlValidateWorkflow(
	input: ValidateInput
): AsyncGenerator<WorkflowStepEvent, WorkflowResult<ValidateOutput>, void> {
	const startTime = Date.now();
	const steps: WorkflowStep[] = [];

	// --- Step 1: Load File ---
	let xmlContent: string;
	const loadStep = createStep(STEPS.load);

	steps.push(loadStep);
	yield stepEvent('step:start', loadStep);

	try {
		if (!input.filePath.toLowerCase().endsWith('.xml')) {
			throw new Error(
				'Only XML files are supported. For CSV validation, use csvValidate workflow.'
			);
		}

		xmlContent = readFileSync(input.filePath, 'utf-8');
		const size = Buffer.byteLength(xmlContent, 'utf-8');

		loadStep.status = 'complete';
		loadStep.progress = 100;
		loadStep.message = `Loaded ${(size / 1024).toFixed(1)} KB`;

		yield stepEvent('step:complete', loadStep);
	} catch (error) {
		loadStep.status = 'failed';
		loadStep.error = error instanceof Error ? error : new Error(String(error));

		yield stepEvent('step:error', loadStep);

		return failedResult<ValidateOutput>(steps, loadStep.error, startTime);
	}

	// --- Step 2: Parse XML ---
	let message: ILRMessage;
	const parseStep = createStep(STEPS.parse);

	steps.push(parseStep);
	yield stepEvent('step:start', parseStep);

	try {
		const parseResult = parseILR(xmlContent);

		if (!parseResult.success) throw new Error(parseResult.error.message);

		message = parseResult.data;

		parseStep.status = 'complete';
		parseStep.progress = 100;
		parseStep.message = `Parsed ${message.learners.length} learners`;

		yield stepEvent('step:complete', parseStep);
	} catch (error) {
		parseStep.status = 'failed';
		parseStep.error = error instanceof Error ? error : new Error(String(error));

		yield stepEvent('step:error', parseStep);

		return failedResult<ValidateOutput>(steps, parseStep.error, startTime);
	}

	// --- Step 3: Validate Against Schema ---
	const validateStep = createStep(STEPS.validate);

	steps.push(validateStep);
	yield stepEvent('step:start', validateStep);

	try {
		const issues = validateMessage(message, input.registry);
		const errorCount = issues.filter((i) => i.severity === 'error').length;
		const warningCount = issues.filter((i) => i.severity === 'warning').length;

		const validation = {
			valid: errorCount === 0,
			issues,
			errorCount,
			warningCount,
		};

		validateStep.status = 'complete';
		validateStep.progress = 100;
		validateStep.data = validation;
		validateStep.message = validation.valid
			? 'No errors found'
			: `Found ${errorCount} errors, ${warningCount} warnings`;

		yield stepEvent('step:complete', validateStep);

		return {
			success: true,
			data: { validation, sourceData: xmlContent },
			steps,
			duration: Date.now() - startTime,
		};
	} catch (error) {
		validateStep.status = 'failed';
		validateStep.error = error instanceof Error ? error : new Error(String(error));

		yield stepEvent('step:error', validateStep);

		return failedResult<ValidateOutput>(steps, validateStep.error, startTime);
	}
}

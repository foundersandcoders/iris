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

	// LA LA LA DO SOME BORING SHIT TO AN XML FILE LA LA LA
}

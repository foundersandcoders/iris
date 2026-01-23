/** |===================|| XML Validation Workflow ||==================|
 *  | Validates ILR XML files against the schema. Yields step events
 *  | for UI consumption.
 *  |==================================================================|
 */

import { readFileSync } from 'fs';
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

const STEPS = {
	load: { id: 'load', name: 'Load File' },
	parse: { id: 'parse', name: 'Parse XML' },
	validate: { id: 'validate', name: 'Validate Against Schema' },
} as const;

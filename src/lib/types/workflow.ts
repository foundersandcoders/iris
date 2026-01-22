/** |===================|| Workflow Abstraction Layer ||===================|
 *  | Defines interface-agnostic workflow types that can be consumed by
 *  | TUI, CLI commands, and Desktop GUI.
 *  |======================================================================|
 */
import type { CSVData, CSVRow } from '../parser';
import type { ValidationResult } from '../validator';
import type { SchemaRegistry } from '../schema/interpreter';

export type WorkflowStatus = 'pending' | 'running' | 'complete' | 'failed' | 'skipped';

export interface WorkflowStep<T = unknown> {
	id: string;
	name: string;
	status: WorkflowStatus;
	progress: number; // 0-100
	data?: T; // populated on completion
	error?: Error;
	message?: string;
}

export interface WorkflowResult<T = unknown> {
	success: boolean;
	data?: T;
	error?: Error;
	steps: WorkflowStep[];
	duration: number; // milliseconds
}

// |------------|| Convert Workflow ||------------|
export interface ConvertInput {
	filePath: string;
	outputDir?: string;
	registry: SchemaRegistry;
}

export interface ValidateInput {
	filePath: string;
	registry: SchemaRegistry;
}

// |------------|| Validate Workflow ||------------|
// TODO: Reconcile `interface ValidateInput` with `src/lib/schema/validationTypes`
export interface ValidateInput {
	filePath: string;
}

// TODO: Reconcile `interface ValidateOutput` with `src/lib/schema/validationTypes`
export interface ValidateOutput {
	validation: ValidationResult;
	sourceData: CSVData | string;
}

// <<--------------------------------------------------------------------->>

export type WorkflowStepEvent<T = unknown> = {
	type: 'step:start' | 'step:progress' | 'step:complete' | 'step:error';
	step: WorkflowStep<T>;
	timestamp: number;
};

// <<--------------------------------------------------------------------->>

export type WorkflowGenerator<TInput, TOutput> = (
	input: TInput
) => AsyncGenerator<WorkflowStepEvent, WorkflowResult<TOutput>, void>;

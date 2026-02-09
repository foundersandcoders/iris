/** |===================|| Workflow Abstraction Layer ||===================|
 *  | Defines interface-agnostic workflow types that can be consumed by
 *  | TUI, CLI commands, and Desktop GUI.
 *  |======================================================================|
 */
import type { CSVData, CSVRow } from '../utils/csv/csvParser';
import type { ValidationResult } from '../utils/csv/csvValidator';
import type { SchemaRegistry } from './interpreterTypes';
import type { MappingConfig } from './schemaTypes';

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

// |------------|| CONVERSION ||------------|
export interface ConvertInput {
	filePath: string;
	outputDir?: string;
	registry: SchemaRegistry;
	mapping: MappingConfig;
}

export interface ConvertOutput {
	xml: string;
	outputPath: string;
	csvData: CSVData;
	validation: ValidationResult;
	blocked?: boolean; // True when validation errors blocked further steps
}

// |------------|| VALIDATION ||------------|
export interface ValidateInput {
	filePath: string;
	registry: SchemaRegistry;
	mapping: MappingConfig;
}

// TODO: Reconcile `interface ValidateOutput` with `src/lib/schema/validationTypes`
export interface ValidateOutput {
	validation: ValidationResult;
	sourceData: CSVData | string;
}

// |------------|| CROSS-SUBMISSION CHECK ||------------|
export interface CheckInput {
	filePath: string;
	internalRoot?: string; // Override ~/.iris for testing
}

export type CheckSeverity = 'info' | 'warning' | 'error';

export interface CheckIssue {
	severity: CheckSeverity;
	category: 'learner_count' | 'schema_version' | 'data_anomaly' | 'duplicate_learners';
	message: string;
	details?: Record<string, unknown>;
}

export interface CheckReport {
	currentSubmission: {
		filename: string;
		learnerCount: number;
		schema: string;
		learnerRefs: string[];
	};
	previousSubmission?: {
		filename: string;
		learnerCount: number;
		schema: string;
		timestamp: string;
	};
	issues: CheckIssue[];
	summary: {
		totalIssues: number;
		errorCount: number;
		warningCount: number;
		infoCount: number;
	};
}

export interface CheckOutput {
	report: CheckReport;
	hasIssues: boolean;
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

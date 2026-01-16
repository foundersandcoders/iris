/** Workflow Abstraction Layer
  *
  * Defines interface-agnostic workflow types that can be consumed
  * by TUI, CLI commands, and Desktop GUI.
  */
import type { CSVData, CSVRow } from '../parser';
import type { ValidationResult } from '../validator';

/** WorkflowStatus
 * 
 * lifecycle states
 */
export type WorkflowStatus = "pending" | "running" | "complete" | "failed" | "skipped";

/** WorkflowStep<T>
 * 
 * individual step with typed output
 */
export interface WorkflowStep<T = unknown> {
  id: string;
  name: string;
  status: WorkflowStatus;
  progress: number; // 0-100
  data?: T; // populated on completion
  error?: Error;
  message?: string;
}

/** WorkflowResult<T>
 * 
 * final workflow result
 */
export interface WorkflowResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error;
  steps: WorkflowStep[];
  duration: number; // milliseconds
}

// ====== Convert Workflow ======
export interface ConvertInput {
  filePath: string;
  outputDir?: string; // defaults to ~/.iris/submissions/
}

export interface ConvertOutput {
  xml: string;
  outputPath: string;
  csvData: CSVData;
  validation: ValidationResult;
}

// ====== Validate Workflow ======
export interface ValidateInput {
  filePath: string;
}

export interface ValidateOutput {
  validation: ValidationResult;
  sourceData: CSVData | string;
}

// ===============================

/** WorkflowStepEvent
 * 
 * events yielded by generator
 */
export type WorkflowStepEvent<T = unknown> = {
  type: 'step:start' | 'step:progress' | 'step:complete' | 'step:error';
  step: WorkflowStep<T>;
  timestamp: number;
};

// ===============================

/** WorkflowGenerator
 * 
 * the generator function signature
 */
export type WorkflowGenerator<
  TInput,
  TOutput
> = (
  input: TInput
) => AsyncGenerator<
  WorkflowStepEvent,
  WorkflowResult<TOutput>,
  void
>;
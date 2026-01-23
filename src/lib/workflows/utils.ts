/** |===================|| Workflow Utilities ||==================|
 *  | Shared helper functions for workflow generators.
 *  |=============================================================|
 */

import type { WorkflowStep, WorkflowStepEvent, WorkflowResult } from '../types/workflow';

export function createStep(def: { id: string; name: string }): WorkflowStep {
	return {
		id: def.id,
		name: def.name,
		status: 'pending',
		progress: 0,
	};
}

export function stepEvent<T>(
	type: WorkflowStepEvent['type'],
	step: WorkflowStep<T>
): WorkflowStepEvent<T> {
	return { type, step, timestamp: Date.now() };
}

export function failedResult<T>(
	steps: WorkflowStep[],
	error: Error,
	startTime: number
): WorkflowResult<T> {
	return {
		success: false,
		error,
		steps,
		duration: Date.now() - startTime,
	};
}

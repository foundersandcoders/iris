/** |===================|| Workflow Utilities ||==================|
 *  | Shared helper functions for workflow generators.
 *  |=============================================================|
 */

import type { WorkflowStep, WorkflowStepEvent, WorkflowResult } from '../types/workflowTypes';

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
	return { type, step: { ...step }, timestamp: Date.now() };
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

/**
 * Consumes a workflow generator, collecting all step events and returning
 * the final result along with event history.
 *
 * @param generator - Workflow generator to consume
 * @returns Object containing collected events and final result
 *
 * @example
 * ```typescript
 * const workflow = convertWorkflow(input);
 * const { events, result } = await consumeWorkflow(workflow);
 *
 * if (result.success) {
 *   console.log('Workflow completed successfully');
 * }
 * ```
 */
export async function consumeWorkflow<TOutput>(
	generator: AsyncGenerator<WorkflowStepEvent, WorkflowResult<TOutput>, void>
): Promise<{ events: WorkflowStepEvent[]; result: WorkflowResult<TOutput> }> {
	const events: WorkflowStepEvent[] = [];

	while (true) {
		const next = await generator.next();

		if (next.done) {
			return { events, result: next.value };
		}

		events.push(next.value);
	}
}

/**
 * Consumes a workflow generator and returns only the final result,
 * discarding intermediate step events.
 *
 * @param generator - Workflow generator to consume
 * @returns Final workflow result
 *
 * @example
 * ```typescript
 * const workflow = validateWorkflow(input);
 * const result = await skimWorkflow(workflow);
 *
 * if (!result.success) {
 *   console.error(result.error);
 * }
 * ```
 */
export async function skimWorkflow<TOutput>(
	generator: AsyncGenerator<WorkflowStepEvent, WorkflowResult<TOutput>, void>
): Promise<WorkflowResult<TOutput>> {
	const { result } = await consumeWorkflow(generator);
	return result;
}

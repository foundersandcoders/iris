import { describe, it, expect } from 'vitest';
import {
	createStep,
	stepEvent,
	failedResult,
	consumeWorkflow,
	skimWorkflow,
} from '../../../src/lib/workflows/utils';
import type {
	WorkflowStepEvent,
	WorkflowResult,
	WorkflowStep,
} from '../../../src/lib/types/workflowTypes';

describe('workflow utils', () => {
	describe('createStep', () => {
		it('creates a step with pending status and zero progress', () => {
			const step = createStep({ id: 'test', name: 'Test Step' });

			expect(step.id).toBe('test');
			expect(step.name).toBe('Test Step');
			expect(step.status).toBe('pending');
			expect(step.progress).toBe(0);
		});
	});

	describe('stepEvent', () => {
		it('wraps step in event with timestamp', () => {
			const step = createStep({ id: 'test', name: 'Test' });
			const before = Date.now();
			const event = stepEvent('step:start', step);
			const after = Date.now();

			expect(event.type).toBe('step:start');
			expect(event.step).toBe(step);
			expect(event.timestamp).toBeGreaterThanOrEqual(before);
			expect(event.timestamp).toBeLessThanOrEqual(after);
		});
	});

	describe('failedResult', () => {
		it('returns failure result with duration', () => {
			const steps = [createStep({ id: 'test', name: 'Test' })];
			const error = new Error('Test error');
			const startTime = Date.now() - 100;

			const result = failedResult(steps, error, startTime);

			expect(result.success).toBe(false);
			expect(result.error).toBe(error);
			expect(result.steps).toBe(steps);
			expect(result.duration).toBeGreaterThanOrEqual(100);
		});
	});

	describe('consumeWorkflow', () => {
		// Mock workflow generator for testing
		async function* mockSuccessWorkflow(): AsyncGenerator<
			WorkflowStepEvent,
			WorkflowResult<string>,
			void
		> {
			const step1: WorkflowStep = {
				id: 'step1',
				name: 'First Step',
				status: 'running',
				progress: 0,
			};

			yield { type: 'step:start', step: step1, timestamp: Date.now() };

			step1.status = 'complete';
			step1.progress = 100;

			yield { type: 'step:complete', step: step1, timestamp: Date.now() };

			const step2: WorkflowStep = {
				id: 'step2',
				name: 'Second Step',
				status: 'running',
				progress: 0,
			};

			yield { type: 'step:start', step: step2, timestamp: Date.now() };

			step2.status = 'complete';
			step2.progress = 100;

			yield { type: 'step:complete', step: step2, timestamp: Date.now() };

			return {
				success: true,
				data: 'test output',
				steps: [step1, step2],
				duration: 100,
			};
		}

		async function* mockFailureWorkflow(): AsyncGenerator<
			WorkflowStepEvent,
			WorkflowResult<string>,
			void
		> {
			const step: WorkflowStep = {
				id: 'failing-step',
				name: 'Failing Step',
				status: 'running',
				progress: 0,
			};

			yield { type: 'step:start', step, timestamp: Date.now() };

			step.status = 'failed';
			step.error = new Error('Something went wrong');

			yield { type: 'step:error', step, timestamp: Date.now() };

			return {
				success: false,
				error: new Error('Workflow failed'),
				steps: [step],
				duration: 50,
			};
		}

		it('collects all step events and returns final result', async () => {
			const { events, result } = await consumeWorkflow(mockSuccessWorkflow());

			expect(events).toHaveLength(4);
			expect(events[0].type).toBe('step:start');
			expect(events[1].type).toBe('step:complete');
			expect(events[2].type).toBe('step:start');
			expect(events[3].type).toBe('step:complete');

			expect(result.success).toBe(true);
			expect(result.data).toBe('test output');
			expect(result.steps).toHaveLength(2);
		});

		it('handles workflow failures correctly', async () => {
			const { events, result } = await consumeWorkflow(mockFailureWorkflow());

			expect(events).toHaveLength(2);
			expect(events[0].type).toBe('step:start');
			expect(events[1].type).toBe('step:error');

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error?.message).toBe('Workflow failed');
		});

		it('preserves event timestamps', async () => {
			const { events } = await consumeWorkflow(mockSuccessWorkflow());

			for (const event of events) {
				expect(event.timestamp).toBeGreaterThan(0);
				expect(typeof event.timestamp).toBe('number');
			}
		});

		it('preserves step data in events', async () => {
			const { events } = await consumeWorkflow(mockSuccessWorkflow());

			expect(events[0].step.id).toBe('step1');
			expect(events[0].step.name).toBe('First Step');
			expect(events[2].step.id).toBe('step2');
			expect(events[2].step.name).toBe('Second Step');
		});
	});

	describe('skimWorkflow', () => {
		async function* mockWorkflow(): AsyncGenerator<
			WorkflowStepEvent,
			WorkflowResult<string>,
			void
		> {
			const step: WorkflowStep = {
				id: 'step1',
				name: 'Test Step',
				status: 'running',
				progress: 0,
			};

			yield { type: 'step:start', step, timestamp: Date.now() };
			step.status = 'complete';
			step.progress = 100;
			yield { type: 'step:complete', step, timestamp: Date.now() };

			return {
				success: true,
				data: 'test output',
				steps: [step],
				duration: 100,
			};
		}

		it('returns only the final result without events', async () => {
			const result = await skimWorkflow(mockWorkflow());

			expect(result.success).toBe(true);
			expect(result.data).toBe('test output');
			expect(result.steps).toHaveLength(1);
			expect(result.duration).toBe(100);
		});

		it('handles workflow failures', async () => {
			async function* failingWorkflow(): AsyncGenerator<
				WorkflowStepEvent,
				WorkflowResult<string>,
				void
			> {
				const step: WorkflowStep = {
					id: 'fail',
					name: 'Failing',
					status: 'running',
					progress: 0,
				};

				yield { type: 'step:start', step, timestamp: Date.now() };

				return {
					success: false,
					error: new Error('Workflow failed'),
					steps: [step],
					duration: 50,
				};
			}

			const result = await skimWorkflow(failingWorkflow());

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error?.message).toBe('Workflow failed');
		});
	});
});

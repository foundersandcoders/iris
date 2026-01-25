import { describe, it, expect } from 'vitest';
import { createStep, stepEvent, failedResult } from '../../../src/lib/workflows/utils';

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
});

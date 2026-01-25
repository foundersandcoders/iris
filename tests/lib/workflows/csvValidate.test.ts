import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { validateWorkflow } from '../../../src/lib/workflows/csvValidate';
import { buildSchemaRegistry } from '../../../src/lib/schema/registryBuilder';
import type { SchemaRegistry } from '../../../src/lib/schema/schemaInterpreter';
import type {
	WorkflowResult,
	WorkflowStepEvent,
	ValidateOutput,
} from '../../../src/lib/types/workflow';
import * as fixtures from '../../fixtures/lib/workflows/workflow';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdir, rm, writeFile } from 'fs/promises';
import { readFileSync } from 'fs';

let registry: SchemaRegistry;

beforeAll(() => {
	const xsdPath = join(process.cwd(), 'docs/schemas/schemafile25.xsd');
	const xsdContent = readFileSync(xsdPath, 'utf-8');
	registry = buildSchemaRegistry(xsdContent);
});

async function runWorkflow(
	input: Parameters<typeof validateWorkflow>[0]
): Promise<{ events: WorkflowStepEvent[]; result: WorkflowResult<ValidateOutput> }> {
	const gen = validateWorkflow(input);
	const events: WorkflowStepEvent[] = [];

	while (true) {
		const next = await gen.next();

		if (next.done) return { events, result: next.value };

		events.push(next.value);
	}
}

describe('validateWorkflow (CSV)', () => {
	let testDir: string;
	let testCsvPath: string;

	beforeEach(async () => {
		testDir = join(tmpdir(), `iris-test-${Date.now()}`);
		await mkdir(testDir, { recursive: true });

		testCsvPath = join(testDir, 'test.csv');
	});

	afterEach(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	describe('successful validation', () => {
		it('yields step events in correct order', async () => {
			await writeFile(testCsvPath, fixtures.validCsvContent);

			const { events } = await runWorkflow({ filePath: testCsvPath, registry });
			const eventKeys = events.map((e) => `${e.type}:${e.step.id}`);

			expect(eventKeys).toEqual([
				'step:start:load',
				'step:complete:load',
				'step:start:parse',
				'step:complete:parse',
				'step:start:validate',
				'step:complete:validate',
				'step:start:report',
				'step:complete:report',
			]);
		});

		it('returns successful result with validation data', async () => {
			await writeFile(testCsvPath, fixtures.validCsvContent);

			const { result } = await runWorkflow({ filePath: testCsvPath, registry });

			expect(result.success).toBe(true);
			expect(result.data?.validation.valid).toBe(true);
			expect(result.data?.validation.errorCount).toBe(0);
			expect(result.data?.validation.warningCount).toBe(0);
			expect(result.data?.sourceData).toBeDefined();
			expect(result.duration).toBeGreaterThanOrEqual(0);
		});

		it('includes parsed CSV data in result', async () => {
			await writeFile(testCsvPath, fixtures.validCsvContent);

			const { result } = await runWorkflow({ filePath: testCsvPath, registry });

			expect(result.data?.sourceData).toHaveProperty('headers');
			expect(result.data?.sourceData).toHaveProperty('rows');
			expect((result.data?.sourceData as any).rows).toHaveLength(1);
		});
	});

	describe('validation with errors', () => {
		it('reports validation errors but completes successfully', async () => {
			await writeFile(testCsvPath, fixtures.invalidCsvContent);

			const { result } = await runWorkflow({ filePath: testCsvPath, registry });

			expect(result.success).toBe(true);
			expect(result.data?.validation.valid).toBe(false);
			expect(result.data?.validation.errorCount).toBeGreaterThan(0);
		});

		it('includes validation issues in result', async () => {
			await writeFile(testCsvPath, fixtures.invalidCsvContent);

			const { result } = await runWorkflow({ filePath: testCsvPath, registry });

			expect(result.data?.validation.issues).toBeDefined();
			expect(result.data?.validation.issues.length).toBeGreaterThan(0);
			expect(result.data?.validation.issues[0]).toHaveProperty('severity');
			expect(result.data?.validation.issues[0]).toHaveProperty('message');
			expect(result.data?.validation.issues[0]).toHaveProperty('code');
		});
	});

	describe('error handling', () => {
		it('fails gracefully when file does not exist', async () => {
			const nonExistentPath = join(testDir, 'nonexistent.csv');

			const { result, events } = await runWorkflow({ filePath: nonExistentPath, registry });

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error?.message).toContain('not found');

			const errorEvents = events.filter((e) => e.type === 'step:error');

			expect(errorEvents).toHaveLength(1);
			expect(errorEvents[0].step.id).toBe('load');
		});

		it('rejects XML files with clear error message', async () => {
			const xmlPath = join(testDir, 'test.xml');
			await writeFile(xmlPath, '<?xml version="1.0"?><root></root>');

			const { result } = await runWorkflow({ filePath: xmlPath, registry });

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error?.message).toContain('Only CSV files are supported');
			expect(result.error?.message).toContain('validate-xml workflow');
		});

		it('handles malformed CSV gracefully', async () => {
			const malformedCsv = 'LearnRefNumber,ULN\n"Unclosed quote,1234567890';
			await writeFile(testCsvPath, malformedCsv);

			const { result } = await runWorkflow({ filePath: testCsvPath, registry });

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();

			const failedStep = result.steps.find((s) => s.status === 'failed');
			expect(failedStep?.id).toBe('parse');
		});
	});

	describe('step progression', () => {
		it('marks steps as complete in sequence', async () => {
			await writeFile(testCsvPath, fixtures.validCsvContent);

			const { events } = await runWorkflow({ filePath: testCsvPath, registry });

			const completeEvents = events.filter((e) => e.type === 'step:complete');
			expect(completeEvents).toHaveLength(4);
			expect(completeEvents.map((e) => e.step.id)).toEqual(['load', 'parse', 'validate', 'report']);
		});

		it('includes progress and messages in completed steps', async () => {
			await writeFile(testCsvPath, fixtures.validCsvContent);

			const { events } = await runWorkflow({ filePath: testCsvPath, registry });

			const completeEvents = events.filter((e) => e.type === 'step:complete');

			for (const event of completeEvents) {
				expect(event.step.progress).toBe(100);
				expect(event.step.status).toBe('complete');
				expect(event.step.message).toBeDefined();
			}
		});

		it('stops on first error and does not proceed', async () => {
			const nonExistentPath = join(testDir, 'nonexistent.csv');

			const { result } = await runWorkflow({ filePath: nonExistentPath, registry });

			expect(result.steps).toHaveLength(1);
			expect(result.steps[0].id).toBe('load');
			expect(result.steps[0].status).toBe('failed');
		});
	});
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkWorkflow } from '../../../src/lib/workflows/crossCheck';
import { consumeWorkflow } from '../../../src/lib/workflows/utils';
import * as fixtures from '../../fixtures/lib/workflows/crossCheck';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdir, rm, writeFile } from 'fs/promises';
import type { IrisStorage, SubmissionHistory } from '../../../src/lib/storage';

/**
 * Mock storage to return specific submission history for testing.
 * Uses dynamic import + spy to intercept createStorage calls within the workflow.
 *
 * Note: This works because checkWorkflow calls createStorage() internally.
 * More robust approaches (vi.mock with hoisting) would require restructuring
 * the workflow to accept storage as a dependency injection parameter.
 */
async function mockStorageHistory(history: SubmissionHistory): Promise<void> {
	const storageModule = await import('../../../src/lib/storage');
	const baseStorage = storageModule.createStorage();

	vi.spyOn(storageModule, 'createStorage').mockReturnValue({
		...baseStorage,
		loadHistory: vi.fn().mockResolvedValue({
			success: true,
			data: history,
		}),
	} as IrisStorage);
}

describe('checkWorkflow', () => {
	let testDir: string;
	let testXmlPath: string;
	let testInternalRoot: string;

	beforeEach(async () => {
		testDir = join(tmpdir(), `iris-check-test-${Date.now()}`);
		await mkdir(testDir, { recursive: true });
		testXmlPath = join(testDir, 'test.xml');
		testInternalRoot = join(testDir, '.iris-test');
		await mkdir(testInternalRoot, { recursive: true });
	});

	afterEach(async () => {
		await rm(testDir, { recursive: true, force: true });
		vi.restoreAllMocks();
	});

	describe('workflow steps', () => {
		it('yields step events in correct order', async () => {
			await writeFile(testXmlPath, fixtures.validXmlTwoLearners);

			const { events } = await consumeWorkflow(checkWorkflow({ filePath: testXmlPath, internalRoot: testInternalRoot }));

			const eventKeys = events.map((e) => `${e.type}:${e.step.id}`);

			expect(eventKeys).toEqual([
				'step:start:load',
				'step:complete:load',
				'step:start:parse',
				'step:complete:parse',
				'step:start:loadHistory',
				'step:complete:loadHistory',
				'step:start:check',
				'step:complete:check',
				'step:start:report',
				'step:complete:report',
			]);
		});

		it('includes correct step names', async () => {
			await writeFile(testXmlPath, fixtures.validXmlTwoLearners);

			const { events } = await consumeWorkflow(checkWorkflow({ filePath: testXmlPath, internalRoot: testInternalRoot }));

			const stepNames = events.filter((e) => e.type === 'step:start').map((e) => e.step.name);

			expect(stepNames).toEqual([
				'Load XML File',
				'Parse XML',
				'Load Submission History',
				'Run Cross-Submission Checks',
				'Generate Report',
			]);
		});
	});

	describe('successful check', () => {
		it('returns success with info about first submission when history is empty', async () => {
			await writeFile(testXmlPath, fixtures.validXmlTwoLearners);

			const { result } = await consumeWorkflow(checkWorkflow({ filePath: testXmlPath, internalRoot: testInternalRoot }));

			expect(result.success).toBe(true);
			expect(result.data?.hasIssues).toBe(true); // Has info about first submission
			expect(result.data?.report.issues).toHaveLength(1);
			expect(result.data?.report.issues[0].severity).toBe('info');
			expect(result.data?.report.issues[0].category).toBe('data_anomaly');
			expect(result.data?.report.issues[0].message).toBe(
				'This is the first submission in history'
			);
		});

		it('extracts learner count correctly', async () => {
			await writeFile(testXmlPath, fixtures.validXmlTwoLearners);

			const { result } = await consumeWorkflow(checkWorkflow({ filePath: testXmlPath, internalRoot: testInternalRoot }));

			expect(result.success).toBe(true);
			expect(result.data?.report.currentSubmission.learnerCount).toBe(2);
		});

		it('extracts schema version correctly', async () => {
			await writeFile(testXmlPath, fixtures.validXmlTwoLearners);

			const { result } = await consumeWorkflow(checkWorkflow({ filePath: testXmlPath, internalRoot: testInternalRoot }));

			expect(result.success).toBe(true);
			expect(result.data?.report.currentSubmission.schema).toBe('2526');
		});

		it('extracts learner references correctly', async () => {
			await writeFile(testXmlPath, fixtures.validXmlTwoLearners);

			const { result } = await consumeWorkflow(checkWorkflow({ filePath: testXmlPath, internalRoot: testInternalRoot }));

			expect(result.success).toBe(true);
			expect(result.data?.report.currentSubmission.learnerRefs).toEqual([
				'LEARN001',
				'LEARN002',
			]);
		});
	});

	describe('anomaly detection', () => {
		it('detects significant learner count increase', async () => {
			await writeFile(testXmlPath, fixtures.validXmlFiveLearners);
			await mockStorageHistory(fixtures.historyWithOnePrevious);

			const { result } = await consumeWorkflow(
				checkWorkflow({ filePath: testXmlPath, internalRoot: testInternalRoot })
			);

			expect(result.success).toBe(true);
			expect(result.data?.hasIssues).toBe(true);

			const countWarning = result.data?.report.issues.find(
				(i) => i.category === 'learner_count'
			);
			expect(countWarning).toBeDefined();
			expect(countWarning?.severity).toBe('warning');
			expect(countWarning?.message).toContain('150.0%'); // 5 vs 2 is 150% increase
		});

		it('detects schema version changes', async () => {
			await writeFile(testXmlPath, fixtures.validXmlDifferentSchema);
			await mockStorageHistory(fixtures.historyWithDifferentSchema);

			const { result } = await consumeWorkflow(
				checkWorkflow({ filePath: testXmlPath, internalRoot: testInternalRoot })
			);

			expect(result.success).toBe(true);

			const schemaInfo = result.data?.report.issues.find(
				(i) => i.category === 'schema_version'
			);
			expect(schemaInfo).toBeDefined();
			expect(schemaInfo?.severity).toBe('info');
			expect(schemaInfo?.message).toContain('2425');
			expect(schemaInfo?.message).toContain('2627');
		});

		it('handles zero learner count in previous submission', async () => {
			await writeFile(testXmlPath, fixtures.validXmlTwoLearners);
			await mockStorageHistory({
				formatVersion: 1,
				submissions: [
					{
						filename: 'ILR-2026-01-01.xml',
						timestamp: '2026-01-01T10:00:00',
						learnerCount: 0,
						checksum: 'abc123',
						schema: '2526',
						learnerRefs: [],
					},
				],
			});

			const { result } = await consumeWorkflow(
				checkWorkflow({ filePath: testXmlPath, internalRoot: testInternalRoot })
			);

			expect(result.success).toBe(true);

			const countInfo = result.data?.report.issues.find((i) => i.category === 'learner_count');
			expect(countInfo).toBeDefined();
			expect(countInfo?.severity).toBe('info');
			expect(countInfo?.message).toContain('increased from 0 to 2');
		});

		it('detects duplicate learner references', async () => {
			await writeFile(testXmlPath, fixtures.xmlWithDuplicateLearners);

			const { result } = await consumeWorkflow(checkWorkflow({ filePath: testXmlPath, internalRoot: testInternalRoot }));

			expect(result.success).toBe(true);

			const duplicateError = result.data?.report.issues.find(
				(i) => i.category === 'duplicate_learners'
			);
			expect(duplicateError).toBeDefined();
			expect(duplicateError?.severity).toBe('error');
			expect(duplicateError?.message).toContain('1 duplicate learner reference');
			expect(duplicateError?.details?.duplicates).toEqual(['DUPLICATE']);
		});
	});

	describe('report generation', () => {
		it('generates summary counts correctly', async () => {
			await writeFile(testXmlPath, fixtures.xmlWithDuplicateLearners);

			const { result } = await consumeWorkflow(checkWorkflow({ filePath: testXmlPath, internalRoot: testInternalRoot }));

			expect(result.success).toBe(true);
			expect(result.data?.report.summary.totalIssues).toBeGreaterThan(0);
			expect(result.data?.report.summary.errorCount).toBe(1); // Duplicate learners
			expect(result.data?.report.summary.infoCount).toBe(1); // First submission
		});

		it('includes previous submission details when available', async () => {
			await writeFile(testXmlPath, fixtures.validXmlTwoLearners);
			await mockStorageHistory(fixtures.historyWithOnePrevious);

			const { result } = await consumeWorkflow(
				checkWorkflow({ filePath: testXmlPath, internalRoot: testInternalRoot })
			);

			expect(result.success).toBe(true);
			expect(result.data?.report.previousSubmission).toBeDefined();
			expect(result.data?.report.previousSubmission?.filename).toBe(
				'ILR-2026-01-15T10-00-00.xml'
			);
			expect(result.data?.report.previousSubmission?.learnerCount).toBe(2);
		});

		it('omits previous submission when history is empty', async () => {
			await writeFile(testXmlPath, fixtures.validXmlTwoLearners);

			const { result } = await consumeWorkflow(checkWorkflow({ filePath: testXmlPath, internalRoot: testInternalRoot }));

			expect(result.success).toBe(true);
			expect(result.data?.report.previousSubmission).toBeUndefined();
		});
	});

	describe('error handling', () => {
		it('fails when file does not exist', async () => {
			const nonExistentPath = join(testDir, 'nonexistent.xml');

			const { result } = await consumeWorkflow(
				checkWorkflow({ filePath: nonExistentPath, internalRoot: testInternalRoot })
			);

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('File not found');
		});

		it('fails when file is not XML', async () => {
			const csvPath = join(testDir, 'test.csv');
			await writeFile(csvPath, 'some,csv,data');

			const { result } = await consumeWorkflow(
				checkWorkflow({ filePath: csvPath, internalRoot: testInternalRoot })
			);

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('Only XML files are supported');
		});

		it('fails when XML is malformed', async () => {
			await writeFile(testXmlPath, '<invalid>xml<without>closing</tags>');

			const { result } = await consumeWorkflow(checkWorkflow({ filePath: testXmlPath, internalRoot: testInternalRoot }));

			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('Failed to parse XML');
		});
	});

	describe('workflow result', () => {
		it('includes duration in milliseconds', async () => {
			await writeFile(testXmlPath, fixtures.validXmlTwoLearners);

			const { result } = await consumeWorkflow(checkWorkflow({ filePath: testXmlPath, internalRoot: testInternalRoot }));

			expect(result.duration).toBeGreaterThanOrEqual(0);
			expect(typeof result.duration).toBe('number');
		});

		it('includes all steps in result', async () => {
			await writeFile(testXmlPath, fixtures.validXmlTwoLearners);

			const { result } = await consumeWorkflow(checkWorkflow({ filePath: testXmlPath, internalRoot: testInternalRoot }));

			expect(result.steps).toHaveLength(5);
			expect(result.steps.map((s) => s.id)).toEqual([
				'load',
				'parse',
				'loadHistory',
				'check',
				'report',
			]);
		});
	});
});

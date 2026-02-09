/** |===================|| Cross-Submission Check Workflow ||==================|
 *  | Validates XML submissions against historical data to detect anomalies.
 *  | Checks for learner count variance, schema changes, duplicate learners.
 *  |===========================================================================|
 */

import { parseILR } from '../utils/xml/xmlParser';
import { createStorage } from '../storage';
import { createStep, stepEvent, failedResult } from './utils';
import type {
	CheckInput,
	CheckOutput,
	CheckReport,
	CheckIssue,
	WorkflowStep,
	WorkflowStepEvent,
	WorkflowResult,
} from '../types/workflowTypes';
import type { SubmissionHistory, HistoryEntry } from '../types/storageTypes';
import { basename, dirname, join } from 'path';

const STEPS = {
	load: { id: 'load', name: 'Load XML File' },
	parse: { id: 'parse', name: 'Parse XML' },
	loadHistory: { id: 'loadHistory', name: 'Load Submission History' },
	check: { id: 'check', name: 'Run Cross-Submission Checks' },
	report: { id: 'report', name: 'Generate Report' },
} as const;

// Thresholds for anomaly detection
const LEARNER_COUNT_VARIANCE_THRESHOLD = 0.3; // 30% change triggers warning

export async function* checkWorkflow(
	input: CheckInput
): AsyncGenerator<WorkflowStepEvent, WorkflowResult<CheckOutput>, void> {
	const startTime = Date.now();
	const steps: WorkflowStep[] = [];
	const storage = createStorage({ internalRoot: input.internalRoot });

	// --- Step 1: Load XML File ---
	const loadStep = createStep(STEPS.load);
	steps.push(loadStep);
	yield stepEvent('step:start', loadStep);

	let xmlContent: string;
	try {
		const file = Bun.file(input.filePath);
		if (!(await file.exists())) throw new Error(`File not found: ${input.filePath}`);

		if (!input.filePath.toLowerCase().endsWith('.xml'))
			throw new Error('Only XML files are supported for cross-submission checks');

		xmlContent = await file.text();
		loadStep.status = 'complete';
		loadStep.progress = 100;
		loadStep.message = `Loaded ${basename(input.filePath)}`;
		yield stepEvent('step:complete', loadStep);
	} catch (error) {
		loadStep.status = 'failed';
		loadStep.error = error instanceof Error ? error : new Error(String(error));
		yield stepEvent('step:error', loadStep);
		return failedResult(steps, loadStep.error, startTime);
	}

	// --- Step 2: Parse XML ---
	const parseStep = createStep(STEPS.parse);
	steps.push(parseStep);
	yield stepEvent('step:start', parseStep);

	let learnerCount: number;
	let learnerRefs: string[];
	let collectionYear: string;

	try {
		const parseResult = parseILR(xmlContent);
		if (!parseResult.success) {
			throw new Error(`Failed to parse XML: ${parseResult.error.message}`);
		}

		const { data } = parseResult;
		learnerCount = data.learners.length;
		learnerRefs = data.learners
			.map((l) => String(l.learnRefNumber))
			.filter(ref => ref && ref !== 'undefined' && ref.trim().length > 0);

		// Extract collection year from header (e.g., "2526" for 2025-26)
		collectionYear = data.header.collectionDetails.year || 'unknown';

		parseStep.status = 'complete';
		parseStep.progress = 100;
		parseStep.message = `Parsed ${learnerCount} learners`;
		parseStep.data = { learnerCount, collectionYear };
		yield stepEvent('step:complete', parseStep);
	} catch (error) {
		parseStep.status = 'failed';
		parseStep.error = error instanceof Error ? error : new Error(String(error));
		yield stepEvent('step:error', parseStep);
		return failedResult(steps, parseStep.error, startTime);
	}

	// --- Step 3: Load Submission History ---
	const loadHistoryStep = createStep(STEPS.loadHistory);
	steps.push(loadHistoryStep);
	yield stepEvent('step:start', loadHistoryStep);

	let history: SubmissionHistory;
	try {
		const historyResult = await storage.loadHistory();
		if (!historyResult.success) {
			throw historyResult.error;
		}

		history = historyResult.data;
		loadHistoryStep.status = 'complete';
		loadHistoryStep.progress = 100;
		loadHistoryStep.message = `Loaded ${history.submissions.length} previous submissions`;
		yield stepEvent('step:complete', loadHistoryStep);
	} catch (error) {
		loadHistoryStep.status = 'failed';
		loadHistoryStep.error = error instanceof Error ? error : new Error(String(error));
		yield stepEvent('step:error', loadHistoryStep);
		return failedResult(steps, loadHistoryStep.error, startTime);
	}

	// --- Step 4: Run Cross-Submission Checks ---
	const checkStep = createStep(STEPS.check);
	steps.push(checkStep);
	yield stepEvent('step:start', checkStep);

	const issues: CheckIssue[] = [];
	const currentFilename = basename(input.filePath);
	const currentDir = dirname(input.filePath);

	// Find the most recent submission that is NOT the current file AND exists on filesystem
	const candidates = history.submissions
		.filter(s => s.filename !== currentFilename)
		.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

	let previousSubmission: HistoryEntry | undefined;
	for (const candidate of candidates) {
		// Check if file exists in same directory as current file
		const candidatePath = join(currentDir, candidate.filename);
		const file = Bun.file(candidatePath);
		if (await file.exists()) {
			previousSubmission = candidate;
			break;
		}
	}

	try {
		// Check 1: Learner count variance
		if (previousSubmission && previousSubmission.learnerCount > 0) {
			const variance =
				Math.abs(learnerCount - previousSubmission.learnerCount) /
				previousSubmission.learnerCount;

			if (variance > LEARNER_COUNT_VARIANCE_THRESHOLD) {
				issues.push({
					severity: 'warning',
					category: 'learner_count',
					message: `Learner count changed by ${(variance * 100).toFixed(1)}%`,
					details: {
						current: learnerCount,
						previous: previousSubmission.learnerCount,
						variance: variance,
					},
				});
			}
		} else if (previousSubmission && previousSubmission.learnerCount === 0 && learnerCount > 0) {
			// Handle edge case: previous submission had 0 learners
			issues.push({
				severity: 'info',
				category: 'learner_count',
				message: `Learner count increased from 0 to ${learnerCount}`,
				details: {
					current: learnerCount,
					previous: 0,
				},
			});
		}

		// Check 2: Collection year changes (indicates schema migration)
		if (previousSubmission && collectionYear !== previousSubmission.schema) {
			issues.push({
				severity: 'info',
				category: 'schema_version',
				message: `Collection year changed from ${previousSubmission.schema} to ${collectionYear}`,
				details: {
					current: collectionYear,
					previous: previousSubmission.schema,
				},
			});
		}

		// Check 3: Duplicate learner references (within current submission)
		const duplicateRefs = learnerRefs.filter((ref, index) => learnerRefs.indexOf(ref) !== index);
		const uniqueDuplicates = [...new Set(duplicateRefs)];

		if (uniqueDuplicates.length > 0) {
			issues.push({
				severity: 'error',
				category: 'duplicate_learners',
				message: `Found ${uniqueDuplicates.length} duplicate learner reference(s)`,
				details: {
					duplicates: uniqueDuplicates,
				},
			});
		}

		// Check 4: First submission info
		if (!previousSubmission) {
			issues.push({
				severity: 'info',
				category: 'data_anomaly',
				message: 'This is the first submission in history',
			});
		}

		checkStep.status = 'complete';
		checkStep.progress = 100;
		checkStep.message = `Found ${issues.length} issue(s)`;
		yield stepEvent('step:complete', checkStep);
	} catch (error) {
		checkStep.status = 'failed';
		checkStep.error = error instanceof Error ? error : new Error(String(error));
		yield stepEvent('step:error', checkStep);
		return failedResult(steps, checkStep.error, startTime);
	}

	// --- Step 5: Generate Report ---
	const reportStep = createStep(STEPS.report);
	steps.push(reportStep);
	yield stepEvent('step:start', reportStep);

	try {
		const summary = {
			totalIssues: issues.length,
			errorCount: issues.filter((i) => i.severity === 'error').length,
			warningCount: issues.filter((i) => i.severity === 'warning').length,
			infoCount: issues.filter((i) => i.severity === 'info').length,
		};

		const report: CheckReport = {
			currentSubmission: {
				filename: basename(input.filePath),
				learnerCount,
				schema: collectionYear,
				learnerRefs,
			},
			previousSubmission: previousSubmission
				? {
						filename: previousSubmission.filename,
						learnerCount: previousSubmission.learnerCount,
						schema: previousSubmission.schema,
						timestamp: previousSubmission.timestamp,
					}
				: undefined,
			issues,
			summary,
		};

		reportStep.status = 'complete';
		reportStep.progress = 100;
		reportStep.message = `Report generated: ${summary.errorCount} errors, ${summary.warningCount} warnings`;
		yield stepEvent('step:complete', reportStep);

		return {
			success: true,
			data: {
				report,
				hasIssues: issues.length > 0,
			},
			steps,
			duration: Date.now() - startTime,
		};
	} catch (error) {
		reportStep.status = 'failed';
		reportStep.error = error instanceof Error ? error : new Error(String(error));
		yield stepEvent('step:error', reportStep);
		return failedResult(steps, reportStep.error, startTime);
	}
}

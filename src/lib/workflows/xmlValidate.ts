/** |===================|| XML Validation Workflow ||==================|
 *  | Validates ILR XML files against the schema. Yields step events
 *  | for UI consumption.
 *  |==================================================================|
 */

import { readFileSync } from 'fs';

import { createStep, stepEvent, failedResult } from './utils';
import { parseILR, type ParseResult } from '../utils/xml/xmlParser';
import type { ILRMessage } from '../utils/xml/xmlGenerator.legacy';
import type { SchemaRegistry } from '../types/interpreterTypes';
import { validateValue } from '../schema/schemaValidator';

import type { SchemaValidationIssue } from '../types/schemaTypes';
import type {
	ValidateInput,
	ValidateOutput,
	WorkflowStep,
	WorkflowStepEvent,
	WorkflowResult,
} from '../types/workflowTypes';

// |==================================================================|

const STEPS = {
	load: { id: 'load', name: 'Load File' },
	parse: { id: 'parse', name: 'Parse XML' },
	validate: { id: 'validate', name: 'Validate Against Schema' },
} as const;

export async function* xmlValidateWorkflow(
	input: ValidateInput
): AsyncGenerator<WorkflowStepEvent, WorkflowResult<ValidateOutput>, void> {
	const startTime = Date.now();
	const steps: WorkflowStep[] = [];

	// --- Step 1: Load File ---
	let xmlContent: string;
	const loadStep = createStep(STEPS.load);

	steps.push(loadStep);
	yield stepEvent('step:start', loadStep);

	try {
		if (!input.filePath.toLowerCase().endsWith('.xml')) {
			throw new Error(
				'Only XML files are supported. For CSV validation, use csvValidate workflow.'
			);
		}

		xmlContent = readFileSync(input.filePath, 'utf-8');
		const size = Buffer.byteLength(xmlContent, 'utf-8');

		loadStep.status = 'complete';
		loadStep.progress = 100;
		loadStep.message = `Loaded ${(size / 1024).toFixed(1)} KB`;

		yield stepEvent('step:complete', loadStep);
	} catch (error) {
		loadStep.status = 'failed';
		loadStep.error = error instanceof Error ? error : new Error(String(error));

		yield stepEvent('step:error', loadStep);

		return failedResult<ValidateOutput>(steps, loadStep.error, startTime);
	}

	// --- Step 2: Parse XML ---
	let message: ILRMessage;
	const parseStep = createStep(STEPS.parse);

	steps.push(parseStep);
	yield stepEvent('step:start', parseStep);

	try {
		const parseResult = parseILR(xmlContent);

		if (!parseResult.success) throw new Error(parseResult.error.message);

		message = parseResult.data;

		parseStep.status = 'complete';
		parseStep.progress = 100;
		parseStep.message = `Parsed ${message.learners.length} learners`;

		yield stepEvent('step:complete', parseStep);
	} catch (error) {
		parseStep.status = 'failed';
		parseStep.error = error instanceof Error ? error : new Error(String(error));

		yield stepEvent('step:error', parseStep);

		return failedResult<ValidateOutput>(steps, parseStep.error, startTime);
	}

	// --- Step 3: Validate Against Schema ---
	const validateStep = createStep(STEPS.validate);

	steps.push(validateStep);
	yield stepEvent('step:start', validateStep);

	try {
		const issues = validateMessage(message, input.registry);
		const errorCount = issues.filter((i) => i.severity === 'error').length;
		const warningCount = issues.filter((i) => i.severity === 'warning').length;

		const validation = {
			valid: errorCount === 0,
			issues,
			errorCount,
			warningCount,
		};

		validateStep.status = 'complete';
		validateStep.progress = 100;
		validateStep.data = validation;
		validateStep.message = validation.valid
			? 'No errors found'
			: `Found ${errorCount} errors, ${warningCount} warnings`;

		yield stepEvent('step:complete', validateStep);

		return {
			success: true,
			data: { validation, sourceData: xmlContent },
			steps,
			duration: Date.now() - startTime,
		};
	} catch (error) {
		validateStep.status = 'failed';
		validateStep.error = error instanceof Error ? error : new Error(String(error));

		yield stepEvent('step:error', validateStep);

		return failedResult<ValidateOutput>(steps, validateStep.error, startTime);
	}
}

/** Validate an ILRMessage against schema constraints */
function validateMessage(message: ILRMessage, registry: SchemaRegistry): SchemaValidationIssue[] {
	const issues: SchemaValidationIssue[] = [];

	// Validate Header - CollectionDetails
	issues.push(
		...validateField(
			'Message.Header.CollectionDetails.Collection',
			message.header.collectionDetails.collection,
			registry
		)
	);
	issues.push(
		...validateField(
			'Message.Header.CollectionDetails.Year',
			message.header.collectionDetails.year,
			registry
		)
	);
	issues.push(
		...validateField(
			'Message.Header.CollectionDetails.FilePreparationDate',
			message.header.collectionDetails.filePreparationDate,
			registry
		)
	);

	// Validate Header - Source
	issues.push(
		...validateField(
			'Message.Header.Source.ProtectiveMarking',
			message.header.source.protectiveMarking,
			registry
		)
	);
	issues.push(
		...validateField('Message.Header.Source.UKPRN', message.header.source.ukprn, registry)
	);
	issues.push(
		...validateField(
			'Message.Header.Source.SoftwareSupplier',
			message.header.source.softwareSupplier,
			registry
		)
	);
	issues.push(
		...validateField(
			'Message.Header.Source.SoftwarePackage',
			message.header.source.softwarePackage,
			registry
		)
	);
	issues.push(
		...validateField('Message.Header.Source.Release', message.header.source.release, registry)
	);
	issues.push(
		...validateField('Message.Header.Source.SerialNo', message.header.source.serialNo, registry)
	);
	issues.push(
		...validateField('Message.Header.Source.DateTime', message.header.source.dateTime, registry)
	);

	// Validate LearningProvider
	issues.push(
		...validateField('Message.LearningProvider.UKPRN', message.learningProvider.ukprn, registry)
	);

	// Validate each Learner
	message.learners.forEach((learner, learnerIndex) => {
		const prefix = 'Message.Learner';

		issues.push(
			...validateField(`${prefix}.LearnRefNumber`, learner.learnRefNumber, registry, learnerIndex)
		);
		issues.push(...validateField(`${prefix}.ULN`, learner.uln, registry, learnerIndex));
		issues.push(
			...validateField(`${prefix}.FamilyName`, learner.familyName, registry, learnerIndex)
		);
		issues.push(
			...validateField(`${prefix}.GivenNames`, learner.givenNames, registry, learnerIndex)
		);
		issues.push(
			...validateField(`${prefix}.DateOfBirth`, learner.dateOfBirth, registry, learnerIndex)
		);
		issues.push(...validateField(`${prefix}.Ethnicity`, learner.ethnicity, registry, learnerIndex));
		issues.push(...validateField(`${prefix}.Sex`, learner.sex, registry, learnerIndex));
		issues.push(
			...validateField(`${prefix}.LLDDHealthProb`, learner.llddHealthProb, registry, learnerIndex)
		);
		issues.push(...validateField(`${prefix}.NINumber`, learner.niNumber, registry, learnerIndex));
		issues.push(
			...validateField(`${prefix}.PostcodePrior`, learner.postcodePrior, registry, learnerIndex)
		);
		issues.push(...validateField(`${prefix}.Postcode`, learner.postcode, registry, learnerIndex));
		issues.push(...validateField(`${prefix}.Email`, learner.email, registry, learnerIndex));

		// Validate each LearningDelivery
		learner.learningDeliveries.forEach((delivery) => {
			const dPrefix = `${prefix}.LearningDelivery`;

			issues.push(
				...validateField(`${dPrefix}.LearnAimRef`, delivery.learnAimRef, registry, learnerIndex)
			);
			issues.push(...validateField(`${dPrefix}.AimType`, delivery.aimType, registry, learnerIndex));
			issues.push(
				...validateField(`${dPrefix}.AimSeqNumber`, delivery.aimSeqNumber, registry, learnerIndex)
			);
			issues.push(
				...validateField(
					`${dPrefix}.LearnStartDate`,
					delivery.learnStartDate,
					registry,
					learnerIndex
				)
			);
			issues.push(
				...validateField(
					`${dPrefix}.LearnPlanEndDate`,
					delivery.learnPlanEndDate,
					registry,
					learnerIndex
				)
			);
			issues.push(
				...validateField(`${dPrefix}.FundModel`, delivery.fundModel, registry, learnerIndex)
			);
			issues.push(
				...validateField(`${dPrefix}.ProgType`, delivery.progType, registry, learnerIndex)
			);
			issues.push(...validateField(`${dPrefix}.StdCode`, delivery.stdCode, registry, learnerIndex));
			issues.push(
				...validateField(
					`${dPrefix}.DelLocPostCode`,
					delivery.delLocPostCode,
					registry,
					learnerIndex
				)
			);
			issues.push(
				...validateField(`${dPrefix}.CompStatus`, delivery.compStatus, registry, learnerIndex)
			);
			issues.push(
				...validateField(
					`${dPrefix}.LearnActEndDate`,
					delivery.learnActEndDate,
					registry,
					learnerIndex
				)
			);
			issues.push(...validateField(`${dPrefix}.Outcome`, delivery.outcome, registry, learnerIndex));
		});
	});

	return issues;
}

/** Validate a single field against its schema element */
function validateField(
	path: string,
	value: unknown,
	registry: SchemaRegistry,
	rowIndex?: number
): SchemaValidationIssue[] {
	const element = registry.elementsByPath.get(path);
	if (!element) {
		// Element not in schema - skip validation
		return [];
	}

	return validateValue(value, element, { rowIndex });
}

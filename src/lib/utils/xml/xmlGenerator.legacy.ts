/** |===================|| Human-Friendly Name ||==================|
 *  | Explanation
 *  |==============================================================|
 */

/**
 * ILR XML Generator
 *
 * Generates ILR-compliant XML from parsed CSV data.
 * Based on ESFA ILR 2025-26 specification (schemafile25.xsd)
 */

export interface CollectionDetails {
	/** Fixed value: "ILR" */ collection: 'ILR';
	/** Academic year: "2526" for 2025-26 */ year: string;
	/** File preparation date (YYYY-MM-DD) */ filePreparationDate: string;
}

export interface Source {
	/** Fixed: "OFFICIAL-SENSITIVE-Personal" */ protectiveMarking: 'OFFICIAL-SENSITIVE-Personal';
	/** UKPRN (8 digits, 10000000-99999999) */ ukprn: number;
	/** Software supplier name (max 40 chars) */ softwareSupplier?: string;
	/** Software package name (max 30 chars) */ softwarePackage?: string;
	/** Release version (max 20 chars) */ release?: string;
	/** Serial number (1-2 digits) */ serialNo: string;
	/** Submission datetime (ISO 8601) */ dateTime: string;
}

export interface Header {
	collectionDetails: CollectionDetails;
	source: Source;
}

export interface Learner {
	/** Provider's learner reference (max 12 chars) */ learnRefNumber: string;
	/** Unique Learner Number (10 digits) */ uln: number;
	/** Family name (max 100 chars) */ familyName?: string;
	/** Given names (max 100 chars) */ givenNames?: string;
	/** Date of birth (YYYY-MM-DD) */ dateOfBirth?: string;
	/** Ethnicity code (2 digits) */ ethnicity: number;
	/** Sex code (1 char: M/F/I) */ sex: string;
	/** LLDD and health problem flag (1 digit) */ llddHealthProb: number;
	/** National Insurance number (max 9 chars) */ niNumber?: string;
	/** Postcode prior to enrolment (max 8 chars) */ postcodePrior: string;
	/** Current postcode (max 8 chars) */ postcode: string;
	/** Email address */ email?: string;
	/** Learning deliveries for this learner */ learningDeliveries: LearningDelivery[];
}

export interface LearningDelivery {
	/** Learning aim reference (max 8 chars) */ learnAimRef: string;
	/** Aim type code (1 digit) */ aimType: number;
	/** Aim sequence number (1-98) */ aimSeqNumber: number;
	/** Start date (YYYY-MM-DD) */ learnStartDate: string;
	/** Planned end date (YYYY-MM-DD) */ learnPlanEndDate: string;
	/** Funding model code (2 digits) */ fundModel: number;
	/** Programme type (2 digits, for apprenticeships) */ progType?: number;
	/** Standard code (5 digits) */ stdCode?: number;
	/** Delivery location postcode (max 8 chars) */ delLocPostCode: string;
	/** Completion status (1 digit) */ compStatus: number;
	/** Actual end date if completed (YYYY-MM-DD) */ learnActEndDate?: string;
	/** Outcome code (1 digit) */ outcome?: number;
}

export interface LearningProvider {
	/** UKPRN (8 digits) */ ukprn: number;
}

export interface ILRMessage {
	header: Header;
	learningProvider: LearningProvider;
	learners: Learner[];
}

// === XML Generation ===
const XML_NAMESPACE = 'ESFA/ILR/2025-26';

/**
 * Generate ILR XML from message data
 * @param message - Complete ILR message with header, provider, and learners
 * @returns XML string ready for submission
 */
export function generateILR(message: ILRMessage): string {
	const lines: string[] = [
		'<?xml version="1.0" encoding="utf-8"?>',
		`<Message xmlns="${XML_NAMESPACE}">`,
		generateHeader(message.header),
		generateLearningProvider(message.learningProvider),
		...message.learners.map(generateLearner),
		'</Message>',
	];

	return lines.join('\n');
}

function generateHeader(header: Header): string {
	const { collectionDetails: cd, source: s } = header;

	const collectionDetails = element(
		'CollectionDetails',
		[
			element('Collection', cd.collection),
			element('Year', cd.year),
			element('FilePreparationDate', cd.filePreparationDate),
		],
		undefined,
		4
	);

	const source = element(
		'Source',
		[
			element('ProtectiveMarking', s.protectiveMarking),
			element('UKPRN', s.ukprn),
			element('SoftwareSupplier', s.softwareSupplier),
			element('SoftwarePackage', s.softwarePackage),
			element('Release', s.release),
			element('SerialNo', s.serialNo),
			element('DateTime', s.dateTime),
		],
		undefined,
		4
	);

	return element('Header', [collectionDetails, source], undefined, 2);
}

function generateLearningProvider(provider: LearningProvider): string {
	return element('LearningProvider', [element('UKPRN', provider.ukprn)], undefined, 2);
}

function generateLearner(learner: Learner): string {
	const deliveries = learner.learningDeliveries.map(generateLearningDelivery);

	return element(
		'Learner',
		[
			element('LearnRefNumber', learner.learnRefNumber),
			element('ULN', learner.uln),
			element('FamilyName', learner.familyName, escapeXml),
			element('GivenNames', learner.givenNames, escapeXml),
			element('DateOfBirth', learner.dateOfBirth),
			element('Ethnicity', learner.ethnicity),
			element('Sex', learner.sex),
			element('LLDDHealthProb', learner.llddHealthProb),
			element('NINumber', learner.niNumber),
			element('PostcodePrior', learner.postcodePrior),
			element('Postcode', learner.postcode),
			element('Email', learner.email, escapeXml),
			...deliveries,
		],
		undefined,
		2
	);
}

function generateLearningDelivery(ld: LearningDelivery): string {
	return element(
		'LearningDelivery',
		[
			element('LearnAimRef', ld.learnAimRef),
			element('AimType', ld.aimType),
			element('AimSeqNumber', ld.aimSeqNumber),
			element('LearnStartDate', ld.learnStartDate),
			element('LearnPlanEndDate', ld.learnPlanEndDate),
			element('FundModel', ld.fundModel),
			element('ProgType', ld.progType),
			element('StdCode', ld.stdCode),
			element('DelLocPostCode', ld.delLocPostCode),
			element('CompStatus', ld.compStatus),
			element('LearnActEndDate', ld.learnActEndDate),
			element('Outcome', ld.outcome),
		],
		undefined,
		4
	);
}

// === XML Utilities ===
type Transformer = (value: string) => string;

function element(
	tag: string,
	content: string | number | undefined | string[],
	transform?: Transformer,
	indent: number = 0
): string {
	if (content === undefined || content === null) {
		return '';
	}

	const pad = ' '.repeat(indent);

	if (Array.isArray(content)) {
		const children = content.filter(Boolean).join('\n');
		return `${pad}<${tag}>\n${children}\n${pad}</${tag}>`;
	}

	const value = transform ? transform(String(content)) : String(content);
	return `${pad}<${tag}>${value}</${tag}>`;
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

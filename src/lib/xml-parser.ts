import { XMLParser } from 'fast-xml-parser';
import type { ILRMessage, Header, Learner, LearningDelivery } from './generator';

export interface ParseSuccess {
	success: true;
	data: ILRMessage;
}

export interface ParseError {
	success: false;
	error: {
		code: 'INVALID_XML' | 'MISSING_ELEMENT' | 'INVALID_STRUCTURE';
		message: string;
		details?: unknown;
	};
}

export type ParseResult = ParseSuccess | ParseError;

export function parseILR(xml: string): ParseResult {
	// 1. Configure parser (preserve attributes, handle arrays correctly)
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: '@_',
		isArray: (name) => ['Learner', 'LearningDelivery'].includes(name),
	});

	// 2. Parse XML string
	const parsed = parser.parse(xml);
	const message = parsed?.Message;

	if (!message) {
		return {
			success: false,
			error: { code: 'MISSING_ELEMENT', message: 'Missing root Message element' },
		};
	}

	return {
		success: true,
		data: {
			header: extractHeader(message.Header),
			learningProvider: { ukprn: message.LearningProvider?.UKPRN },
			learners: message.Learner?.map(extractLearner) ?? [],
		},
	};
}

function extractHeader(raw: unknown): Header {
	const h = raw as Record<string, unknown>;
	const cd = h?.CollectionDetails as Record<string, unknown>;
	const s = h?.Source as Record<string, unknown>;

	return {
		collectionDetails: {
			collection: cd?.Collection as 'ILR',
			year: String(cd?.Year ?? ''),
			filePreparationDate: String(cd?.FilePreparationDate ?? ''),
		},
		source: {
			protectiveMarking: s?.ProtectiveMarking as 'OFFICIAL-SENSITIVE-Personal',
			ukprn: Number(s?.UKPRN),
			softwareSupplier: s?.SoftwareSupplier as string | undefined,
			softwarePackage: s?.SoftwarePackage as string | undefined,
			release: s?.Release as string | undefined,
			serialNo: String(s?.SerialNo ?? ''),
			dateTime: String(s?.DateTime ?? ''),
		},
	};
}

function extractLearner(raw: unknown): Learner {
	// Map fields (LearnRefNumber → learnRefNumber, etc.)
	// Extract nested LearningDelivery array
}

function extractLearningDelivery(raw: unknown): LearningDelivery {
	const ld = raw as Record<string, unknown>;

	return {
		learnAimRef: String(ld?.LearnAimRef ?? ''),
		aimType: Number(ld?.AimType),
		aimSeqNumber: Number(ld?.AimSeqNumber),
		learnStartDate: String(ld?.LearnStartDate ?? ''),
		learnPlanEndDate: String(ld?.LearnPlanEndDate ?? ''),
		fundModel: Number(ld?.FundModel),
		progType: ld?.ProgType !== undefined ? Number(ld.ProgType) : undefined,
		stdCode: ld?.StdCode !== undefined ? Number(ld.StdCode) : undefined,
		delLocPostCode: String(ld?.DelLocPostCode ?? ''),
		compStatus: Number(ld?.CompStatus),
		learnActEndDate: ld?.LearnActEndDate as string | undefined,
		outcome: ld?.Outcome !== undefined ? Number(ld.Outcome) : undefined,
	};
}

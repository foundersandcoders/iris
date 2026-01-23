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

	// 3. Extract and transform to ILRMessage structure
	extractHeader(message);

	function extractLearner(raw: unknown): Learner {
		// Map fields (LearnRefNumber → learnRefNumber, etc.)
		// Extract nested LearningDelivery array
	}

	function extractLearningDelivery(raw: unknown): LearningDelivery {
		// Map delivery fields
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

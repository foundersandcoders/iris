import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type { ILRMessage, Header, Learner, LearningDelivery } from './xml-generator';

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
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: '@_',
		isArray: (name) => ['Learner', 'LearningDelivery'].includes(name),
	});

	try {
		const validation = XMLValidator.validate(xml);
		if (validation !== true) {
			return {
				success: false,
				error: {
					code: 'INVALID_XML',
					message: validation.err?.msg ?? 'Invalid XML structure',
					details: validation.err,
				},
			};
		}

		const parsed = parser.parse(xml);
		const message = parsed?.Message;

		if (!message)
			return {
				success: false,
				error: {
					code: 'MISSING_ELEMENT',
					message: 'Missing root Message element',
				},
			};

		return {
			success: true,
			data: {
				header: extractHeader(message.Header),
				learningProvider: { ukprn: Number(message.LearningProvider?.UKPRN) },
				learners: (message.Learner ?? []).map(extractLearner),
			},
		};
	} catch (err) {
		return {
			success: false,
			error: {
				code: 'INVALID_XML',
				message: 'Failed to parse XML',
				details: err instanceof Error ? err.message : err,
			},
		};
	}
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
	const l = raw as Record<string, unknown>;
	const deliveries = (l?.LearningDelivery as unknown[]) ?? [];

	return {
		learnRefNumber: String(l?.LearnRefNumber ?? ''),
		uln: Number(l?.ULN),
		familyName: l?.FamilyName as string | undefined,
		givenNames: l?.GivenNames as string | undefined,
		dateOfBirth: l?.DateOfBirth as string | undefined,
		ethnicity: Number(l?.Ethnicity),
		sex: String(l?.Sex ?? ''),
		llddHealthProb: Number(l?.LLDDHealthProb),
		niNumber: l?.NINumber as string | undefined,
		postcodePrior: String(l?.PostcodePrior ?? ''),
		postcode: String(l?.Postcode ?? ''),
		email: l?.Email as string | undefined,
		learningDeliveries: deliveries.map(extractLearningDelivery),
	};
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

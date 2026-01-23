import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type { ILRMessage, Header, Learner, LearningDelivery } from './xmlGenerator';

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

class StructureError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'StructureError';
	}
}

/**
 * Convert an ILR XML string into a structured parse result containing header, learning provider and learners, or an explicit error.
 *
 * @returns On success, `data` contains the extracted `header`, `learningProvider.ukprn` and `learners`. On failure, `error` contains a `code` (one of `INVALID_XML`, `MISSING_ELEMENT`, `INVALID_STRUCTURE`), a human-readable `message`, and optional `details`.
 */
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
		if (err instanceof StructureError) {
			return {
				success: false,
				error: {
					code: 'INVALID_STRUCTURE',
					message: err.message,
				},
			};
		}
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

/**
 * Build a typed Header object from a raw parsed XML Header node.
 *
 * @param raw - The raw Header node parsed from the ILR XML (untyped).
 * @returns A Header with collection details and source metadata (UKPRN, protective marking, software info, serial number and timestamp).
 */
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

/**
 * Convert a raw learner XML node into a typed Learner object.
 *
 * Coerces and maps XML properties into the Learner shape, converting numeric fields to numbers
 * and leaving optional textual fields as strings or undefined. Required learner fields
 * 'ULN', 'Ethnicity' and 'LLDDHealthProb' must be present.
 *
 * @param raw - Raw parsed XML node representing a learner
 * @returns A Learner object with typed properties (numeric fields converted to numbers; optional text fields as strings or `undefined`)
 * @throws {StructureError} If any required learner field ('ULN', 'Ethnicity', 'LLDDHealthProb') is missing
 */
function extractLearner(raw: unknown): Learner {
	const l = raw as Record<string, unknown>;
	const deliveries = (l?.LearningDelivery as unknown[]) ?? [];

	const requiredFields = ['ULN', 'Ethnicity', 'LLDDHealthProb'] as const;
	for (const field of requiredFields) {
		if (l?.[field] === undefined) {
			throw new StructureError(`Missing required learner field: ${field}`);
		}
	}

	return {
		learnRefNumber: String(l?.LearnRefNumber ?? ''),
		uln: Number(l.ULN),
		familyName: l?.FamilyName as string | undefined,
		givenNames: l?.GivenNames as string | undefined,
		dateOfBirth: l?.DateOfBirth as string | undefined,
		ethnicity: Number(l.Ethnicity),
		sex: String(l?.Sex ?? ''),
		llddHealthProb: Number(l.LLDDHealthProb),
		niNumber: l?.NINumber as string | undefined,
		postcodePrior: String(l?.PostcodePrior ?? ''),
		postcode: String(l?.Postcode ?? ''),
		email: l?.Email as string | undefined,
		learningDeliveries: deliveries.map(extractLearningDelivery),
	};
}

/**
 * Constructs a LearningDelivery object from a raw parsed XML node.
 *
 * @param raw - The raw parsed XML node representing a single learning delivery
 * @returns A LearningDelivery populated from `raw` with numeric fields converted to numbers; optional numeric fields are `undefined` when absent and string fields default to empty string when missing
 * @throws StructureError if any required delivery field (`AimType`, `AimSeqNumber`, `FundModel`, `CompStatus`) is missing
 */
function extractLearningDelivery(raw: unknown): LearningDelivery {
	const ld = raw as Record<string, unknown>;

	const requiredFields = ['AimType', 'AimSeqNumber', 'FundModel', 'CompStatus'] as const;
	for (const field of requiredFields) {
		if (ld?.[field] === undefined) {
			throw new StructureError(`Missing required delivery field: ${field}`);
		}
	}

	return {
		learnAimRef: String(ld?.LearnAimRef ?? ''),
		aimType: Number(ld.AimType),
		aimSeqNumber: Number(ld.AimSeqNumber),
		learnStartDate: String(ld?.LearnStartDate ?? ''),
		learnPlanEndDate: String(ld?.LearnPlanEndDate ?? ''),
		fundModel: Number(ld.FundModel),
		progType: ld?.ProgType !== undefined ? Number(ld.ProgType) : undefined,
		stdCode: ld?.StdCode !== undefined ? Number(ld.StdCode) : undefined,
		delLocPostCode: String(ld?.DelLocPostCode ?? ''),
		compStatus: Number(ld.CompStatus),
		learnActEndDate: ld?.LearnActEndDate as string | undefined,
		outcome: ld?.Outcome !== undefined ? Number(ld.Outcome) : undefined,
	};
}
import type { ColumnMapping } from '../types/schemaTypes';
import type { IlrMappingConfig } from '../types/ilrMappingTypes';
import type { SchemaRegistry } from '../types/interpreterTypes';
import { mapCsvToSchema } from '../schema/columnMapper';
import { getTransform } from '../transforms/registry';
import { hasAimData } from './aimUtils';
import {
	buildFamEntries,
	buildAppFinRecords,
	buildEmploymentStatuses,
	buildLLDDFields,
} from './builders';
import { generateUUID } from '../utils/uuid';

/**
 * Maps a single CSV row to ILR structure with support for multiple LearningDelivery aims
 *
 * Detects which aims (1-5) have data and creates separate LearningDelivery elements for each.
 * Auto-generates AimSeqNumber based on the aim group number.
 *
 * @param csvRow - Object with CSV column headers as keys
 * @param config - Mapping configuration with aim-grouped mappings
 * @param registry - Schema registry for path validation
 * @returns Nested object structure with multiple LearningDelivery elements
 */
export function mapCsvToSchemaWithAims(
	csvRow: Record<string, string>,
	config: IlrMappingConfig,
	registry: SchemaRegistry
): Record<string, unknown> {
	// Separate learner-level and aim-specific mappings
	const learnerMappings = config.mappings.filter((m) => !m.group);
	const aimMappings = config.mappings.filter((m) => m.group);

	// Group aim mappings by aim number
	const aimGroups = new Map<number, ColumnMapping[]>();
	for (const mapping of aimMappings) {
		if (!mapping.group) continue;
		if (!aimGroups.has(mapping.group)) {
			aimGroups.set(mapping.group, []);
		}
		aimGroups.get(mapping.group)!.push(mapping);
	}

	// Apply learner-level mappings using generic mapper
	const result = mapCsvToSchema(csvRow, learnerMappings, registry);

	// Build LLDD fields with conditional logic
	const llddFields = buildLLDDFields(csvRow, 'Primary additional needs');
	const messagePart = result.Message as Record<string, unknown>;
	if (messagePart && messagePart.Learner) {
		const learnerArray = messagePart.Learner as Record<string, unknown>[];
		if (learnerArray.length > 0) {
			learnerArray[0].LLDDHealthProb = llddFields.LLDDHealthProb;
			if (llddFields.LLDDandHealthProblem) {
				learnerArray[0].LLDDandHealthProblem = llddFields.LLDDandHealthProblem;
			}
		}
	}

	// Build employment status entries
	const statuses = buildEmploymentStatuses(csvRow, config.employmentStatuses);
	if (statuses.length > 0) {
		const messagePart = result.Message as Record<string, unknown>;
		if (messagePart && messagePart.Learner) {
			const learnerArray = messagePart.Learner as Record<string, unknown>[];
			if (learnerArray.length > 0) learnerArray[0].LearnerEmploymentStatus = statuses;
		}
	}

	// Detect which aims have data and build LearningDelivery elements
	const detectionField = config.aimDetectionField || 'Programme aim {n} Learning ref';
	const learningDeliveries: Record<string, unknown>[] = [];

	for (const [aimNumber, mappings] of aimGroups.entries()) {
		if (!hasAimData(csvRow, aimNumber, detectionField)) continue;

		const delivery: Record<string, unknown> = { AimSeqNumber: aimNumber };

		for (const mapping of mappings) {
			const columnKey = Object.keys(csvRow).find(
				(key) => key.trim().toLowerCase() === mapping.csvColumn.trim().toLowerCase()
			);

			if (!columnKey) continue;

			const rawValue = csvRow[columnKey];
			const value = mapping.transform ? getTransform(mapping.transform)(rawValue) : rawValue;

			// Extract just the field name from the full path
			// e.g., "Message.Learner.LearningDelivery.LearnAimRef" -> "LearnAimRef"
			const pathParts = mapping.xsdPath.split('.');
			const fieldName = pathParts[pathParts.length - 1];

			delivery[fieldName] = value;
		}

		// Generate SWSupAimId (software-generated UUID for tracking)
		delivery.SWSupAimId = generateUUID();

		// Build FAM entries for this aim
		const fams = buildFamEntries(csvRow, config.famTemplates, aimNumber);
		if (fams.length > 0) delivery.LearningDeliveryFAM = fams;

		// Build AppFinRecord entries for this aim
		const fins = buildAppFinRecords(csvRow, config.appFinTemplates, aimNumber);
		if (fins.length > 0) delivery.AppFinRecord = fins;

		learningDeliveries.push(delivery);
	}

	// Inject LearningDelivery array into result structure
	if (learningDeliveries.length > 0) {
		const messagePart = result.Message as Record<string, unknown>;
		if (messagePart && messagePart.Learner) {
			const learnerArray = messagePart.Learner as Record<string, unknown>[];
			if (learnerArray.length > 0) {
				learnerArray[0].LearningDelivery = learningDeliveries;
			}
		}
	}

	return result;
}

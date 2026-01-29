import type { ColumnMapping, MappingConfig } from '../types/schemaTypes';
import type { SchemaRegistry } from '../types/interpreterTypes';
import { isRepeatable } from '../types/interpreterTypes';
import { getTransform } from '../transforms/registry';
import { hasAimData } from '../mappings/utils';

/**
 * Maps a single CSV row to a partial ILR structure using column mappings
 *
 * @param csvRow - Object with CSV column headers as keys
 * @param mappings - Array of column mappings to apply
 * @param registry - Schema registry for path validation
 * @returns Nested object structure following XSD paths
 */
export function mapCsvToSchema(
	csvRow: Record<string, string>,
	mappings: ColumnMapping[],
	registry: SchemaRegistry
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const mapping of mappings) {
		const columnKey = Object.keys(csvRow).find(
			(key) => key.toLowerCase() === mapping.csvColumn.toLowerCase()
		);

		if (!columnKey) continue;

		const rawValue = csvRow[columnKey];

		// Resolve transform by name if specified
		const value = mapping.transform ? getTransform(mapping.transform)(rawValue) : rawValue;

		setNestedValue(result, mapping.xsdPath, value, registry);
	}

	return result;
}

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
	config: MappingConfig,
	registry: SchemaRegistry
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	// Separate learner-level and aim-specific mappings
	const learnerMappings = config.mappings.filter((m) => !m.aimNumber);
	const aimMappings = config.mappings.filter((m) => m.aimNumber);

	// Group aim mappings by aim number
	const aimGroups = new Map<number, ColumnMapping[]>();
	for (const mapping of aimMappings) {
		if (!mapping.aimNumber) continue;
		if (!aimGroups.has(mapping.aimNumber)) {
			aimGroups.set(mapping.aimNumber, []);
		}
		aimGroups.get(mapping.aimNumber)!.push(mapping);
	}

	// Apply learner-level mappings (non-aim fields)
	for (const mapping of learnerMappings) {
		const columnKey = Object.keys(csvRow).find(
			(key) => key.trim().toLowerCase() === mapping.csvColumn.trim().toLowerCase()
		);

		if (!columnKey) continue;

		const rawValue = csvRow[columnKey];
		const value = mapping.transform ? getTransform(mapping.transform)(rawValue) : rawValue;

		setNestedValue(result, mapping.xsdPath, value, registry);
	}

	// Detect which aims have data and build LearningDelivery elements
	const detectionField = config.aimDetectionField || 'Programme aim {n} Learning ref';
	const learningDeliveries: Record<string, unknown>[] = [];

	for (const [aimNumber, mappings] of aimGroups.entries()) {
		// Check if this aim has data
		if (!hasAimData(csvRow, aimNumber, detectionField)) {
			continue;
		}

		// Build LearningDelivery object for this aim
		const delivery: Record<string, unknown> = {
			AimSeqNumber: aimNumber,
		};

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

		learningDeliveries.push(delivery);
	}

	// Inject LearningDelivery array into result structure
	if (learningDeliveries.length > 0) {
		// Navigate to Learner element and inject LearningDelivery array
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

/**
 * - Sets a value in a nested object using dot notation path
 * - Creates intermediate objects as needed
 * - Uses registry to determine if an element should be an array
 *
 * @example
 * setNestedValue({}, "Message.Learner.LearnRefNumber", "12345", registry)
 * // Returns: { Message: { Learner: [{ LearnRefNumber: "12345" }] } }
 */
function setNestedValue(
	obj: Record<string, unknown>,
	path: string,
	value: unknown,
	registry: SchemaRegistry
): void {
	const parts = path.split('.');
	let current = obj;
	let currentPath = '';

	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];
		currentPath = currentPath ? `${currentPath}.${part}` : part;

		const element = registry.elementsByPath.get(currentPath);
		const repeatable = element ? isRepeatable(element) : false;

		if (repeatable) {
			if (!(part in current)) {
				current[part] = [{}];
			}
			// For CSV mapping, we currently assume a single repeatable item per row
			// We reuse the first element in the array to build up the complex object
			const arr = current[part] as Record<string, unknown>[];
			current = arr[0];
		} else {
			if (!(part in current)) {
				current[part] = {};
			}
			current = current[part] as Record<string, unknown>;
		}
	}

	const lastPart = parts[parts.length - 1];
	current[lastPart] = value;
}

/**
 * - Loads a mapping configuration by ID
 * - Placeholder: will load from `~/.iris/mappings/<id>.json` in future)
 */
export function loadMappingConfig(id: string): MappingConfig | null {
	// TODO: Implement file-based loading
	throw new Error(`Mapping config loading not yet implemented (id: ${id})`);
}

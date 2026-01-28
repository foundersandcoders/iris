import type { ColumnMapping, MappingConfig } from '../types/schema.js';
import type { SchemaRegistry } from './types.js';

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
		const value = mapping.transform ? mapping.transform(rawValue) : rawValue;

		setNestedValue(result, mapping.xsdPath, value);
	}

	return result;
}

/**
 * Sets a value in a nested object using dot notation path
 * Creates intermediate objects as needed
 *
 * @example
 * setNestedValue({}, "Message.Learner.LearnRefNumber", "12345")
 * // Returns: { Message: { Learner: { LearnRefNumber: "12345" } } }
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
	const parts = path.split('.');
	let current = obj;

	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];

		if (!(part in current)) current[part] = {};

		current = current[part] as Record<string, unknown>;
	}

	const lastPart = parts[parts.length - 1];
	current[lastPart] = value;
}

/**
 * Loads a mapping configuration by ID
 * (Placeholder - will load from ~/.iris/mappings/<id>.json in future)
 */
export function loadMappingConfig(id: string): MappingConfig | null {
	// TODO: Implement file-based loading
	throw new Error(`Mapping config loading not yet implemented (id: ${id})`);
}

/** |===================|| Mapping Utilities ||==================|
 *  | Helper functions for generating and working with mappings
 *  |============================================================|
 */

import type { ColumnMapping } from '../../types/schemaTypes';

/** Template for generating aim-specific mappings */
export interface AimFieldTemplate {
	/** CSV column name with {n} placeholder for aim number */
	csv: string;
	/** XSD path (same for all aims) */
	xsd: string;
	/** Optional transform to apply */
	transform?: string;
}

/**
 * Generate column mappings for all 5 aims from a template
 *
 * @example
 * generateAimMappings([
 *   { csv: 'Programme aim {n} Learning ref', xsd: 'Message.Learner.LearningDelivery.LearnAimRef', transform: 'uppercase' }
 * ])
 * // Returns 5 mappings with aimNumber 1-5 and interpolated CSV column names
 */
export function generateAimMappings(templates: AimFieldTemplate[]): ColumnMapping[] {
	const result: ColumnMapping[] = [];

	for (let aimNumber = 1; aimNumber <= 5; aimNumber++) {
		for (const template of templates) {
			result.push({
				csvColumn: template.csv.replace('{n}', String(aimNumber)),
				xsdPath: template.xsd,
				transform: template.transform,
				aimNumber,
			});
		}
	}

	return result;
}

/**
 * Check if a specific aim has data in the CSV row
 *
 * @param row - CSV row data
 * @param aimNumber - Aim number to check (1-5)
 * @param detectionField - Field template to check (with {n} placeholder)
 * @returns true if aim has non-empty detection field
 */
export function hasAimData(
	row: Record<string, string>,
	aimNumber: number,
	detectionField: string
): boolean {
	const columnName = detectionField.replace('{n}', String(aimNumber));

	// Case-insensitive column match (handles trailing spaces)
	const columnKey = Object.keys(row).find(
		(key) => key.trim().toLowerCase() === columnName.trim().toLowerCase()
	);

	if (!columnKey) return false;

	const value = row[columnKey];
	return value !== undefined && value.trim() !== '';
}

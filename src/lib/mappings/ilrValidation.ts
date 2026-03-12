import type { ColumnMapping } from '../types/schemaTypes';
import { hasAimData } from './aimUtils';

/**
 * Creates a skip filter for aim-specific mappings during CSV validation.
 *
 * - At header level (no row): skips all aim-specific mappings (validated per-row instead)
 * - At row level: skips aim mappings where the aim has no data
 *
 * @param detectionField - Field template with {n} placeholder for aim detection
 */
export function createAimSkipFilter(detectionField: string = 'Programme aim {n} Learning ref') {
	return (mapping: ColumnMapping, row?: Record<string, string>): boolean => {
		if (!mapping.aimNumber) return false;
		if (!row) return true; // header-level: skip all aim mappings
		return !hasAimData(row, mapping.aimNumber, detectionField);
	};
}

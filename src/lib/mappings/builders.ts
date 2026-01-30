/** |===================|| Nested Element Builders ||==================|
 *  | Builder functions for nested repeating elements that can't use
 *  | flat column → path mapping (FAM, AppFinRecord, EmploymentStatus)
 *  |===================================================================|
 */

import type {
	FamTemplate,
	AppFinTemplate,
	EmploymentStatusConfig,
	EsmField,
} from '../types/schemaTypes';
import { getTransform } from '../transforms/registry';

/**
 * Find CSV column value using case-insensitive, trim-based lookup
 */
function getColumnValue(csvRow: Record<string, string>, columnName: string): string | undefined {
	const key = Object.keys(csvRow).find(
		(k) => k.trim().toLowerCase() === columnName.trim().toLowerCase()
	);
	return key ? csvRow[key] : undefined;
}

/**
 * Build LearningDeliveryFAM entries from templates and CSV row
 *
 * @param csvRow - CSV row data
 * @param templates - FAM templates with {n} placeholders
 * @param aimNumber - Aim number to interpolate
 * @returns Array of FAM objects (empty if no data)
 */
export function buildFamEntries(
	csvRow: Record<string, string>,
	templates: FamTemplate[] | undefined,
	aimNumber: number
): Array<{
	LearnDelFAMType: string;
	LearnDelFAMCode: string;
	LearnDelFAMDateFrom?: string;
	LearnDelFAMDateTo?: string;
}> {
	if (!templates) return [];

	const entries: Array<{
		LearnDelFAMType: string;
		LearnDelFAMCode: string;
		LearnDelFAMDateFrom?: string;
		LearnDelFAMDateTo?: string;
	}> = [];

	for (const template of templates) {
		// Interpolate {n} with aim number
		const typeCsv = template.typeCsv.replace('{n}', String(aimNumber));
		const codeCsv = template.codeCsv.replace('{n}', String(aimNumber));
		const dateFromCsv = template.dateFromCsv?.replace('{n}', String(aimNumber));
		const dateToCsv = template.dateToCsv?.replace('{n}', String(aimNumber));

		// Get values
		const typeValue = getColumnValue(csvRow, typeCsv);
		const codeValue = getColumnValue(csvRow, codeCsv);

		// Skip if type is empty (handles bootcamp aims with no ACT FAM)
		if (!typeValue || typeValue.trim() === '') continue;

		const entry: {
			LearnDelFAMType: string;
			LearnDelFAMCode: string;
			LearnDelFAMDateFrom?: string;
			LearnDelFAMDateTo?: string;
		} = {
			LearnDelFAMType: typeValue.trim(),
			LearnDelFAMCode: codeValue?.trim() || '',
		};

		// Add optional dates if provided
		if (dateFromCsv) {
			const dateFromValue = getColumnValue(csvRow, dateFromCsv);
			if (dateFromValue && dateFromValue.trim() !== '') {
				// Apply isoDate transform
				entry.LearnDelFAMDateFrom = getTransform('isoDate')(dateFromValue);
			}
		}

		if (dateToCsv) {
			const dateToValue = getColumnValue(csvRow, dateToCsv);
			if (dateToValue && dateToValue.trim() !== '') {
				// Apply isoDate transform
				entry.LearnDelFAMDateTo = getTransform('isoDate')(dateToValue);
			}
		}

		entries.push(entry);
	}

	return entries;
}

/**
 * Build AppFinRecord entries from templates and CSV row
 *
 * @param csvRow - CSV row data
 * @param templates - AppFinRecord templates with {n} placeholders
 * @param aimNumber - Aim number to interpolate
 * @returns Array of AppFinRecord objects (empty if no data)
 */
export function buildAppFinRecords(
	csvRow: Record<string, string>,
	templates: AppFinTemplate[] | undefined,
	aimNumber: number
): Array<{
	AFinType: string;
	AFinCode: string;
	AFinDate: string;
	AFinAmount: number;
}> {
	if (!templates) return [];

	const entries: Array<{
		AFinType: string;
		AFinCode: string;
		AFinDate: string;
		AFinAmount: number;
	}> = [];

	for (const template of templates) {
		// Interpolate {n} with aim number
		const typeCsv = template.typeCsv.replace('{n}', String(aimNumber));
		const codeCsv = template.codeCsv.replace('{n}', String(aimNumber));
		const dateCsv = template.dateCsv.replace('{n}', String(aimNumber));
		const amountCsv = template.amountCsv.replace('{n}', String(aimNumber));

		// Get values
		const typeValue = getColumnValue(csvRow, typeCsv);
		const codeValue = getColumnValue(csvRow, codeCsv);
		const dateValue = getColumnValue(csvRow, dateCsv);
		const amountValue = getColumnValue(csvRow, amountCsv);

		// Skip if type is empty (handles bootcamp aims with no financial records)
		if (!typeValue || typeValue.trim() === '') continue;

		// Skip if date is empty (required field)
		if (!dateValue || dateValue.trim() === '') continue;

		// Skip if amount is empty (required field, can't distinguish from explicit 0)
		if (!amountValue || amountValue.trim() === '') continue;

		entries.push({
			AFinType: typeValue.trim(),
			AFinCode: codeValue?.trim() || '',
			AFinDate: getTransform('isoDate')(dateValue),
			AFinAmount: getTransform('stringToInt')(amountValue),
		});
	}

	return entries;
}

/**
 * Build EmploymentStatusMonitoring entry for a single ESM field
 */
function buildEsmEntry(
	csvRow: Record<string, string>,
	field: EsmField
): { ESMType: string; ESMCode: number } | null {
	const value = getColumnValue(csvRow, field.csvColumn);

	// Skip if value is empty
	if (!value || value.trim() === '') return null;

	return {
		ESMType: field.esmType,
		ESMCode: getTransform(field.transform)(value),
	};
}

/**
 * Build LearnerEmploymentStatus entries from configurations
 *
 * @param csvRow - CSV row data
 * @param configs - Array of employment status configurations
 * @returns Array of LearnerEmploymentStatus objects (empty if no data)
 */
export function buildEmploymentStatuses(
	csvRow: Record<string, string>,
	configs: EmploymentStatusConfig[] | undefined
): Array<{
	EmpStat: number;
	DateEmpStatApp: string;
	EmpId?: number;
	EmploymentStatusMonitoring?: Array<{ ESMType: string; ESMCode: number }>;
}> {
	if (!configs) return [];

	const entries: Array<{
		EmpStat: number;
		DateEmpStatApp: string;
		EmpId?: number;
		EmploymentStatusMonitoring?: Array<{ ESMType: string; ESMCode: number }>;
	}> = [];

	for (const config of configs) {
		// Get EmpStat value - skip entire entry if empty
		const empStatValue = getColumnValue(csvRow, config.empStatCsv);
		if (!empStatValue || empStatValue.trim() === '') continue;

		// Get DateEmpStatApp value - skip entire entry if empty (required field)
		const dateEmpStatAppValue = getColumnValue(csvRow, config.dateEmpStatAppCsv);
		if (!dateEmpStatAppValue || dateEmpStatAppValue.trim() === '') continue;

		const entry: {
			EmpStat: number;
			DateEmpStatApp: string;
			EmpId?: number;
			EmploymentStatusMonitoring?: Array<{ ESMType: string; ESMCode: number }>;
		} = {
			EmpStat: getTransform('stringToInt')(empStatValue),
			DateEmpStatApp: getTransform('isoDate')(dateEmpStatAppValue),
		};

		// Add optional EmpId if present
		const empIdValue = getColumnValue(csvRow, config.empIdCsv);
		if (empIdValue && empIdValue.trim() !== '') {
			entry.EmpId = getTransform('stringToInt')(empIdValue);
		}

		// Build monitoring entries
		const monitoring: Array<{ ESMType: string; ESMCode: number }> = [];
		for (const field of config.monitoring) {
			const esmEntry = buildEsmEntry(csvRow, field);
			if (esmEntry) monitoring.push(esmEntry);
		}

		if (monitoring.length > 0) {
			entry.EmploymentStatusMonitoring = monitoring;
		}

		entries.push(entry);
	}

	return entries;
}

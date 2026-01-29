/** |===================|| Human-Friendly Name ||==================|
 *  | Explanation
 *  |==============================================================|
 */

/**
 * Semantic Validator for ILR Data
 *
 * Validates parsed CSV data against schema constraints.
 * Uses SchemaRegistry for dynamic validation rules.
 */

import type { CSVRow } from './csvParser';
import type { SchemaRegistry, SchemaElement } from '../../types/interpreterTypes';
import { validateValue } from '../../schema/schemaValidator';
import type { SchemaValidationIssue, MappingConfig } from '../../types/schemaTypes';

// === Types ===
export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
	/** Severity level */ severity: ValidationSeverity;
	/** Field that failed validation (if applicable) */ field?: string;
	/** Row index (0-based) where issue occurred */ row?: number;
	/** Human-readable error message */ message: string;
	/** Machine-readable error code */ code: string;
	/** Actual value that caused the issue */ actualValue?: unknown;
}

export interface ValidationResult {
	/** Whether validation passed with no errors */ valid: boolean;
	/** All issues found during validation */ issues: ValidationIssue[];
	/** Count of errors */ errorCount: number;
	/** Count of warnings */ warningCount: number;
}

// === Validation Functions ===

/**
 * Validate parsed CSV rows against schema constraints
 * @param rows - Parsed CSV rows to validate
 * @param headers - CSV headers from the file
 * @param registry - Schema registry for validation rules
 * @param mapping - Mapping configuration to use
 * @returns Validation result with all issues found
 */
export function validateRows(
	rows: CSVRow[],
	headers: string[],
	registry: SchemaRegistry,
	mapping: MappingConfig
): ValidationResult {
	const issues: ValidationIssue[] = [];

	// Check for missing required headers (based on mapping and schema)
	const missingHeaders = validateRequiredHeaders(headers, registry, mapping);
	issues.push(...missingHeaders);

	// Validate each row against schema
	rows.forEach((row, index) => {
		const rowIssues = validateRow(row, index, registry, mapping);
		issues.push(...rowIssues);
	});

	const errorCount = issues.filter((i) => i.severity === 'error').length;
	const warningCount = issues.filter((i) => i.severity === 'warning').length;

	return {
		valid: errorCount === 0,
		issues,
		errorCount,
		warningCount,
	};
}

/**
 * Check that all required headers are present based on mapping and schema
 */
function validateRequiredHeaders(
	headers: string[],
	registry: SchemaRegistry,
	mapping: MappingConfig
): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const headerSet = new Set(headers.map((h) => h.toLowerCase()));

	for (const m of mapping.mappings) {
		const path = m.xsdPath.replace(/\./g, '/');
		const element = registry.elementsByPath.get(path);
		if (!element) continue;

		// Check if field is required (cardinality.min >= 1)
		if (element.cardinality.min >= 1 && !headerSet.has(m.csvColumn.toLowerCase())) {
			issues.push({
				severity: 'error',
				field: m.csvColumn,
				message: `Required column "${m.csvColumn}" is missing from CSV`,
				code: 'MISSING_REQUIRED_HEADER',
			});
		}
	}

	return issues;
}

/**
 * Validate a single row against schema constraints
 */
function validateRow(
	row: CSVRow,
	rowIndex: number,
	registry: SchemaRegistry,
	mapping: MappingConfig
): ValidationIssue[] {
	const issues: ValidationIssue[] = [];

	for (const m of mapping.mappings) {
		const path = m.xsdPath.replace(/\./g, '/');
		const element = registry.elementsByPath.get(path);
		if (!element) continue;

		// Case-insensitive column lookup
		const actualHeader = Object.keys(row).find((h) => h.toLowerCase() === m.csvColumn.toLowerCase());
		const value = actualHeader ? row[actualHeader] : undefined;

		const schemaIssues = validateValue(value, element, {
			rowIndex,
			sourceField: m.csvColumn,
		});

		// Convert schema validation issues to ValidationIssue format
		for (const schemaIssue of schemaIssues) {
			issues.push(convertSchemaIssue(schemaIssue, m.csvColumn, rowIndex));
		}
	}

	return issues;
}

/**
 * Convert SchemaValidationIssue to ValidationIssue
 */
function convertSchemaIssue(
	schemaIssue: SchemaValidationIssue,
	field: string,
	rowIndex: number
): ValidationIssue {
	return {
		severity: schemaIssue.severity,
		field,
		row: rowIndex,
		message: schemaIssue.message,
		code: schemaIssue.code,
		actualValue: schemaIssue.actualValue,
	};
}

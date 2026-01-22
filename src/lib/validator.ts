/**
 * Semantic Validator for ILR Data
 *
 * Validates parsed CSV data against schema constraints.
 * Uses SchemaRegistry for dynamic validation rules.
 */

import type { CSVRow } from './parser';
import type { SchemaRegistry, SchemaElement } from './schema/interpreter';
import { validateValue } from './schema/schemaValidator';
import type { SchemaValidationIssue } from './schema/validation';

// === Types ===
export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
	/** Severity level */ severity: ValidationSeverity;
	/** Field that failed validation (if applicable) */ field?: string;
	/** Row index (0-based) where issue occurred */ row?: number;
	/** Human-readable error message */ message: string;
	/** Machine-readable error code */ code: string;
}

export interface ValidationResult {
	/** Whether validation passed with no errors */ valid: boolean;
	/** All issues found during validation */ issues: ValidationIssue[];
	/** Count of errors */ errorCount: number;
	/** Count of warnings */ warningCount: number;
}

// === Field to Schema Path Mapping ===
// Maps CSV column names to schema element paths
// TODO: Move to column mapping configuration (Phase 4)
const FIELD_TO_PATH: Record<string, string> = {
	LearnRefNumber: 'Message/Learner/LearnRefNumber',
	ULN: 'Message/Learner/ULN',
	DateOfBirth: 'Message/Learner/DateOfBirth',
	Ethnicity: 'Message/Learner/Ethnicity',
	Sex: 'Message/Learner/Sex',
	LLDDHealthProb: 'Message/Learner/LLDDHealthProb',
	PostcodePrior: 'Message/Learner/PostcodePrior',
	Postcode: 'Message/Learner/Postcode',
	LearnAimRef: 'Message/Learner/LearningDelivery/LearnAimRef',
	AimType: 'Message/Learner/LearningDelivery/AimType',
	AimSeqNumber: 'Message/Learner/LearningDelivery/AimSeqNumber',
	LearnStartDate: 'Message/Learner/LearningDelivery/LearnStartDate',
	LearnPlanEndDate: 'Message/Learner/LearningDelivery/LearnPlanEndDate',
	FundModel: 'Message/Learner/LearningDelivery/FundModel',
	DelLocPostCode: 'Message/Learner/LearningDelivery/DelLocPostCode',
	CompStatus: 'Message/Learner/LearningDelivery/CompStatus',
};

// === Validation Functions ===

/**
 * Validate parsed CSV rows against schema constraints
 * @param rows - Parsed CSV rows to validate
 * @param headers - CSV headers from the file
 * @param registry - Schema registry for validation rules
 * @returns Validation result with all issues found
 */
export function validateRows(
	rows: CSVRow[],
	headers: string[],
	registry: SchemaRegistry
): ValidationResult {
	const issues: ValidationIssue[] = [];

	// Check for missing required headers (based on schema)
	const missingHeaders = validateRequiredHeaders(headers, registry);
	issues.push(...missingHeaders);

	// Validate each row against schema
	rows.forEach((row, index) => {
		const rowIssues = validateRow(row, index, registry);
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
 * Identify schema-required CSV headers that are missing from the provided header list.
 *
 * @param headers - The list of CSV column names present in the file.
 * @param registry - SchemaRegistry used to determine which fields are required via element cardinalities.
 * @returns An array of `ValidationIssue` objects for each required header that is not present; each issue has severity `error` and code `MISSING_REQUIRED_HEADER`.
 */
function validateRequiredHeaders(headers: string[], registry: SchemaRegistry): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const headerSet = new Set(headers);

	for (const [field, path] of Object.entries(FIELD_TO_PATH)) {
		const element = registry.elementsByPath.get(path);
		if (!element) continue;

		// Check if field is required (cardinality.min >= 1)
		if (element.cardinality.min >= 1 && !headerSet.has(field)) {
			issues.push({
				severity: 'error',
				field,
				message: `Required column "${field}" is missing from CSV`,
				code: 'MISSING_REQUIRED_HEADER',
			});
		}
	}

	return issues;
}

/**
 * Validate a single CSV row against schema constraints and return any validation issues.
 *
 * @param rowIndex - Zero-based index of the row being validated
 * @param registry - SchemaRegistry used to resolve schema elements and rules for validation
 * @returns An array of ValidationIssue objects found for the provided row (empty if none)
 */
function validateRow(row: CSVRow, rowIndex: number, registry: SchemaRegistry): ValidationIssue[] {
	const issues: ValidationIssue[] = [];

	for (const [field, path] of Object.entries(FIELD_TO_PATH)) {
		const element = registry.elementsByPath.get(path);
		if (!element) continue;

		const value = row[field];
		const schemaIssues = validateValue(value, element, {
			rowIndex,
			sourceField: field,
		});

		// Convert schema validation issues to ValidationIssue format
		for (const schemaIssue of schemaIssues) {
			issues.push(convertSchemaIssue(schemaIssue, field, rowIndex));
		}
	}

	return issues;
}

/**
 * Translate a SchemaValidationIssue into a ValidationIssue associated with a CSV field and row.
 *
 * @param schemaIssue - The schema-level validation issue to translate.
 * @param field - The CSV column name to associate with the returned issue.
 * @param rowIndex - The zero-based index of the CSV row where the issue occurred.
 * @returns A ValidationIssue with `severity`, `message`, and `code` taken from `schemaIssue` and `field`/`row` set from the provided arguments.
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
	};
}
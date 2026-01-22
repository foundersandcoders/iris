/** |===================|| Schema Validator ||==================|
 *  | Validates values against SchemaElement constraints.
 *  | Provides detailed validation issues for each constraint type.
 *  |=============================================================|
 */

import type { SchemaElement, SchemaConstraints, XsdBaseType } from './interpreter';
import { isRequired } from './interpreter';
import type { SchemaValidationIssue } from './validation';
import { createIssue } from './validation';

/* <<--------------------------------------------------------------------->> */

interface ValidateValueOptions {
	rowIndex?: number;
	sourceField?: string;
}

/* <<--------------------------------------------------------------------->> */

/**
 * Validate a value against a schema element's constraints
 * @param value - The value to validate (can be undefined/null for presence check)
 * @param element - The schema element defining constraints
 * @param options - Optional context (row index, source field name)
 * @returns Array of validation issues (empty if valid)
 */
export function validateValue(
	value: unknown,
	element: SchemaElement,
	options: ValidateValueOptions = {}
): SchemaValidationIssue[] {
	const issues: SchemaValidationIssue[] = [];
	const { rowIndex, sourceField } = options;

	// Trim strings to detect whitespace-only values as empty
	const trimmedValue = typeof value === 'string' ? value.trim() : value;

	// Check for required value
	if (trimmedValue === undefined || trimmedValue === null || trimmedValue === '') {
		if (isRequired(element)) {
			issues.push(
				createIssue('required', element.path, `Required field "${element.name}" is missing`, {
					rowIndex,
					sourceField,
					element,
				})
			);
		}
		// No further validation needed for missing optional values
		return issues;
	}

	// Validate type
	const typeIssue = validateType(trimmedValue, element.baseType, element, options);
	if (typeIssue) {
		issues.push(typeIssue);
		// If type is wrong, skip constraint validation
		return issues;
	}

	// Apply constraint validators
	const constraints = element.constraints;

	// String constraints
	if (typeof trimmedValue === 'string') {
		if (constraints.pattern) {
			const patternIssue = validatePattern(trimmedValue, constraints.pattern, element, options);
			if (patternIssue) issues.push(patternIssue);
		}

		const lengthIssues = validateLength(trimmedValue, constraints, element, options);
		issues.push(...lengthIssues);

		if (constraints.enumeration) {
			const enumIssue = validateEnumeration(
				trimmedValue,
				constraints.enumeration,
				element,
				options
			);
			if (enumIssue) issues.push(enumIssue);
		}
	}

	// Numeric constraints
	if (typeof trimmedValue === 'number') {
		const rangeIssues = validateRange(trimmedValue, constraints, element, options);
		issues.push(...rangeIssues);
	}

	return issues;
}

/* <<--------------------------------------------------------------------->> */

/**
 * Ensure a value conforms to the schema element's expected XSD base type.
 *
 * @param value - The value to validate
 * @param baseType - The expected XSD base type (e.g., 'string', 'int', 'decimal', 'boolean', 'date', 'dateTime')
 * @param element - Schema element metadata used to construct validation issues (name, path, etc.)
 * @param options - Optional context (rowIndex, sourceField) included in issue metadata
 * @returns A SchemaValidationIssue describing the type mismatch, or `null` if the value matches the expected base type
 */
function validateType(
	value: unknown,
	baseType: XsdBaseType,
	element: SchemaElement,
	options: ValidateValueOptions
): SchemaValidationIssue | null {
	const { rowIndex, sourceField } = options;

	switch (baseType) {
		case 'string':
			// Accept any value as string (will be coerced)
			return null;

		case 'int':
		case 'integer':
		case 'long':
			if (typeof value === 'number') {
				if (!Number.isInteger(value)) {
					return createIssue(
						'type',
						element.path,
						`Field "${element.name}" must be an integer, got decimal ${value}`,
						{ rowIndex, sourceField, element, actualValue: value }
					);
				}
				return null;
			}
			if (typeof value === 'string') {
				const parsed = parseInt(value, 10);
				if (isNaN(parsed) || parsed.toString() !== value.trim()) {
					return createIssue(
						'type',
						element.path,
						`Field "${element.name}" must be an integer, got "${value}"`,
						{ rowIndex, sourceField, element, actualValue: value }
					);
				}
				return null;
			}
			return createIssue('type', element.path, `Field "${element.name}" must be an integer`, {
				rowIndex,
				sourceField,
				element,
				actualValue: value,
			});

		case 'decimal':
			if (typeof value === 'number') return null;
			if (typeof value === 'string') {
				const parsed = parseFloat(value);
				if (isNaN(parsed)) {
					return createIssue(
						'type',
						element.path,
						`Field "${element.name}" must be a decimal number, got "${value}"`,
						{ rowIndex, sourceField, element, actualValue: value }
					);
				}
				return null;
			}
			return createIssue('type', element.path, `Field "${element.name}" must be a decimal number`, {
				rowIndex,
				sourceField,
				element,
				actualValue: value,
			});

		case 'boolean':
			if (typeof value === 'boolean') return null;
			if (typeof value === 'string') {
				const lower = value.toLowerCase();
				if (['true', 'false', '1', '0'].includes(lower)) return null;
			}
			return createIssue(
				'type',
				element.path,
				`Field "${element.name}" must be a boolean, got "${value}"`,
				{ rowIndex, sourceField, element, actualValue: value }
			);

		case 'date':
			if (typeof value === 'string') {
				// ISO date format: YYYY-MM-DD
				if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
					const parsed = Date.parse(value);
					if (!isNaN(parsed)) return null;
				}
			}
			return createIssue(
				'type',
				element.path,
				`Field "${element.name}" must be a date (YYYY-MM-DD), got "${value}"`,
				{ rowIndex, sourceField, element, actualValue: value }
			);

		case 'dateTime':
			if (typeof value === 'string') {
				// ISO dateTime format
				const parsed = Date.parse(value);
				if (!isNaN(parsed)) return null;
			}
			return createIssue(
				'type',
				element.path,
				`Field "${element.name}" must be a dateTime, got "${value}"`,
				{ rowIndex, sourceField, element, actualValue: value }
			);

		default:
			return null;
	}
}

/* <<--------------------------------------------------------------------->> */

/**
 * Ensure a string value matches the provided regular expression pattern.
 *
 * If the value does not match, returns a `pattern` validation issue that includes contextual metadata.
 *
 * @param value - The string to validate
 * @param pattern - The regular expression (without anchors) the value must match
 * @param element - Schema element metadata used to populate the issue (name, path, etc.)
 * @param options - Optional context such as `rowIndex` and `sourceField`
 * @returns A `SchemaValidationIssue` describing the pattern violation, or `null` if the value matches or the pattern is invalid
 */
function validatePattern(
	value: string,
	pattern: string,
	element: SchemaElement,
	options: ValidateValueOptions
): SchemaValidationIssue | null {
	const { rowIndex, sourceField } = options;

	try {
		const regex = new RegExp(`^${pattern}$`);
		if (!regex.test(value)) {
			return createIssue(
				'pattern',
				element.path,
				`Field "${element.name}" value "${value}" does not match pattern "${pattern}"`,
				{
					rowIndex,
					sourceField,
					element,
					actualValue: value,
					constraint: { pattern },
				}
			);
		}
	} catch {
		// Invalid regex pattern - skip validation
		return null;
	}

	return null;
}

/* <<--------------------------------------------------------------------->> */

/**
 * Validate a string's length against an element's minLength and maxLength constraints.
 *
 * @param value - The string to validate
 * @param constraints - Schema constraints that may include `minLength` and/or `maxLength`
 * @param element - Schema element metadata used to populate issue details (name, path)
 * @param options - Validation context (e.g., `rowIndex`, `sourceField`)
 * @returns An array of `SchemaValidationIssue` entries for each violated length constraint; empty if `value` satisfies the length constraints
 */
function validateLength(
	value: string,
	constraints: SchemaConstraints,
	element: SchemaElement,
	options: ValidateValueOptions
): SchemaValidationIssue[] {
	const { rowIndex, sourceField } = options;
	const issues: SchemaValidationIssue[] = [];

	if (constraints.minLength !== undefined && value.length < constraints.minLength) {
		issues.push(
			createIssue(
				'minLength',
				element.path,
				`Field "${element.name}" must be at least ${constraints.minLength} characters, got ${value.length}`,
				{
					rowIndex,
					sourceField,
					element,
					actualValue: value,
					constraint: { minLength: constraints.minLength },
				}
			)
		);
	}

	if (constraints.maxLength !== undefined && value.length > constraints.maxLength) {
		issues.push(
			createIssue(
				'maxLength',
				element.path,
				`Field "${element.name}" must be at most ${constraints.maxLength} characters, got ${value.length}`,
				{
					rowIndex,
					sourceField,
					element,
					actualValue: value,
					constraint: { maxLength: constraints.maxLength },
				}
			)
		);
	}

	return issues;
}

/* <<--------------------------------------------------------------------->> */

/**
 * Validate a numeric value against inclusive and exclusive range constraints.
 *
 * @param value - The numeric value to validate.
 * @param constraints - Schema constraints which may include `minInclusive`, `maxInclusive`, `minExclusive`, and `maxExclusive`.
 * @param element - Schema element metadata used when constructing validation issues.
 * @param options - Optional contextual information (e.g., `rowIndex`, `sourceField`) included in created issues.
 * @returns An array of SchemaValidationIssue objects for each violated range constraint; empty if no violations.
 */
function validateRange(
	value: number,
	constraints: SchemaConstraints,
	element: SchemaElement,
	options: ValidateValueOptions
): SchemaValidationIssue[] {
	const { rowIndex, sourceField } = options;
	const issues: SchemaValidationIssue[] = [];

	if (constraints.minInclusive !== undefined && value < constraints.minInclusive) {
		issues.push(
			createIssue(
				'minInclusive',
				element.path,
				`Field "${element.name}" must be at least ${constraints.minInclusive}, got ${value}`,
				{
					rowIndex,
					sourceField,
					element,
					actualValue: value,
					constraint: { minInclusive: constraints.minInclusive },
				}
			)
		);
	}

	if (constraints.maxInclusive !== undefined && value > constraints.maxInclusive) {
		issues.push(
			createIssue(
				'maxInclusive',
				element.path,
				`Field "${element.name}" must be at most ${constraints.maxInclusive}, got ${value}`,
				{
					rowIndex,
					sourceField,
					element,
					actualValue: value,
					constraint: { maxInclusive: constraints.maxInclusive },
				}
			)
		);
	}

	if (constraints.minExclusive !== undefined && value <= constraints.minExclusive) {
		issues.push(
			createIssue(
				'minExclusive',
				element.path,
				`Field "${element.name}" must be greater than ${constraints.minExclusive}, got ${value}`,
				{
					rowIndex,
					sourceField,
					element,
					actualValue: value,
					constraint: { minExclusive: constraints.minExclusive },
				}
			)
		);
	}

	if (constraints.maxExclusive !== undefined && value >= constraints.maxExclusive) {
		issues.push(
			createIssue(
				'maxExclusive',
				element.path,
				`Field "${element.name}" must be less than ${constraints.maxExclusive}, got ${value}`,
				{
					rowIndex,
					sourceField,
					element,
					actualValue: value,
					constraint: { maxExclusive: constraints.maxExclusive },
				}
			)
		);
	}

	return issues;
}

/* <<--------------------------------------------------------------------->> */

/**
 * Check that a string value is one of the allowed enumeration values.
 *
 * @param value - The string value to validate
 * @param enumeration - The list of allowed string values
 * @param element - Schema element metadata used to build issue context
 * @param options - Optional validation context (e.g., `rowIndex`, `sourceField`)
 * @returns A SchemaValidationIssue describing the enumeration violation, or `null` if the value is allowed
 */
function validateEnumeration(
	value: string,
	enumeration: string[],
	element: SchemaElement,
	options: ValidateValueOptions
): SchemaValidationIssue | null {
	const { rowIndex, sourceField } = options;

	if (!enumeration.includes(value)) {
		return createIssue(
			'enumeration',
			element.path,
			`Field "${element.name}" value "${value}" is not in allowed values: ${enumeration.join(', ')}`,
			{
				rowIndex,
				sourceField,
				element,
				actualValue: value,
				constraint: { enumeration },
			}
		);
	}

	return null;
}
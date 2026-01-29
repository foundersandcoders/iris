/** |===================|| Schema Validation Types ||==================|
 *  | Types for validation results when validating data against a
 *  | schema. These are separate from the existing validator types to
 *  | provide richer context about schema-specific validation failures.
 *  |==================================================================|
 */

import type { SchemaConstraints, SchemaElement } from './interpreterTypes';

export type SchemaValidationSeverity = 'error' | 'warning' | 'info';

export type ConstraintViolationType =
	| 'required' // minOccurs >= 1 but element missing
	| 'pattern' // value doesn't match regex pattern
	| 'minLength' // string too short
	| 'maxLength' // string too long
	| 'minInclusive' // number below minimum
	| 'maxInclusive' // number above maximum
	| 'minExclusive' // number at or below minimum
	| 'maxExclusive' // number at or above maximum
	| 'enumeration' // value not in allowed set
	| 'type' // value doesn't match base type (e.g., "abc" for int)
	| 'cardinality' // wrong number of occurrences
	| 'unexpected' // element not defined in schema
	| 'ordering'; // elements in wrong order (xs:sequence violation)

// |------------------------|| xxx ||-------------------------|

export interface SchemaValidationIssue {
	severity: SchemaValidationSeverity;
	type: ConstraintViolationType;
	message: string;
	code: string;
	elementPath: string;
	dataPath?: string;
	actualValue?: unknown;
	constraint?: Partial<SchemaConstraints>;
	element?: SchemaElement;
	rowIndex?: number;
	sourceField?: string;
}

export interface SchemaValidationResult {
	valid: boolean;
	issues: SchemaValidationIssue[];
	errorCount: number;
	warningCount: number;
	infoCount: number;
	schemaNamespace: string;
	schemaVersion?: string;
	duration?: number;
	validatedPaths?: string[];
}

// |------------------------|| xxx ||-------------------------|

// TODO: Extract `function createIssue()` to util
export function createIssue(
	type: ConstraintViolationType,
	elementPath: string,
	message: string,
	options: Partial<Omit<SchemaValidationIssue, 'type' | 'elementPath' | 'message'>> = {}
): SchemaValidationIssue {
	return {
		severity: options.severity ?? 'error',
		type,
		elementPath,
		message,
		code: options.code ?? `SCHEMA_${type.toUpperCase()}`,
		...options,
	};
}

// TODO: Extract `function createEmptyResult()` to util
export function createEmptyResult(
	schemaNamespace: string,
	schemaVersion?: string
): SchemaValidationResult {
	return {
		valid: true,
		issues: [],
		errorCount: 0,
		warningCount: 0,
		infoCount: 0,
		schemaNamespace,
		schemaVersion,
	};
}

// |------------------------|| xxx ||-------------------------|

// TODO: Extract `function computeResultStats()` to util
export function computeResultStats(
	issues: SchemaValidationIssue[],
	schemaNamespace: string,
	schemaVersion?: string
): SchemaValidationResult {
	const errorCount = issues.filter((i) => i.severity === 'error').length;
	const warningCount = issues.filter((i) => i.severity === 'warning').length;
	const infoCount = issues.filter((i) => i.severity === 'info').length;

	return {
		valid: errorCount === 0,
		issues,
		errorCount,
		warningCount,
		infoCount,
		schemaNamespace,
		schemaVersion,
	};
}

// |------------------------|| CSV -> XML Mapping ||-------------------------|
/** Maps a CSV column to an XSD path in the schema registry */
export interface ColumnMapping {
	/** CSV column header (case-insensitive match) */
	csvColumn: string;
	/** XSD path in dot notation (e.g., "Message.Learner.LearnRefNumber") */
	xsdPath: string;
	/** Optional transformation function applied before validation */
	transform?: string;
	/** Aim group number (1-5) for multi-aim handling (optional) */
	aimNumber?: number;
}

/** Schema reference for mapping compatibility validation */
export interface SchemaReference {
	/** Expected namespace (e.g., "ESFA/ILR/2025-26") */
	namespace: string;
	/** Expected XSD version attribute (e.g., "1.0") */
	version?: string;
	/** Human-readable schema identifier (e.g., "ILR 2025-26") */
	displayName?: string;
}

/** Complete mapping configuration for CSV→ILR conversion */
export interface MappingConfig {
	/** Unique identifier for this mapping (e.g., "fac-airtable-2025") */
	id: string;
	/** Human-readable name */
	name: string;
	/** Mapping version (semver) */
	version: string;
	/** Target ILR schema reference */
	targetSchema: SchemaReference;
	/** Column mappings */
	mappings: ColumnMapping[];
	/** Field to check for aim data presence (supports {n} placeholder for aim number) */
	aimDetectionField?: string;
	/** FAM templates for building LearningDeliveryFAM entries */
	famTemplates?: FamTemplate[];
	/** AppFinRecord templates for building AppFinRecord entries */
	appFinTemplates?: AppFinTemplate[];
	/** Employment status configurations */
	employmentStatuses?: EmploymentStatusConfig[];
}

// |------------------------|| Builder Templates ||-------------------------|
/** Template for generating LearningDeliveryFAM entries from CSV columns */
export interface FamTemplate {
	/** CSV column for FAM type (supports {n} placeholder) */
	typeCsv: string;
	/** CSV column for FAM code (supports {n} placeholder) */
	codeCsv: string;
	/** Optional CSV column for DateFrom (supports {n} placeholder) */
	dateFromCsv?: string;
	/** Optional CSV column for DateTo (supports {n} placeholder) */
	dateToCsv?: string;
}

/** Template for generating AppFinRecord entries from CSV columns */
export interface AppFinTemplate {
	/** CSV column for financial type (supports {n} placeholder) */
	typeCsv: string;
	/** CSV column for financial code (supports {n} placeholder) */
	codeCsv: string;
	/** CSV column for financial date (supports {n} placeholder) */
	dateCsv: string;
	/** CSV column for financial amount (supports {n} placeholder) */
	amountCsv: string;
}

/** Employment status monitoring field configuration */
export interface EsmField {
	/** Exact CSV column name (no {n} placeholder) */
	csvColumn: string;
	/** Derived ESM type constant */
	esmType: string;
	/** Transform to apply to the value */
	transform: string;
}

/** Configuration for a single employment status set */
export interface EmploymentStatusConfig {
	/** CSV column for DateEmpStatApp */
	dateEmpStatAppCsv: string;
	/** CSV column for EmpStat */
	empStatCsv: string;
	/** CSV column for EmpId (optional in XSD) */
	empIdCsv: string;
	/** Array of monitoring fields */
	monitoring: EsmField[];
}

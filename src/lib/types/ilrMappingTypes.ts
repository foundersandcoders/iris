/** |===================|| ILR Mapping Types ||==================|
 *  | Domain-specific mapping types for ILR (Individualised
 *  | Learner Record) schema. Extends the generic MappingConfig
 *  | with ILR-specific builder templates and aim handling.
 *  |=============================================================|
 */

import type { MappingConfig } from './schemaTypes';

// |------------------------|| Builder Templates ||-------------------------|
/** Template for generating LearningDeliveryFAM entries from CSV columns */
export interface FamTemplate {
	/** Constant FAM type value (e.g., 'FFI', 'SOF', 'ACT') - use this OR typeCsv */
	type?: string;
	/** CSV column for FAM type (supports {n} placeholder) - use this OR type */
	typeCsv?: string;
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

// |------------------------|| ILR Mapping Config ||-------------------------|
/** ILR-specific mapping configuration extending the generic MappingConfig */
export interface IlrMappingConfig extends MappingConfig {
	/** Field to check for aim data presence (supports {n} placeholder for aim number) */
	aimDetectionField?: string;
	/** FAM templates for building LearningDeliveryFAM entries */
	famTemplates?: FamTemplate[];
	/** AppFinRecord templates for building AppFinRecord entries */
	appFinTemplates?: AppFinTemplate[];
	/** Employment status configurations */
	employmentStatuses?: EmploymentStatusConfig[];
}

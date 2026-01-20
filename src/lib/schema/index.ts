/** ====== Schema Module ======
 * XSD-driven schema system for dynamic ILR validation and generation.
 * Exports types, utilities, and (eventually) parser/registry/validator.
 */

// === Core Types ===
export type {
	Cardinality,
	XsdBaseType,
	SchemaConstraints,
	SchemaElement,
	NamedSimpleType,
	SchemaRegistry,
	SchemaRegistryOptions,
	ElementLookupResult,
} from './types';

// === Type Utilities ===
export {
	isRequired,
	isRepeatable,
	isOptional,
	DEFAULT_CARDINALITY,
	EMPTY_CONSTRAINTS,
} from './types';

// === Validation Types ===
export type {
	SchemaValidationSeverity,
	ConstraintViolationType,
	SchemaValidationIssue,
	SchemaValidationResult,
} from './validationTypes';

// === Validation Utilities ===
export { createIssue, createEmptyResult, computeResultStats } from './validationTypes';

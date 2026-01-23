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
} from './interpreter';

// === Type Utilities ===
export {
	isRequired,
	isRepeatable,
	isOptional,
	DEFAULT_CARDINALITY,
	EMPTY_CONSTRAINTS,
} from './interpreter';

// === Validation Types ===
export type {
	SchemaValidationSeverity,
	ConstraintViolationType,
	SchemaValidationIssue,
	SchemaValidationResult,
} from './validation';

// === Validation Utilities ===
export { createIssue, createEmptyResult, computeResultStats } from './validation';

// === XSD Parser ===
export {
	parseXsd,
	extractNamespace,
	extractElements,
	extractNamedSimpleTypes,
	extractNamedComplexTypes,
	type RawXsdElement,
	type RawXsdSimpleType,
	type RawXsdComplexType,
	type ParsedXsdRoot,
} from './parser';

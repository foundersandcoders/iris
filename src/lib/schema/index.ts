/** |===================|| Human-Friendly Name ||==================|
 *  | Explanation
 *  |==============================================================|
 */

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
} from './schemaInterpreter';

// === Type Utilities ===
export {
	isRequired,
	isRepeatable,
	isOptional,
	DEFAULT_CARDINALITY,
	EMPTY_CONSTRAINTS,
} from './schemaInterpreter';

// === Validation Types ===
export type {
	SchemaValidationSeverity,
	ConstraintViolationType,
	SchemaValidationIssue,
	SchemaValidationResult,
} from '../types/schemaTypes';

// === Validation Utilities ===
export { createIssue, createEmptyResult, computeResultStats } from '../types/schemaTypes';

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
} from './schemaParser';

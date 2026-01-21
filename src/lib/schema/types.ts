/** === Schema Type Definitions ===
 *
 * Core types for the XSD-driven schema system. These types represent
 * the parsed structure of an XSD file in a form that's useful for
 * validation, generation, and mapping.
 */

/** Cardinality constraints for an element.
 *
 * Derived from `minOccurs`/`maxOccurs` in XSD.
 */
export interface Cardinality {
	min: number;
	max: number;
}

/** XSD base types that we support.
 *
 * Maps to `xs:string`, `xs:int`, `xs:date`, `xs:dateTime`, etc.
 */
export type XsdBaseType =
	| 'string'
	| 'int'
	| 'integer'
	| 'long'
	| 'decimal'
	| 'date'
	| 'dateTime'
	| 'boolean';

/** Constraints that can be applied to a simple type.
 *
 * Derived from `xs:restriction` facets.
 */
export interface SchemaConstraints {
	pattern?: string /* from xs:pattern */;
	minLength?: number /* from xs:minLength */;
	maxLength?: number /* from xs:maxLength */;
	minInclusive?: number /* from xs:minInclusive */;
	maxInclusive?: number /* from xs:maxInclusive */;
	minExclusive?: number /* from xs:minExclusive */;
	maxExclusive?: number /* from xs:maxExclusive */;
	totalDigits?: number /* from xs:totalDigits */;
	fractionDigits?: number /* from xs:fractionDigits */;
	enumeration?: string[] /* from xs:enumeration */;
}

/** A single element in the schema tree.
 *
 * Can be a simple type (leaf) or complex type (has children).
 */
export interface SchemaElement {
	name: string;
	path: string; // from root
	baseType: XsdBaseType;
	constraints: SchemaConstraints;
	cardinality: Cardinality;
	children: SchemaElement[];
	isComplex: boolean;
	documentation?: string; // from xs:annotation/xs:documentation
}

/** A named simple type that can be referenced by elements.
 *
 * E.g., "RestrictedString" in the ILR schema.
 */
export interface NamedSimpleType {
	name: string;
	baseType: XsdBaseType;
	constraints: SchemaConstraints;
}

/** The complete parsed schema */
export interface SchemaRegistry {
	namespace: string; // e.g., "ESFA/ILR/2025-26"
	version?: string; // Schema version
	rootElement: SchemaElement;
	elementsByPath: Map<string, SchemaElement>;
	elementsByName: Map<string, SchemaElement[]>;
	namedTypes: Map<string, NamedSimpleType>;
}

export interface SchemaRegistryOptions {
	includeDocumentation?: boolean;
	resolveNamedTypes?: boolean;
}

export type ElementLookupResult =
	| { found: true; element: SchemaElement }
	| { found: false; error: string };

export function isRequired(element: SchemaElement): boolean {
	return element.cardinality.min >= 1;
}

export function isRepeatable(element: SchemaElement): boolean {
	return element.cardinality.max > 1;
}

export function isOptional(element: SchemaElement): boolean {
	return element.cardinality.min === 0;
}

export const DEFAULT_CARDINALITY: Cardinality = {
	min: 1,
	max: 1,
};

export const EMPTY_CONSTRAINTS: SchemaConstraints = {};

/** |===================|| Schema Interpretation Types ||==================|
 *  | These types represent the parsed structure of an XSD file in a form
 *  | that's useful for validation, generation, and mapping.
 *  |=======================================================================|
 */

export interface Cardinality {
	min: number;
	max: number;
}

export type XsdBaseType =
	| 'string'
	| 'int'
	| 'integer'
	| 'long'
	| 'decimal'
	| 'date'
	| 'dateTime'
	| 'boolean';

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

export interface NamedSimpleType {
	name: string;
	baseType: XsdBaseType;
	constraints: SchemaConstraints;
}

export interface SchemaRegistry {
	/** "ESFA/ILR/2025-26" */
	namespace: string;
	/** XSD schema version attribute (e.g., "1.0") */
	schemaVersion?: string;
	/** Optional: filename of loaded XSD (e.g., "schemafile25.xsd") */
	sourceFile?: string;
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

export const DEFAULT_CARDINALITY: Cardinality = { min: 1, max: 1 };
export const EMPTY_CONSTRAINTS: SchemaConstraints = {};

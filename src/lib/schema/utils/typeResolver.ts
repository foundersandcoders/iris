/** |===================|| Type Resolution ||==================|
 *  | Resolve type references to base XSD types and build named
 *  | type registries.
 *  |===========================================================|
 */

import type { XsdBaseType, NamedSimpleType } from '../interpreter';
import type { RawXsdSimpleType } from '../xsdParser';
import { extractConstraints } from './constraints';

/**
 * Resolve a type reference to its underlying XSD base type.
 *
 * If the reference is undefined or not recognized, defaults to `string`.
 *
 * @param typeRef - Type reference to resolve (e.g., "xs:string" or a named type); may be undefined
 * @param namedTypesMap - Map of named simple types keyed by their declared name
 * @returns The resolved XSD base type; `string` if the reference is undefined or not found
 */
export function resolveBaseType(
	typeRef: string | undefined,
	namedTypesMap: Map<string, NamedSimpleType>
): XsdBaseType {
	if (!typeRef) return 'string';

	if (typeRef.startsWith('xs:')) {
		const baseType = typeRef.slice(3) as XsdBaseType;
		return baseType;
	}

	const namedType = namedTypesMap.get(typeRef);
	if (namedType) {
		return namedType.baseType;
	}

	return 'string';
}

/**
 * Constructs a registry mapping named XSD simple type names to their resolved NamedSimpleType definitions.
 *
 * For each input type, extracts the name, resolves a base XSD type (stripping the "xs:" prefix or using the baseType of a previously defined named type), and extracts constraints; entries without a name are ignored.
 *
 * @param rawSimpleTypes - Array of raw simple type definitions parsed from an XSD
 * @returns A Map where keys are type names and values are their corresponding NamedSimpleType
 */
export function buildNamedTypesMap(
	rawSimpleTypes: RawXsdSimpleType[]
): Map<string, NamedSimpleType> {
	const namedTypes = new Map<string, NamedSimpleType>();

	for (const rawType of rawSimpleTypes) {
		const name = rawType['@_name'];
		if (!name) continue;

		const restriction = rawType['xs:restriction'];
		const baseTypeRef = restriction?.['@_base'];
		const constraints = extractConstraints(restriction);

		let baseType: XsdBaseType = 'string';
		if (baseTypeRef?.startsWith('xs:')) {
			baseType = baseTypeRef.slice(3) as XsdBaseType;
		} else if (baseTypeRef) {
			const referencedType = namedTypes.get(baseTypeRef);
			baseType = referencedType?.baseType ?? 'string';
		}

		namedTypes.set(name, { name, baseType, constraints });
	}

	return namedTypes;
}
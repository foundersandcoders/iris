/** |===================|| Element Builder ||===================|
 *  | Build SchemaElement trees from raw XSD structures and
 *  | populate lookup maps.
 *  |===========================================================|
 */

import type { SchemaElement, NamedSimpleType, SchemaConstraints } from '../interpreter';
import type { RawXsdElement } from '../xsdParser';
import { EMPTY_CONSTRAINTS } from '../interpreter';
import { parseCardinality } from './cardinality';
import { extractConstraints } from './constraints';
import { resolveBaseType } from './typeResolver';

/**
 * Constructs a SchemaElement representing a raw XSD element and its descendants.
 *
 * @param rawElement - Raw XSD element to convert
 * @param parentPath - Parent element path (empty string for root)
 * @param namedTypesMap - Map of named simple types used to resolve type references and inherit constraints
 * @returns The resulting SchemaElement including computed path, cardinality, baseType, constraints, children, and isComplex flag
 */
export function buildElement(
	rawElement: RawXsdElement,
	parentPath: string,
	namedTypesMap: Map<string, NamedSimpleType>
): SchemaElement {
	const name = rawElement['@_name'];
	const path = parentPath ? `${parentPath}/${name}` : name;
	const cardinality = parseCardinality(rawElement);

	let constraints: SchemaConstraints = { ...EMPTY_CONSTRAINTS };

	const hasComplexType = !!rawElement['xs:complexType'];
	const children: SchemaElement[] = [];

	if (rawElement['xs:simpleType']) {
		const restriction = rawElement['xs:simpleType']['xs:restriction'];
		constraints = extractConstraints(restriction);

		const baseTypeRef = restriction?.['@_base'];
		const baseType = resolveBaseType(baseTypeRef, namedTypesMap);

		return {
			name,
			path,
			baseType,
			constraints,
			cardinality,
			children,
			isComplex: false,
		};
	}

	if (hasComplexType) {
		const sequence = rawElement['xs:complexType']?.['xs:sequence'];
		if (sequence?.['xs:element']) {
			const childElements = Array.isArray(sequence['xs:element'])
				? sequence['xs:element']
				: [sequence['xs:element']];

			for (const childElement of childElements) {
				children.push(buildElement(childElement, path, namedTypesMap));
			}
		}

		return {
			name,
			path,
			baseType: 'string',
			constraints: EMPTY_CONSTRAINTS,
			cardinality,
			children,
			isComplex: true,
		};
	}

	const typeRef = rawElement['@_type'];
	const baseType = resolveBaseType(typeRef, namedTypesMap);

	if (typeRef && !typeRef.startsWith('xs:')) {
		const namedType = namedTypesMap.get(typeRef);
		if (namedType) {
			constraints = { ...namedType.constraints };
		}
	}

	return {
		name,
		path,
		baseType,
		constraints,
		cardinality,
		children,
		isComplex: false,
	};
}

/**
 * Populate lookup maps with schema elements keyed by their path and name.
 *
 * @param element - The current SchemaElement to index (root or subtree node)
 * @param elementsByPath - Map receiving entries keyed by `element.path`
 * @param elementsByName - Map receiving arrays of elements grouped by `element.name`
 */
export function populateLookupMaps(
	element: SchemaElement,
	elementsByPath: Map<string, SchemaElement>,
	elementsByName: Map<string, SchemaElement[]>
): void {
	elementsByPath.set(element.path, element);

	const existing = elementsByName.get(element.name) ?? [];
	existing.push(element);
	elementsByName.set(element.name, existing);

	for (const child of element.children) {
		populateLookupMaps(child, elementsByPath, elementsByName);
	}
}
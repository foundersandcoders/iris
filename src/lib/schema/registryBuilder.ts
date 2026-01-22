/** |===================|| Schema Registry Builder ||===================|
 *  | Main orchestrator: transforms raw XSD parser output into a
 *  | queryable SchemaRegistry with full element trees and lookups.
 *  |===================================================================|
 */

import { parseXsd, extractNamespace, extractElements, extractNamedSimpleTypes } from './xsdParser';
import type { SchemaRegistry, SchemaRegistryOptions, SchemaElement } from './interpreter';
import { buildNamedTypesMap } from './utils/typeResolver';
import { buildElement, populateLookupMaps } from './utils/elementBuilder';

/**
 * Create a SchemaRegistry from raw XSD content.
 *
 * Parses the provided XSD, resolves named simple types, builds the element tree,
 * and populates lookup maps for elements by path and by name.
 *
 * @param xsdContent - Raw XSD file content as a string
 * @param options - Optional configuration for registry construction
 * @returns A SchemaRegistry containing `namespace`, `rootElement`, `elementsByPath`, `elementsByName`, and `namedTypes`
 * @throws Error if no root element is found in the XSD
 * @throws Error if the XSD contains more than one root element
 */
export function buildSchemaRegistry(
	xsdContent: string,
	options?: SchemaRegistryOptions
): SchemaRegistry {
	const parsed = parseXsd(xsdContent);
	const namespace = extractNamespace(parsed);
	const rawElements = extractElements(parsed);
	const rawSimpleTypes = extractNamedSimpleTypes(parsed);

	const namedTypes = buildNamedTypesMap(rawSimpleTypes);

	if (rawElements.length === 0) {
		throw new Error('Invalid XSD: no root element found');
	} else if (rawElements.length > 1) {
		throw new Error('Multiple root elements not supported. XSD should have a single root element.');
	}

	const rootElement = buildElement(rawElements[0], '', namedTypes);

	const elementsByPath = new Map<string, SchemaElement>();
	const elementsByName = new Map<string, SchemaElement[]>();

	populateLookupMaps(rootElement, elementsByPath, elementsByName);

	return {
		namespace,
		rootElement,
		elementsByPath,
		elementsByName,
		namedTypes,
	};
}
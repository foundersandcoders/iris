import { describe, it, expect } from 'vitest';
import {
	parseXsd,
	extractNamespace,
	extractElements,
	extractNamedSimpleTypes,
	extractNamedComplexTypes,
} from '../../../src/lib/schema/xsdParser';
import * as fixtures from '../../fixtures/lib/xsdParser';

describe('parseXsd', () => {
	it('should parse minimal valid XSD', () => {
		const result = parseXsd(fixtures.minimalXsd);

		expect(result['xs:schema']).toBeDefined();
		expect(result['xs:schema']['@_targetNamespace']).toBe(fixtures.expectedNamespace);
	});

	it('should throw error if xs:schema root missing', () => {
		const invalidXsd = '<?xml version="1.0"?><root />';

		expect(() => parseXsd(invalidXsd)).toThrow('Invalid XSD: missing xs:schema root element');
	});
});

describe('extractNamespace', () => {
	it('should extract targetNamespace from parsed XSD', () => {
		const parsed = parseXsd(fixtures.minimalXsd);
		const namespace = extractNamespace(parsed);

		expect(namespace).toBe(fixtures.expectedNamespace);
	});

	it('should throw error if targetNamespace missing', () => {
		const xsdWithoutNamespace = `<?xml version="1.0"?>
        <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
          <xs:element name="Test" type="xs:string" />
        </xs:schema>`;

		const parsed = parseXsd(xsdWithoutNamespace);

		expect(() => extractNamespace(parsed)).toThrow(
			'Invalid XSD: missing targetNamespace attribute'
		);
	});
});

describe('extractElements', () => {
	it('should extract single element as array', () => {
		const parsed = parseXsd(fixtures.minimalXsd);
		const elements = extractElements(parsed);

		expect(elements).toHaveLength(1);
		expect(elements[0]['@_name']).toBe('TestElement');
		expect(elements[0]['@_type']).toBe('xs:string');
	});

	it('should extract multiple elements', () => {
		const parsed = parseXsd(fixtures.elementWithCardinality);
		const elements = extractElements(parsed);

		expect(elements).toHaveLength(3);
		expect(elements[0]['@_name']).toBe('OptionalElement');
		expect(elements[1]['@_name']).toBe('RequiredElement');
		expect(elements[2]['@_name']).toBe('RepeatingElement');
	});

	it('should extract minOccurs and maxOccurs attributes', () => {
		const parsed = parseXsd(fixtures.elementWithCardinality);
		const elements = extractElements(parsed);

		const optional = elements[0];
		expect(optional['@_minOccurs']).toBe('0');
		expect(optional['@_maxOccurs']).toBe('1');

		const repeating = elements[2];
		expect(repeating['@_minOccurs']).toBe('0');
		expect(repeating['@_maxOccurs']).toBe('unbounded');
	});

	it('should return empty array if no elements', () => {
		const emptyXsd = `<?xml version="1.0"?>
        <xs:schema targetNamespace="http://test.example.com/2025"
                   xmlns:xs="http://www.w3.org/2001/XMLSchema">
        </xs:schema>`;

		const parsed = parseXsd(emptyXsd);
		const elements = extractElements(parsed);

		expect(elements).toEqual([]);
	});
});

describe('extractNamedSimpleTypes', () => {
	it('should extract named simpleType definitions', () => {
		const parsed = parseXsd(fixtures.namedSimpleType);
		const types = extractNamedSimpleTypes(parsed);

		expect(types).toHaveLength(1);
		expect(types[0]['@_name']).toBe('PostcodeType');
		expect(types[0]['xs:restriction']?.['@_base']).toBe('xs:string');
	});

	it('should return empty array if no named types', () => {
		const parsed = parseXsd(fixtures.minimalXsd);
		const types = extractNamedSimpleTypes(parsed);

		expect(types).toEqual([]);
	});
});

describe('extractNamedComplexTypes', () => {
	it('should return empty array if no named complex types', () => {
		const parsed = parseXsd(fixtures.complexTypeWithSequence);
		const types = extractNamedComplexTypes(parsed);

		// complexTypeWithSequence has inline complexType, not named
		expect(types).toEqual([]);
	});
});

describe('inline type handling', () => {
	it('should parse element with inline simpleType restriction', () => {
		const parsed = parseXsd(fixtures.inlineSimpleType);
		const elements = extractElements(parsed);

		expect(elements).toHaveLength(1);
		expect(elements[0]['@_name']).toBe('RestrictedString');
		expect(elements[0]['xs:simpleType']).toBeDefined();
		expect(elements[0]['xs:simpleType']?.['xs:restriction']?.['@_base']).toBe('xs:string');
	});

	it('should parse element with inline complexType sequence', () => {
		const parsed = parseXsd(fixtures.complexTypeWithSequence);
		const elements = extractElements(parsed);

		expect(elements).toHaveLength(1);
		expect(elements[0]['@_name']).toBe('Person');
		expect(elements[0]['xs:complexType']).toBeDefined();
		expect(elements[0]['xs:complexType']?.['xs:sequence']).toBeDefined();
	});

	it('should extract restriction facets (pattern, minLength, maxLength)', () => {
		const parsed = parseXsd(fixtures.inlineSimpleType);
		const elements = extractElements(parsed);
		const restriction = elements[0]['xs:simpleType']?.['xs:restriction'];

		expect(restriction?.['xs:pattern']?.['@_value']).toBe('[A-Z]{2}[0-9]{4}');
		expect(restriction?.['xs:minLength']?.['@_value']).toBe('6');
		expect(restriction?.['xs:maxLength']?.['@_value']).toBe('6');
	});

	it('should extract enumeration values', () => {
		const parsed = parseXsd(fixtures.enumerationType);
		const elements = extractElements(parsed);
		const restriction = elements[0]['xs:simpleType']?.['xs:restriction'];

		expect(restriction?.['xs:enumeration']).toBeDefined();

		// Handle both single enum (object) and multiple (array)
		const enums = Array.isArray(restriction?.['xs:enumeration'])
			? restriction['xs:enumeration']
			: [restriction?.['xs:enumeration']!];

		expect(enums).toHaveLength(3);
		expect(enums.map((e) => e['@_value'])).toEqual(['Active', 'Inactive', 'Pending']);
	});
});

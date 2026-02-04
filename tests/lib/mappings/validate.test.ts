import { describe, it, expect } from 'vitest';
import { validateMappingStructure } from '../../../src/lib/mappings/validate';
import type { MappingConfig } from '../../../src/lib/types/schemaTypes';

describe('validateMappingStructure', () => {
	const validMapping: MappingConfig = {
		id: 'test-mapping',
		name: 'Test Mapping',
		version: '1.0.0',
		targetSchema: {
			namespace: 'TEST/SCHEMA',
			version: '1.0',
			displayName: 'Test Schema',
		},
		mappings: [
			{
				csvColumn: 'TestColumn',
				xsdPath: 'Test.Path',
			},
		],
	};

	describe('valid mappings', () => {
		it('should validate a complete valid mapping', () => {
			const result = validateMappingStructure(validMapping);

			expect(result.valid).toBe(true);
			expect(result.issues).toHaveLength(0);
		});

		it('should validate mapping with optional fields', () => {
			const mappingWithOptionals: MappingConfig = {
				...validMapping,
				famTemplates: [],
				appFinTemplates: [],
				employmentStatuses: [],
			};

			const result = validateMappingStructure(mappingWithOptionals);

			expect(result.valid).toBe(true);
			expect(result.issues).toHaveLength(0);
		});

		it('should validate mapping with transform and aimNumber', () => {
			const mappingWithExtras: MappingConfig = {
				...validMapping,
				mappings: [
					{
						csvColumn: 'TestColumn',
						xsdPath: 'Test.Path',
						transform: 'trim',
						aimNumber: 1,
					},
				],
			};

			const result = validateMappingStructure(mappingWithExtras);

			expect(result.valid).toBe(true);
			expect(result.issues).toHaveLength(0);
		});
	});

	describe('invalid top-level fields', () => {
		it('should reject non-object input', () => {
			const result = validateMappingStructure('not an object');

			expect(result.valid).toBe(false);
			expect(result.issues).toHaveLength(1);
			expect(result.issues[0].field).toBe('mapping');
			expect(result.issues[0].message).toBe('Mapping must be an object');
		});

		it('should reject null input', () => {
			const result = validateMappingStructure(null);

			expect(result.valid).toBe(false);
			expect(result.issues).toHaveLength(1);
		});

		it('should reject missing id', () => {
			const { id, ...invalid } = validMapping;
			const result = validateMappingStructure(invalid);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'id')).toBe(true);
		});

		it('should reject empty id', () => {
			const result = validateMappingStructure({ ...validMapping, id: '' });

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'id')).toBe(true);
		});

		it('should reject missing name', () => {
			const { name, ...invalid } = validMapping;
			const result = validateMappingStructure(invalid);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'name')).toBe(true);
		});

		it('should reject missing version', () => {
			const { version, ...invalid } = validMapping;
			const result = validateMappingStructure(invalid);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'version')).toBe(true);
		});
	});

	describe('targetSchema validation', () => {
		it('should reject missing targetSchema', () => {
			const { targetSchema, ...invalid } = validMapping;
			const result = validateMappingStructure(invalid);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'targetSchema')).toBe(true);
		});

		it('should reject targetSchema without namespace', () => {
			const invalid = {
				...validMapping,
				targetSchema: { version: '1.0' },
			};
			const result = validateMappingStructure(invalid);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'targetSchema.namespace')).toBe(true);
		});

		it('should reject targetSchema with non-string version', () => {
			const invalid = {
				...validMapping,
				targetSchema: {
					namespace: 'TEST',
					version: 123,
				},
			};
			const result = validateMappingStructure(invalid);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'targetSchema.version')).toBe(true);
		});
	});

	describe('mappings array validation', () => {
		it('should reject missing mappings', () => {
			const { mappings, ...invalid } = validMapping;
			const result = validateMappingStructure(invalid);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'mappings')).toBe(true);
		});

		it('should reject empty mappings array', () => {
			const result = validateMappingStructure({ ...validMapping, mappings: [] });

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'mappings')).toBe(true);
		});

		it('should reject mapping without csvColumn', () => {
			const invalid = {
				...validMapping,
				mappings: [{ xsdPath: 'Test.Path' }],
			};
			const result = validateMappingStructure(invalid);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'mappings[0].csvColumn')).toBe(true);
		});

		it('should reject mapping without xsdPath', () => {
			const invalid = {
				...validMapping,
				mappings: [{ csvColumn: 'TestColumn' }],
			};
			const result = validateMappingStructure(invalid);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'mappings[0].xsdPath')).toBe(true);
		});

		it('should reject mapping with empty csvColumn', () => {
			const invalid = {
				...validMapping,
				mappings: [{ csvColumn: '', xsdPath: 'Test.Path' }],
			};
			const result = validateMappingStructure(invalid);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'mappings[0].csvColumn')).toBe(true);
		});
	});

	describe('optional fields validation', () => {
		it('should reject non-array famTemplates', () => {
			const invalid = {
				...validMapping,
				famTemplates: 'not an array',
			};
			const result = validateMappingStructure(invalid);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'famTemplates')).toBe(true);
		});

		it('should reject non-array appFinTemplates', () => {
			const invalid = {
				...validMapping,
				appFinTemplates: 'not an array',
			};
			const result = validateMappingStructure(invalid);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'appFinTemplates')).toBe(true);
		});

		it('should reject non-array employmentStatuses', () => {
			const invalid = {
				...validMapping,
				employmentStatuses: 'not an array',
			};
			const result = validateMappingStructure(invalid);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'employmentStatuses')).toBe(true);
		});
	});

	describe('multiple errors', () => {
		it('should collect multiple validation errors', () => {
			const invalid = {
				id: '',
				name: '',
				version: '',
				targetSchema: null,
				mappings: [],
			};
			const result = validateMappingStructure(invalid);

			expect(result.valid).toBe(false);
			expect(result.issues.length).toBeGreaterThan(3);
		});
	});
});

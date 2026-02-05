import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { tmpdir } from 'os';
import { rm } from 'fs/promises';
import { createStorage } from '$lib/storage';
import { validateMappingCompatibility } from '../../../src/lib/mappings/compatibility';
import { facAirtableMapping } from '../../../src/lib/mappings/fac-airtable-2025';
import type { MappingConfig } from '../../../src/lib/types/schemaTypes';

describe('mappings/compatibility', () => {
	let testRoot: string;
	let storage: ReturnType<typeof createStorage>;

	beforeEach(async () => {
		testRoot = join(tmpdir(), `iris-compat-test-${Date.now()}`);
		storage = createStorage({
			outputDir: join(testRoot, 'output'),
			internalRoot: join(testRoot, '.iris'),
		});

		const initResult = await storage.init();
		expect(initResult.success).toBe(true);
	});

	afterEach(async () => {
		await rm(testRoot, { recursive: true, force: true });
	});

	describe('validateMappingCompatibility', () => {
		it('should pass for compatible mapping against bundled schema', async () => {
			const result = await validateMappingCompatibility({
				mapping: facAirtableMapping,
				schemaFile: 'schemafile25.xsd',
				storage,
			});

			expect(result.success).toBe(true);
			expect(result.compatibility).toBeDefined();
			if (result.compatibility) {
				expect(result.compatibility.compatible).toBe(true);
				expect(result.compatibility.errors).toHaveLength(0);
			}
		});

		it('should fail for mapping with fake xsdPaths', async () => {
			const fakeMapping: MappingConfig = {
				id: 'fake-mapping',
				name: 'Fake Mapping',
				mappingVersion: '1.0.0',
				targetSchema: {
					namespace: 'ESFA/ILR/2025-26',
					version: '1.0',
				},
				mappings: [
					{
						csvColumn: 'FakeColumn',
						xsdPath: 'Message.Fake.Path.That.Does.Not.Exist',
					},
				],
			};

			const result = await validateMappingCompatibility({
				mapping: fakeMapping,
				schemaFile: 'schemafile25.xsd',
				storage,
			});

			expect(result.success).toBe(true);
			expect(result.compatibility).toBeDefined();
			if (result.compatibility) {
				expect(result.compatibility.compatible).toBe(false);
				expect(result.compatibility.errors.length).toBeGreaterThan(0);
			}
		});

		it('should fail for mapping with wrong namespace', async () => {
			const wrongNamespaceMapping: MappingConfig = {
				...facAirtableMapping,
				targetSchema: {
					...facAirtableMapping.targetSchema,
					namespace: 'WRONG/NAMESPACE',
				},
			};

			const result = await validateMappingCompatibility({
				mapping: wrongNamespaceMapping,
				schemaFile: 'schemafile25.xsd',
				storage,
			});

			expect(result.success).toBe(true);
			expect(result.compatibility).toBeDefined();
			if (result.compatibility) {
				expect(result.compatibility.compatible).toBe(false);
				expect(result.compatibility.errors.some((e) => e.includes('Namespace mismatch'))).toBe(
					true
				);
			}
		});

		it('should return error for nonexistent schema file', async () => {
			const result = await validateMappingCompatibility({
				mapping: facAirtableMapping,
				schemaFile: 'nonexistent.xsd',
				storage,
			});

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error).toContain('Failed to load schema');
		});
	});
});

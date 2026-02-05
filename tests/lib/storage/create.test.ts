/** |===================|| Storage Tests ||==================|
 *  | Tests for storage abstraction layer.
 *  |=========================================================|
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { tmpdir } from 'os';
import { rm, writeFile } from 'fs/promises';
import { createStorage } from '$lib/storage';
import * as fixtures from '../../fixtures/storage';

describe('IrisStorage', () => {
	let testRoot: string;
	let storage: ReturnType<typeof createStorage>;

	beforeEach(async () => {
		// Create unique temp directory for each test
		testRoot = join(tmpdir(), `iris-storage-test-${Date.now()}`);
		storage = createStorage({
			outputDir: join(testRoot, 'output'),
			internalRoot: join(testRoot, '.iris'), // Override internal path for isolation
		});

		// Initialize storage (creates directories)
		const initResult = await storage.init();
		expect(initResult.success).toBe(true);
	});

	afterEach(async () => {
		// Clean up test directory
		await rm(testRoot, { recursive: true, force: true });
	});

	describe('init', () => {
		it('creates all required directories', async () => {
			const { paths } = storage;
			const { stat } = await import('fs/promises');

			// Check internal directories exist
			const internalStat = await stat(paths.internal);
			expect(internalStat.isDirectory()).toBe(true);

			const mappingsStat = await stat(paths.mappings);
			expect(mappingsStat.isDirectory()).toBe(true);

			const schemasStat = await stat(paths.schemas);
			expect(schemasStat.isDirectory()).toBe(true);

			const historyStat = await stat(paths.history);
			expect(historyStat.isDirectory()).toBe(true);

			const reportsStat = await stat(paths.reports);
			expect(reportsStat.isDirectory()).toBe(true);

			// Check output directories
			const outputStat = await stat(paths.output);
			expect(outputStat.isDirectory()).toBe(true);

			const submissionsStat = await stat(paths.submissions);
			expect(submissionsStat.isDirectory()).toBe(true);
		});
	});

	describe('config', () => {
		it('returns default config when file does not exist', async () => {
			const result = await storage.loadConfig();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.provider.ukprn).toBe(fixtures.defaultConfig.provider.ukprn);
				expect(result.data.provider.name).toBe(fixtures.defaultConfig.provider.name);
			}
		});

		it('saves and loads config round-trip', async () => {
			const saveResult = await storage.saveConfig(fixtures.customConfig);
			expect(saveResult.success).toBe(true);

			const loadResult = await storage.loadConfig();
			expect(loadResult.success).toBe(true);
			if (loadResult.success) {
				expect(loadResult.data).toEqual(fixtures.customConfig);
			}
		});

		it('handles invalid JSON gracefully', async () => {
			// Write malformed JSON to config file
			await Bun.write(storage.paths.config, fixtures.malformedConfigJson);

			const result = await storage.loadConfig();
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe('INVALID_JSON');
			}
		});

		it('validates config structure on load', async () => {
			// Write valid JSON but invalid config structure
			const invalidConfig = {
				provider: { ukprn: 123 }, // Too few digits
				submission: {},
				activeSchema: '', // Empty
				activeMapping: '', // Empty
				configVersion: 1,
			};
			await Bun.write(storage.paths.config, JSON.stringify(invalidConfig));

			const result = await storage.loadConfig();
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe('INVALID_JSON');
				expect(result.error.message).toContain('Invalid config');
			}
		});
	});

	describe('mappings', () => {
		it('includes bundled fac-airtable-2025 mapping', async () => {
			const result = await storage.listMappings();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toContain('fac-airtable-2025');
			}
		});

		it('loads bundled mapping by id', async () => {
			const result = await storage.loadMapping('fac-airtable-2025');

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.id).toBe('fac-airtable-2025');
				expect(result.data.name).toBe('Founders and Coders Airtable Export (2025-26)');
			}
		});

		it('saves and loads custom mapping', async () => {
			const saveResult = await storage.saveMapping(fixtures.customMapping);
			expect(saveResult.success).toBe(true);

			const loadResult = await storage.loadMapping('custom-test');
			expect(loadResult.success).toBe(true);
			if (loadResult.success) {
				expect(loadResult.data).toEqual(fixtures.customMapping);
			}
		});

		it('lists both bundled and user mappings', async () => {
			// Save a user mapping
			await storage.saveMapping(fixtures.userMapping);

			const result = await storage.listMappings();
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toContain('fac-airtable-2025');
				expect(result.data).toContain('user-mapping');
			}
		});

		it('returns error for non-existent mapping', async () => {
			const result = await storage.loadMapping('non-existent');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe('NOT_FOUND');
			}
		});

		it('rejects user mapping with invalid structure', async () => {
			// Save invalid mapping directly to bypass saveMapping validation
			const invalidPath = join(testRoot, '.iris', 'mappings', 'invalid.json');
			await writeFile(invalidPath, JSON.stringify(fixtures.invalidMappingStructure));

			const result = await storage.loadMapping('invalid');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe('INVALID_JSON');
				expect(result.error.message).toContain('Invalid mapping structure');
			}
		});

		it('rejects user mapping with empty mappings array', async () => {
			const emptyMapping = {
				...fixtures.userMapping,
				mappings: [],
			};
			const emptyPath = join(testRoot, '.iris', 'mappings', 'empty.json');
			await writeFile(emptyPath, JSON.stringify(emptyMapping));

			const result = await storage.loadMapping('empty');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe('INVALID_JSON');
				expect(result.error.message).toContain('mappings');
			}
		});

		it('rejects saving a mapping with bundled mapping ID', async () => {
			const result = await storage.saveMapping(fixtures.bundledIdMapping);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe('ALREADY_EXISTS');
				expect(result.error.message).toContain('fac-airtable-2025');
			}
		});

		it('rejects saving a mapping with invalid structure', async () => {
			const result = await storage.saveMapping(fixtures.invalidMappingStructure);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe('INVALID_STRUCTURE');
				expect(result.error.message).toContain('id');
			}
		});

		it('saves mapping even if init() was not called (ensureDir fallback)', async () => {
			// Create fresh storage WITHOUT calling init()
			const freshRoot = join(tmpdir(), `iris-no-init-${Date.now()}`);
			const freshStorage = createStorage({
				outputDir: join(freshRoot, 'output'),
				internalRoot: join(freshRoot, '.iris'),
			});

			const result = await freshStorage.saveMapping(fixtures.customMapping);
			expect(result.success).toBe(true);

			// Verify the file was actually written
			const loadResult = await freshStorage.loadMapping('custom-test');
			expect(loadResult.success).toBe(true);

			// Cleanup
			await rm(freshRoot, { recursive: true, force: true });
		});

		it('returns only bundled mappings when directory is empty', async () => {
			// Directory is already empty in beforeEach (only init() called, no saves)
			const result = await storage.listMappings();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(['fac-airtable-2025']);
			}
		});

		it('handles non-JSON files in mappings directory gracefully', async () => {
			// Write a non-JSON file into mappings dir
			await writeFile(join(testRoot, '.iris', 'mappings', 'readme.txt'), 'not a mapping');

			const result = await storage.listMappings();
			expect(result.success).toBe(true);
			if (result.success) {
				// Should not include .txt file (pattern filter is *.json)
				expect(result.data).not.toContain('readme');
				expect(result.data).toContain('fac-airtable-2025');
			}
		});
	});

	describe('schemas', () => {
		it('loads bundled schema from docs/schemas/', async () => {
			const result = await storage.loadSchema('schemafile25.xsd');

			expect(result.success).toBe(true);
			if (result.success) {
				// XSD starts with a comment, not XML declaration
				expect(result.data).toContain('xs:schema');
				expect(result.data).toContain('ESFA/ILR/2025-26');
			}
		});

		it('user schema takes precedence over bundled', async () => {
			// Create a user schema with same name
			await Bun.write(join(storage.paths.schemas, 'schemafile25.xsd'), fixtures.userSchemaContent);

			const result = await storage.loadSchema('schemafile25.xsd');
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toContain('USER VERSION');
			}
		});

		it('lists schemas from both locations', async () => {
			// Add a user schema
			await Bun.write(join(storage.paths.schemas, 'custom.xsd'), fixtures.customSchemaContent);

			const result = await storage.listSchemas();
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toContain('schemafile25.xsd'); // bundled
				expect(result.data).toContain('custom.xsd'); // user
			}
		});

		it('returns error for non-existent schema', async () => {
			const result = await storage.loadSchema('non-existent.xsd');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe('NOT_FOUND');
			}
		});
	});

	describe('submissions', () => {
		it('saves submission with timestamped filename', async () => {
			const result = await storage.saveSubmission(fixtures.sampleXml);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toContain('ILR-');
				expect(result.data).toContain('.xml');

				// Verify file exists
				const fileExists = await Bun.file(result.data).exists();
				expect(fileExists).toBe(true);
			}
		});

		it('saves submission with metadata', async () => {
			const result = await storage.saveSubmission(fixtures.sampleXml, fixtures.sampleMetadata);
			expect(result.success).toBe(true);

			if (result.success) {
				// Check metadata file exists
				const metadataPath = `${result.data}.meta.json`;
				const metadataExists = await Bun.file(metadataPath).exists();
				expect(metadataExists).toBe(true);

				// Verify metadata content
				const savedMetadata = await Bun.file(metadataPath).json();
				expect(savedMetadata).toEqual(fixtures.sampleMetadata);
			}
		});

		it('lists submissions sorted by modification date (newest first)', async () => {
			// Save multiple submissions with delays to ensure different timestamps
			await storage.saveSubmission(fixtures.sampleXmlWithContent(1));
			await new Promise((resolve) => setTimeout(resolve, 10));
			await storage.saveSubmission(fixtures.sampleXmlWithContent(2));
			await new Promise((resolve) => setTimeout(resolve, 10));
			await storage.saveSubmission(fixtures.sampleXmlWithContent(3));

			const result = await storage.listSubmissions();
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.length).toBe(3);
				// Newest should be first
				expect(result.data[0].modified.getTime()).toBeGreaterThanOrEqual(
					result.data[1].modified.getTime()
				);
				expect(result.data[1].modified.getTime()).toBeGreaterThanOrEqual(
					result.data[2].modified.getTime()
				);
			}
		});

		it('returns empty array when no submissions exist', async () => {
			const result = await storage.listSubmissions();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual([]);
			}
		});
	});

	describe('history', () => {
		it('returns empty history when file does not exist', async () => {
			const result = await storage.loadHistory();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.formatVersion).toBe(1);
				expect(result.data.submissions).toEqual([]);
			}
		});

		it('appends entry to history', async () => {
			const appendResult = await storage.appendHistory(fixtures.historyEntryWithRefs);
			expect(appendResult.success).toBe(true);

			const loadResult = await storage.loadHistory();
			expect(loadResult.success).toBe(true);
			if (loadResult.success) {
				expect(loadResult.data.submissions).toHaveLength(1);
				expect(loadResult.data.submissions[0]).toEqual(fixtures.historyEntryWithRefs);
			}
		});

		it('maintains multiple history entries', async () => {
			// Fresh storage instance for this test to avoid contamination
			const freshTestRoot = join(tmpdir(), `iris-storage-test-history-${Date.now()}`);
			const freshStorage = createStorage({
				outputDir: join(freshTestRoot, 'output'),
				internalRoot: join(freshTestRoot, '.iris'),
			});
			await freshStorage.init();

			await freshStorage.appendHistory(fixtures.historyEntry1);
			await freshStorage.appendHistory(fixtures.historyEntry2);

			const result = await freshStorage.loadHistory();
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.submissions).toHaveLength(2);
				expect(result.data.submissions).toEqual([fixtures.historyEntry1, fixtures.historyEntry2]);
			}

			// Cleanup
			await rm(freshTestRoot, { recursive: true, force: true });
		});
	});

	describe('error handling', () => {
		it('propagates StorageError types correctly', async () => {
			const result = await storage.loadMapping('non-existent');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(Error);
				expect(result.error.name).toBe('StorageError');
				expect(result.error.code).toBe('NOT_FOUND');
			}
		});
	});
});

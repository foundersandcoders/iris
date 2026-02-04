/** |===================|| Config Tests ||==================|
 *  | Test configuration types and storage integration
 *  |======================================================|
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { tmpdir } from 'os';
import { rm } from 'fs/promises';
import { createStorage } from '$lib/storage';
import {
	validateConfig,
	DEFAULT_CONFIG,
	type IrisConfig,
	type ProviderConfig,
	type SubmissionConfig,
} from '$lib/types/configTypes';
import packageJson from '../../../package.json';

describe('config types', () => {
	let testRoot: string;
	let storage: ReturnType<typeof createStorage>;

	beforeEach(async () => {
		// Create unique temp directory for each test
		testRoot = join(tmpdir(), `iris-config-test-${Date.now()}`);
		storage = createStorage({
			internalRoot: join(testRoot, '.iris'),
		});

		const initResult = await storage.init();
		expect(initResult.success).toBe(true);
	});

	afterEach(async () => {
		// Clean up test directory
		await rm(testRoot, { recursive: true, force: true });
	});

	describe('loadConfig via storage', () => {
		it('returns a valid IrisConfig object', async () => {
			const result = await storage.loadConfig();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toBeDefined();
				expect(result.data.provider).toBeDefined();
				expect(result.data.submission).toBeDefined();
			}
		});

		it('returns provider config with default UKPRN', async () => {
			const result = await storage.loadConfig();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.provider.ukprn).toBe(10000000);
				expect(result.data.provider.name).toBe('Founders and Coders');
			}
		});

		it('returns submission metadata', async () => {
			const result = await storage.loadConfig();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.submission.softwareSupplier).toBe('Founders and Coders');
				expect(result.data.submission.softwarePackage).toBe('Iris');
			}
		});

		it('returns consistent results across multiple calls', async () => {
			const result1 = await storage.loadConfig();
			const result2 = await storage.loadConfig();

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);
			if (result1.success && result2.success) {
				expect(result1.data.provider.ukprn).toBe(result2.data.provider.ukprn);
				expect(result1.data.submission.softwarePackage).toBe(result2.data.submission.softwarePackage);
			}
		});

		it('outputDir is optional in default config', async () => {
			const result = await storage.loadConfig();

			expect(result.success).toBe(true);

			if (result.success) expect(result.data.outputDir).toBeUndefined();
		});

		it('has configVersion in default config', async () => {
			const result = await storage.loadConfig();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.configVersion).toBe(1);
			}
		});

		it('has activeSchema in default config', async () => {
			const result = await storage.loadConfig();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.activeSchema).toBe('schemafile25.xsd');
			}
		});

		it('has activeMapping in default config', async () => {
			const result = await storage.loadConfig();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.activeMapping).toBe('fac-airtable-2025');
			}
		});

		it('has collection in default config', async () => {
			const result = await storage.loadConfig();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.collection).toBe('ILR');
			}
		});

		it('has serialNo in default config', async () => {
			const result = await storage.loadConfig();

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.serialNo).toBe('01');
			}
		});
	});

	describe('type validation', () => {
		it('accepts valid ProviderConfig', () => {
			const provider: ProviderConfig = {
				ukprn: 12345678,
				name: 'Test Provider',
			};

			expect(provider.ukprn).toBeTypeOf('number');
			expect(provider.name).toBeTypeOf('string');
		});

		it('accepts ProviderConfig without optional name', () => {
			const provider: ProviderConfig = {
				ukprn: 12345678,
			};

			expect(provider.ukprn).toBe(12345678);
			expect(provider.name).toBeUndefined();
		});

		it('accepts valid SubmissionConfig', () => {
			const submission: SubmissionConfig = {
				softwareSupplier: 'Test Supplier',
				softwarePackage: 'Test Package',
			};

			expect(submission.softwareSupplier).toBe('Test Supplier');
			expect(submission.softwarePackage).toBe('Test Package');
		});

		it('accepts SubmissionConfig with all fields optional', () => {
			const submission: SubmissionConfig = {};

			expect(submission.softwareSupplier).toBeUndefined();
			expect(submission.softwarePackage).toBeUndefined();
		});

		it('accepts valid IrisConfig', () => {
			const config: IrisConfig = {
				configVersion: 1,
				provider: {
					ukprn: 12345678,
					name: 'Test',
				},
				submission: {
					softwareSupplier: 'Test',
				},
				activeSchema: 'schemafile25.xsd',
				activeMapping: 'fac-airtable-2025',
				collection: 'ILR',
				serialNo: '01',
				outputDir: '/path/to/output',
			};

			expect(config.provider.ukprn).toBe(12345678);
			expect(config.activeSchema).toBe('schemafile25.xsd');
			expect(config.outputDir).toBe('/path/to/output');
		});
	});

	describe('UKPRN validation', () => {
		it('default UKPRN is in valid range', async () => {
			const result = await storage.loadConfig();

			expect(result.success).toBe(true);
			if (result.success) {
				const ukprn = result.data.provider.ukprn;
				expect(ukprn).toBeGreaterThanOrEqual(10000000);
				expect(ukprn).toBeLessThanOrEqual(99999999);
			}
		});

		it('UKPRN is exactly 8 digits', async () => {
			const result = await storage.loadConfig();

			expect(result.success).toBe(true);
			if (result.success) {
				const ukprn = result.data.provider.ukprn.toString();
				expect(ukprn).toHaveLength(8);
			}
		});
	});

	describe('validateConfig', () => {
		it('accepts valid config', () => {
			const result = validateConfig(DEFAULT_CONFIG);

			expect(result.valid).toBe(true);
			expect(result.issues).toHaveLength(0);
		});

		it('rejects non-object config', () => {
			const result = validateConfig('not an object');

			expect(result.valid).toBe(false);
			expect(result.issues).toHaveLength(1);
			expect(result.issues[0].field).toBe('config');
		});

		it('rejects null config', () => {
			const result = validateConfig(null);

			expect(result.valid).toBe(false);
			expect(result.issues[0].field).toBe('config');
		});

		it('rejects invalid configVersion', () => {
			const invalidConfig = { ...DEFAULT_CONFIG, configVersion: 0 };
			const result = validateConfig(invalidConfig);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'configVersion')).toBe(true);
		});

		it('rejects non-integer configVersion', () => {
			const invalidConfig = { ...DEFAULT_CONFIG, configVersion: 1.5 };
			const result = validateConfig(invalidConfig);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'configVersion')).toBe(true);
		});

		it('rejects non-8-digit UKPRN', () => {
			const invalidConfig = {
				...DEFAULT_CONFIG,
				provider: { ukprn: 123, name: 'Test' },
			};
			const result = validateConfig(invalidConfig);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'provider.ukprn')).toBe(true);
		});

		it('rejects empty activeSchema', () => {
			const invalidConfig = { ...DEFAULT_CONFIG, activeSchema: '' };
			const result = validateConfig(invalidConfig);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'activeSchema')).toBe(true);
		});

		it('rejects empty activeMapping', () => {
			const invalidConfig = { ...DEFAULT_CONFIG, activeMapping: '   ' };
			const result = validateConfig(invalidConfig);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'activeMapping')).toBe(true);
		});

		it('rejects invalid collection length', () => {
			const invalidConfig = { ...DEFAULT_CONFIG, collection: 'ILRR' };
			const result = validateConfig(invalidConfig);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'collection')).toBe(true);
		});

		it('rejects invalid serialNo length', () => {
			const invalidConfig = { ...DEFAULT_CONFIG, serialNo: '1' };
			const result = validateConfig(invalidConfig);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.field === 'serialNo')).toBe(true);
		});

		it('accepts valid optional fields', () => {
			const config = {
				...DEFAULT_CONFIG,
				collection: 'ABC',
				serialNo: '99',
				outputDir: '/custom/path',
			};
			const result = validateConfig(config);

			expect(result.valid).toBe(true);
			expect(result.issues).toHaveLength(0);
		});

		it('reports multiple validation issues', () => {
			const invalidConfig = {
				configVersion: -1,
				provider: { ukprn: 123 },
				submission: {},
				activeSchema: '',
				activeMapping: '',
				collection: 'TOOLONG',
				serialNo: '1',
			};
			const result = validateConfig(invalidConfig);

			expect(result.valid).toBe(false);
			expect(result.issues.length).toBeGreaterThan(1);
		});
	});
});

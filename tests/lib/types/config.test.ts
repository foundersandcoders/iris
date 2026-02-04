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
				expect(result.data.submission.release).toBe(packageJson.version);
			}
		});

		it('returns consistent results across multiple calls', async () => {
			const result1 = await storage.loadConfig();
			const result2 = await storage.loadConfig();

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);
			if (result1.success && result2.success) {
				expect(result1.data.provider.ukprn).toBe(result2.data.provider.ukprn);
				expect(result1.data.submission.release).toBe(result2.data.submission.release);
			}
		});

		it('outputDir is optional in default config', async () => {
			const result = await storage.loadConfig();

			expect(result.success).toBe(true);

			if (result.success) expect(result.data.outputDir).toBeUndefined();
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
				release: '2.0.0',
			};

			expect(submission.softwareSupplier).toBe('Test Supplier');
			expect(submission.softwarePackage).toBe('Test Package');
			expect(submission.release).toBe('2.0.0');
		});

		it('accepts SubmissionConfig with all fields optional', () => {
			const submission: SubmissionConfig = {};

			expect(submission.softwareSupplier).toBeUndefined();
			expect(submission.softwarePackage).toBeUndefined();
			expect(submission.release).toBeUndefined();
		});

		it('accepts valid IrisConfig', () => {
			const config: IrisConfig = {
				provider: {
					ukprn: 12345678,
					name: 'Test',
				},
				submission: {
					softwareSupplier: 'Test',
				},
				columnMapping: {
					'CSV Column': 'XSD.Path',
				},
				outputDir: '/path/to/output',
			};

			expect(config.provider.ukprn).toBe(12345678);
			expect(config.columnMapping?.['CSV Column']).toBe('XSD.Path');
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
});

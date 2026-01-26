/** |===================|| Config Tests ||==================|
 *  | Test configuration types and stub implementation
 *  |======================================================|
 */
import { describe, it, expect } from 'vitest';
import {
	getConfig,
	type IrisConfig,
	type ProviderConfig,
	type SubmissionConfig,
} from '$lib/types/config';

describe('config types', () => {
	describe('getConfig', () => {
		it('returns a valid IrisConfig object', () => {
			const config = getConfig();

			expect(config).toBeDefined();
			expect(config.provider).toBeDefined();
			expect(config.submission).toBeDefined();
		});

		it('returns provider config with placeholder UKPRN', () => {
			const config = getConfig();

			expect(config.provider.ukprn).toBe(10000000);
			expect(config.provider.name).toBe('Founders and Coders');
		});

		it('returns submission metadata', () => {
			const config = getConfig();

			expect(config.submission.softwareSupplier).toBe('Founders and Coders');
			expect(config.submission.softwarePackage).toBe('Iris');
			expect(config.submission.release).toBe('1.3.0');
		});

		it('returns consistent results across multiple calls', () => {
			const config1 = getConfig();
			const config2 = getConfig();

			expect(config1.provider.ukprn).toBe(config2.provider.ukprn);
			expect(config1.submission.release).toBe(config2.submission.release);
		});

		it('has no column mapping in stub implementation', () => {
			const config = getConfig();

			expect(config.columnMapping).toBeUndefined();
		});

		it('has no output directory in stub implementation', () => {
			const config = getConfig();

			expect(config.outputDir).toBeUndefined();
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
		it('placeholder UKPRN is in valid range', () => {
			const config = getConfig();
			const ukprn = config.provider.ukprn;

			expect(ukprn).toBeGreaterThanOrEqual(10000000);
			expect(ukprn).toBeLessThanOrEqual(99999999);
		});

		it('UKPRN is exactly 8 digits', () => {
			const config = getConfig();
			const ukprn = config.provider.ukprn.toString();

			expect(ukprn).toHaveLength(8);
		});
	});
});

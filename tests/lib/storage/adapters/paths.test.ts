/** |===================|| Paths Tests ||==================|
 *  | Tests for storage path construction utilities.
 *  | Note: Comprehensive path testing occurs in storage.test.ts
 *  |=======================================================|
 */
import { describe, it, expect } from 'vitest';
import { getStoragePaths, getDefaultOutputDir } from '$lib/utils/storage/paths';
import { join } from 'path';

describe('Storage Paths', () => {
	describe('getDefaultOutputDir', () => {
		it('returns a default output directory path', () => {
			const result = getDefaultOutputDir();
			expect(result).toContain('Iris');
		});
	});

	describe('getStoragePaths', () => {
		it('constructs all required storage paths', () => {
			const paths = getStoragePaths();

			expect(paths.internal).toContain('.iris');
			expect(paths.config).toContain('config.json');
			expect(paths.mappings).toContain('mappings');
			expect(paths.schemas).toContain('schemas');
			expect(paths.history).toContain('history');
			expect(paths.reports).toContain('reports');
			expect(paths.output).toBeDefined();
			expect(paths.submissions).toContain('submissions');
		});

		it('accepts custom output directory', () => {
			const customOutput = '/custom/output';
			const paths = getStoragePaths({ outputDir: customOutput });

			expect(paths.output).toBe(customOutput);
			expect(paths.submissions).toBe(join(customOutput, 'submissions'));
		});

		it('accepts custom internal root for testing', () => {
			const customInternal = '/tmp/test-iris';
			const paths = getStoragePaths({ internalRoot: customInternal });

			expect(paths.internal).toBe(customInternal);
			expect(paths.config).toBe(join(customInternal, 'config.json'));
		});
	});
});

/** |===================|| Namespace Utility Tests ||==================|
 *  | Test collection year derivation from ILR namespaces
 *  |==================================================================|
 */
import { describe, it, expect } from 'vitest';
import { deriveCollectionYear } from '$lib/utils/config/namespace';

describe('deriveCollectionYear', () => {
	it('derives year from 2025-26 namespace', () => {
		const year = deriveCollectionYear('ESFA/ILR/2025-26');
		expect(year).toBe('2526');
	});

	it('derives year from 2024-25 namespace', () => {
		const year = deriveCollectionYear('ESFA/ILR/2024-25');
		expect(year).toBe('2425');
	});

	it('derives year from 2026-27 namespace', () => {
		const year = deriveCollectionYear('ESFA/ILR/2026-27');
		expect(year).toBe('2627');
	});

	it('throws on malformed namespace (no year)', () => {
		expect(() => deriveCollectionYear('ESFA/ILR')).toThrow(
			'Cannot derive collection year from namespace'
		);
	});

	it('throws on malformed namespace (invalid format)', () => {
		expect(() => deriveCollectionYear('ESFA/ILR/25-26')).toThrow(
			'Cannot derive collection year from namespace'
		);
	});

	it('throws on empty string', () => {
		expect(() => deriveCollectionYear('')).toThrow(
			'Cannot derive collection year from namespace'
		);
	});

	it('throws on namespace with only start year', () => {
		expect(() => deriveCollectionYear('ESFA/ILR/2025')).toThrow(
			'Cannot derive collection year from namespace'
		);
	});

	it('includes full error context in exception', () => {
		try {
			deriveCollectionYear('Invalid/Namespace');
			expect.fail('Should have thrown');
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			expect((error as Error).message).toContain('Invalid/Namespace');
			expect((error as Error).message).toContain('Expected format');
		}
	});
});

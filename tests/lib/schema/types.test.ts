import { describe, expect, it } from 'vitest';
import {
	isRequired,
	isRepeatable,
	isOptional,
	DEFAULT_CARDINALITY,
	EMPTY_CONSTRAINTS,
	type SchemaElement,
	type Cardinality,
} from '../../../src/lib/schema';

function makeElement(cardinality: Cardinality): SchemaElement {
	return {
		name: 'Test',
		path: 'Test',
		baseType: 'string',
		constraints: {},
		cardinality,
		children: [],
		isComplex: false,
	};
}

describe('Cardinality utility functions', () => {
	describe('isRequired', () => {
		it('returns true when min >= 1', () => {
			expect(isRequired(makeElement({ min: 1, max: 1 }))).toBe(true);
			expect(isRequired(makeElement({ min: 2, max: 5 }))).toBe(true);
		});

		it('returns false when min === 0', () => {
			expect(isRequired(makeElement({ min: 0, max: 1 }))).toBe(false);
			expect(isRequired(makeElement({ min: 0, max: Infinity }))).toBe(false);
		});
	});

	describe('isOptional', () => {
		it('returns true when min === 0', () => {
			expect(isOptional(makeElement({ min: 0, max: 1 }))).toBe(true);
			expect(isOptional(makeElement({ min: 0, max: Infinity }))).toBe(true);
		});

		it('returns false when min >= 1', () => {
			expect(isOptional(makeElement({ min: 1, max: 1 }))).toBe(false);
			expect(isOptional(makeElement({ min: 1, max: 10 }))).toBe(false);
		});
	});

	describe('isRepeatable', () => {
		it('returns true when max > 1', () => {
			expect(isRepeatable(makeElement({ min: 0, max: 2 }))).toBe(true);
			expect(isRepeatable(makeElement({ min: 1, max: Infinity }))).toBe(true);
		});

		it('returns false when max === 1', () => {
			expect(isRepeatable(makeElement({ min: 0, max: 1 }))).toBe(false);
			expect(isRepeatable(makeElement({ min: 1, max: 1 }))).toBe(false);
		});
	});
});

describe('Constants', () => {
	describe('DEFAULT_CARDINALITY', () => {
		it('represents required single occurrence (min: 1, max: 1)', () => {
			expect(DEFAULT_CARDINALITY).toEqual({ min: 1, max: 1 });
		});
	});

	describe('EMPTY_CONSTRAINTS', () => {
		it('is an empty object', () => {
			expect(EMPTY_CONSTRAINTS).toEqual({});
		});
	});
});

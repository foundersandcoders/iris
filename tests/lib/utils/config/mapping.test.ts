import { describe, it, expect } from 'vitest';
import { generateAimMappings, hasAimData } from '../../../../src/lib/utils/config/mapping';

describe('mappings/utils', () => {
	describe('generateAimMappings', () => {
		it('should generate 5 mappings per template', () => {
			const templates = [
				{
					csv: 'Programme aim {n} Learning ref',
					xsd: 'Message.Learner.LearningDelivery.LearnAimRef',
					transform: 'uppercase',
				},
			];

			const result = generateAimMappings(templates);

			expect(result).toHaveLength(5);
			expect(result[0]).toEqual({
				csvColumn: 'Programme aim 1 Learning ref',
				xsdPath: 'Message.Learner.LearningDelivery.LearnAimRef',
				transform: 'uppercase',
				aimNumber: 1,
			});
			expect(result[4]).toEqual({
				csvColumn: 'Programme aim 5 Learning ref',
				xsdPath: 'Message.Learner.LearningDelivery.LearnAimRef',
				transform: 'uppercase',
				aimNumber: 5,
			});
		});

		it('should handle multiple templates', () => {
			const templates = [
				{
					csv: 'Programme aim {n} Learning ref',
					xsd: 'Message.Learner.LearningDelivery.LearnAimRef',
				},
				{
					csv: 'Start date (aim {n})',
					xsd: 'Message.Learner.LearningDelivery.LearnStartDate',
					transform: 'isoDate',
				},
			];

			const result = generateAimMappings(templates);

			expect(result).toHaveLength(10); // 2 templates × 5 aims
			expect(result[0].csvColumn).toBe('Programme aim 1 Learning ref');
			expect(result[1].csvColumn).toBe('Start date (aim 1)');
			expect(result[2].csvColumn).toBe('Programme aim 2 Learning ref');
		});
	});

	describe('hasAimData', () => {
		it('should return true when aim has non-empty value', () => {
			const row = {
				'Programme aim 1 Learning ref': 'ZPROG001',
			};

			const result = hasAimData(row, 1, 'Programme aim {n} Learning ref');

			expect(result).toBe(true);
		});

		it('should return false when aim value is empty string', () => {
			const row = {
				'Programme aim 2 Learning ref': '',
			};

			const result = hasAimData(row, 2, 'Programme aim {n} Learning ref');

			expect(result).toBe(false);
		});

		it('should return false when aim value is whitespace only', () => {
			const row = {
				'Programme aim 3 Learning ref': '   ',
			};

			const result = hasAimData(row, 3, 'Programme aim {n} Learning ref');

			expect(result).toBe(false);
		});

		it('should return false when aim column missing', () => {
			const row = {
				'Programme aim 1 Learning ref': 'ZPROG001',
			};

			const result = hasAimData(row, 2, 'Programme aim {n} Learning ref');

			expect(result).toBe(false);
		});

		it('should handle trailing spaces in column names', () => {
			const row = {
				'Programme aim 1 Learning ref ': 'ZPROG001', // Trailing space
			};

			const result = hasAimData(row, 1, 'Programme aim {n} Learning ref'); // No trailing space in template

			expect(result).toBe(true);
		});

		it('should be case-insensitive', () => {
			const row = {
				'PROGRAMME AIM 1 LEARNING REF': 'ZPROG001',
			};

			const result = hasAimData(row, 1, 'Programme aim {n} Learning ref');

			expect(result).toBe(true);
		});
	});
});

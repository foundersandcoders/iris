import { describe, it, expect } from 'vitest';
import { mapCsvToSchema, mapCsvToSchemaWithAims } from '../../../src/lib/schema/columnMapper';
import * as fixtures from '../../fixtures/lib/columnMapper';
import { buildSchemaRegistry } from '../../../src/lib/schema/registryBuilder';
import { parseXsd } from '../../../src/lib/schema/schemaParser';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { MappingConfig } from '../../../src/lib/types/schemaTypes';

describe('columnMapper', () => {
	// Load actual schema for path validation
	const xsdPath = join(process.cwd(), 'docs/schemas/schemafile25.xsd');
	const xsdContent = readFileSync(xsdPath, 'utf-8');
	const registry = buildSchemaRegistry(xsdContent);

	describe('mapCsvToSchema', () => {
		it('should map simple CSV columns to nested structure', () => {
			const result = mapCsvToSchema(fixtures.sampleCsvRow, fixtures.simpleMappings, registry);

			expect(result).toEqual({
				Message: {
					Learner: [
						{
							LearnRefNumber: 'L12345',
							GivenNames: 'Jane',
							FamilyName: 'Smith',
						},
					],
				},
			});
		});

		it('should apply transform functions when provided', () => {
			const result = mapCsvToSchema(
				fixtures.sampleCsvRow,
				fixtures.mappingsWithTransform,
				registry
			);

			expect(result).toEqual({
				Message: {
					Learner: [
						{
							DateOfBirth: '1995-06-15',
							Postcode: 'SW1A1AA',
						},
					],
				},
			});
		});

		it('should handle case-insensitive column matching', () => {
			const csvRow = {
				'LEARNER REFERENCE': 'L12345',
				'given names': 'Jane',
			};

			const mappings: typeof fixtures.simpleMappings = [
				{ csvColumn: 'Learner Reference', xsdPath: 'Message.Learner.LearnRefNumber' },
				{ csvColumn: 'Given Names', xsdPath: 'Message.Learner.GivenNames' },
			];

			const result = mapCsvToSchema(csvRow, mappings, registry);

			expect(result.Message).toBeDefined();
			expect((result.Message as any).Learner[0].LearnRefNumber).toBe('L12345');
			expect((result.Message as any).Learner[0].GivenNames).toBe('Jane');
		});

		it('should skip mappings for missing CSV columns', () => {
			const partialRow = {
				'Learner Reference': 'L12345',
				// Missing 'Given Names' and 'Family Name'
			};

			const result = mapCsvToSchema(partialRow, fixtures.simpleMappings, registry);

			expect(result).toEqual({
				Message: {
					Learner: [
						{
							LearnRefNumber: 'L12345',
						},
					],
				},
			});
		});

		it('should handle deep nested paths', () => {
			const deepMappings = [
				{
					csvColumn: 'Aim Reference',
					xsdPath: 'Message.Learner.LearningDelivery.AimSeqNumber',
				},
			];

			const csvRow = { 'Aim Reference': '1' };

			const result = mapCsvToSchema(csvRow, deepMappings, registry);

			expect(result).toEqual({
				Message: {
					Learner: [
						{
							LearningDelivery: [
								{
									AimSeqNumber: '1',
								},
							],
						},
					],
				},
			});
		});
	});

	describe('mapCsvToSchemaWithAims', () => {
		it('should create multiple LearningDelivery elements for populated aims', () => {
			const csvRow = {
				'LearnRefNumber': 'L12345',
				'Programme aim 1 Learning ref ': 'ZPROG001',
				'Start date (aim 1)': '2025-09-01',
				'Programme aim 2 Learning ref ': '', // Empty
				'Programme aim 3 Learning ref ': 'ZPROG002',
				'Start date (aim 3)': '2025-10-01',
			};

			const config: MappingConfig = {
				id: 'test-multi-aim',
				name: 'Test Multi-Aim',
				version: '1.0.0',
				targetSchema: { namespace: 'test', version: '1.0' },
				aimDetectionField: 'Programme aim {n} Learning ref ',
				mappings: [
					// Learner-level
					{
						csvColumn: 'LearnRefNumber',
						xsdPath: 'Message.Learner.LearnRefNumber',
					},
					// Aim 1
					{
						csvColumn: 'Programme aim 1 Learning ref ',
						xsdPath: 'Message.Learner.LearningDelivery.LearnAimRef',
						aimNumber: 1,
					},
					{
						csvColumn: 'Start date (aim 1)',
						xsdPath: 'Message.Learner.LearningDelivery.LearnStartDate',
						aimNumber: 1,
					},
					// Aim 2
					{
						csvColumn: 'Programme aim 2 Learning ref ',
						xsdPath: 'Message.Learner.LearningDelivery.LearnAimRef',
						aimNumber: 2,
					},
					// Aim 3
					{
						csvColumn: 'Programme aim 3 Learning ref ',
						xsdPath: 'Message.Learner.LearningDelivery.LearnAimRef',
						aimNumber: 3,
					},
					{
						csvColumn: 'Start date (aim 3)',
						xsdPath: 'Message.Learner.LearningDelivery.LearnStartDate',
						aimNumber: 3,
					},
				],
			};

			const result = mapCsvToSchemaWithAims(csvRow, config, registry);

		// Updated to expect LLDDHealthProb and SWSupAimId added by our bug fixes
		expect(result.Message.Learner[0].LearnRefNumber).toBe('L12345');
		expect(result.Message.Learner[0].LLDDHealthProb).toBe(9);
		expect(result.Message.Learner[0].LearningDelivery).toHaveLength(2);
		
		expect(result.Message.Learner[0].LearningDelivery[0].AimSeqNumber).toBe(1);
		expect(result.Message.Learner[0].LearningDelivery[0].LearnAimRef).toBe('ZPROG001');
		expect(result.Message.Learner[0].LearningDelivery[0].LearnStartDate).toBe('2025-09-01');
		expect(result.Message.Learner[0].LearningDelivery[0].SWSupAimId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		
		expect(result.Message.Learner[0].LearningDelivery[1].AimSeqNumber).toBe(3);
		expect(result.Message.Learner[0].LearningDelivery[1].LearnAimRef).toBe('ZPROG002');
		expect(result.Message.Learner[0].LearningDelivery[1].LearnStartDate).toBe('2025-10-01');
		expect(result.Message.Learner[0].LearningDelivery[1].SWSupAimId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});

		it('should skip aims with empty detection field', () => {
			const csvRow = {
				'LearnRefNumber': 'L12345',
				'Programme aim 1 Learning ref ': 'ZPROG001',
				'Programme aim 2 Learning ref ': '',
				'Programme aim 3 Learning ref ': '',
			};

			const config: MappingConfig = {
				id: 'test-single-aim',
				name: 'Test Single Aim',
				version: '1.0.0',
				targetSchema: { namespace: 'test', version: '1.0' },
				aimDetectionField: 'Programme aim {n} Learning ref ',
				mappings: [
					{
						csvColumn: 'LearnRefNumber',
						xsdPath: 'Message.Learner.LearnRefNumber',
					},
					{
						csvColumn: 'Programme aim 1 Learning ref ',
						xsdPath: 'Message.Learner.LearningDelivery.LearnAimRef',
						aimNumber: 1,
					},
					{
						csvColumn: 'Programme aim 2 Learning ref ',
						xsdPath: 'Message.Learner.LearningDelivery.LearnAimRef',
						aimNumber: 2,
					},
					{
						csvColumn: 'Programme aim 3 Learning ref ',
						xsdPath: 'Message.Learner.LearningDelivery.LearnAimRef',
						aimNumber: 3,
					},
				],
			};

			const result = mapCsvToSchemaWithAims(csvRow, config, registry);

		// Updated to expect LLDDHealthProb and SWSupAimId added by our bug fixes
		expect(result.Message.Learner[0].LearnRefNumber).toBe('L12345');
		expect(result.Message.Learner[0].LLDDHealthProb).toBe(9);
		expect(result.Message.Learner[0].LearningDelivery).toHaveLength(1);
		
		expect(result.Message.Learner[0].LearningDelivery[0].AimSeqNumber).toBe(1);
		expect(result.Message.Learner[0].LearningDelivery[0].LearnAimRef).toBe('ZPROG001');
		expect(result.Message.Learner[0].LearningDelivery[0].SWSupAimId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});
	});
});

import { describe, it, expect } from 'vitest';
import { mapCsvToSchemaWithAims } from '../../../src/lib/mappings/ilrColumnMapper';
import { buildSchemaRegistry } from '../../../src/lib/schema/registryBuilder';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { MappingConfig } from '../../../src/lib/types/schemaTypes';

describe('ilrColumnMapper', () => {
	// Load actual schema for path validation
	const xsdPath = join(process.cwd(), 'docs/schemas/schemafile25.xsd');
	const xsdContent = readFileSync(xsdPath, 'utf-8');
	const registry = buildSchemaRegistry(xsdContent);

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
				mappingVersion: '1.0.0',
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
				mappingVersion: '1.0.0',
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

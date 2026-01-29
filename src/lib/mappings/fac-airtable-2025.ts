/** |===================|| FaC Airtable Mapping ||==================|
 *  | Column mapping for Founders and Coders Airtable 2025-26 Export
 *  | Based on real Airtable export structure (224 columns)
 *  |================================================================|
 */

import type { MappingConfig } from '../types/schemaTypes';

export const facAirtableMapping: MappingConfig = {
	id: 'fac-airtable-2025',
	name: 'Founders and Coders Airtable Export (2025-26)',
	version: '2.0.0',
	targetSchema: {
		namespace: 'ESFA/ILR/2025-26',
		version: '1.0',
		displayName: 'ILR 2025-26 Schema',
	},
	aimDetectionField: 'Programme aim {n} Learning ref ',
	mappings: [
		// ==================== LEARNER: Required Fields ====================

		// Column 224: LearnRefNum
		{
			csvColumn: 'LearnRefNum',
			xsdPath: 'Message.Learner.LearnRefNumber',
			transform: 'trim',
		},

		// Column 3: ULN
		{
			csvColumn: 'ULN',
			xsdPath: 'Message.Learner.ULN',
			transform: 'stringToInt',
		},

		// Column 9: Ethnic group
		{
			csvColumn: 'Ethnic group',
			xsdPath: 'Message.Learner.Ethnicity',
			transform: 'stringToInt',
		},

		// Column 6: Sex (note: has trailing space in CSV!)
		{
			csvColumn: 'Sex ',
			xsdPath: 'Message.Learner.Sex',
			transform: 'uppercase',
		},

		// Column 14: Primary additional needs
		{
			csvColumn: 'Primary additional needs',
			xsdPath: 'Message.Learner.LLDDHealthProb',
			transform: 'stringToInt',
		},

		// Column 10: Prior post code
		{
			csvColumn: 'Prior post code',
			xsdPath: 'Message.Learner.PostcodePrior',
			transform: 'uppercaseNoSpaces',
		},

		// Column 11: Post code
		{
			csvColumn: 'Post code',
			xsdPath: 'Message.Learner.Postcode',
			transform: 'uppercaseNoSpaces',
		},

		// ==================== LEARNER: Optional Fields ====================

		// Column 223: PrevLearnRefNum
		{
			csvColumn: 'PrevLearnRefNum',
			xsdPath: 'Message.Learner.PrevLearnRefNumber',
			transform: 'trim',
		},

		// Column 2: Previous UKPRN
		{
			csvColumn: 'Previous UKPRN',
			xsdPath: 'Message.Learner.PrevUKPRN',
			transform: 'stringToIntOptional',
		},

		// Column 5: Family name
		{
			csvColumn: 'Family name',
			xsdPath: 'Message.Learner.FamilyName',
			transform: 'trim',
		},

		// Column 4: Given name
		{
			csvColumn: 'Given name',
			xsdPath: 'Message.Learner.GivenNames',
			transform: 'trim',
		},

		// Column 7: Date of birth
		{
			csvColumn: 'Date of birth',
			xsdPath: 'Message.Learner.DateOfBirth',
			transform: 'isoDate',
		},

		// Column 8: NI number
		{
			csvColumn: 'NI number',
			xsdPath: 'Message.Learner.NINumber',
			transform: 'uppercaseNoSpaces',
		},

		// Column 13: Telephone number
		{
			csvColumn: 'Telephone number',
			xsdPath: 'Message.Learner.TelNo',
			transform: 'digitsOnly',
		},

		// ==================== LEARNING DELIVERY: Aim 1 Fields ====================

		// Column 35: Aim type (programme aim 1)
		{
			csvColumn: 'Aim type (programme aim 1)',
			xsdPath: 'Message.Learner.LearningDelivery.AimType',
			transform: 'stringToInt',
			aimNumber: 1,
		},

		// Column 36: Programme aim 1 Learning ref (with trailing space!)
		{
			csvColumn: 'Programme aim 1 Learning ref ',
			xsdPath: 'Message.Learner.LearningDelivery.LearnAimRef',
			transform: 'uppercase',
			aimNumber: 1,
		},

		// Column 37: Start date (aim 1)
		{
			csvColumn: 'Start date (aim 1)',
			xsdPath: 'Message.Learner.LearningDelivery.LearnStartDate',
			transform: 'isoDate',
			aimNumber: 1,
		},

		// Column 38: Planned end date (aim 1)
		{
			csvColumn: 'Planned end date (aim 1)',
			xsdPath: 'Message.Learner.LearningDelivery.LearnPlanEndDate',
			transform: 'isoDate',
			aimNumber: 1,
		},

		// Column 39: Funding module (aim 1)
		{
			csvColumn: 'Funding module (aim 1)',
			xsdPath: 'Message.Learner.LearningDelivery.FundModel',
			transform: 'stringToInt',
			aimNumber: 1,
		},

		// Column 42: Delivery postcode (aim 1)
		{
			csvColumn: 'Delivery postcode (aim 1)',
			xsdPath: 'Message.Learner.LearningDelivery.DelLocPostCode',
			transform: 'uppercaseNoSpaces',
			aimNumber: 1,
		},

		// Column 61: Completion status (aim 1)
		{
			csvColumn: 'Completion status (aim 1)',
			xsdPath: 'Message.Learner.LearningDelivery.CompStatus',
			transform: 'stringToInt',
			aimNumber: 1,
		},
	],
};

/** |===================|| FaC Airtable Mapping ||==================|
 *  | Column mapping for Founders and Coders Airtable 2025-26 Export
 *  | Based on real Airtable export structure (224 columns)
 *  |================================================================|
 */

import type { MappingConfig } from '../types/schemaTypes';
import { generateAimMappings } from './utils';

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

		// ==================== LEARNER: Prior Attainment ====================

		// Column 15: Prior attainment date applies to
		{
			csvColumn: 'Prior attainment date applies to',
			xsdPath: 'Message.Learner.PriorAttain.DateLevelApp',
			transform: 'isoDate',
		},

		// Column 16: Prior attainment
		{
			csvColumn: 'Prior attainment',
			xsdPath: 'Message.Learner.PriorAttain.PriorLevel',
			transform: 'stringToInt',
		},

		// ==================== LEARNING DELIVERY: Aims 1-5 ====================
		// Generated mappings for all 5 aims (columns 35-194)

		...generateAimMappings([
			{ csv: 'Aim type (programme aim {n})', xsd: 'Message.Learner.LearningDelivery.AimType', transform: 'stringToInt' },
			{ csv: 'Programme aim {n} Learning ref ', xsd: 'Message.Learner.LearningDelivery.LearnAimRef', transform: 'uppercase' },
			{ csv: 'Start date (aim {n})', xsd: 'Message.Learner.LearningDelivery.LearnStartDate', transform: 'isoDate' },
			{ csv: 'Planned end date (aim {n})', xsd: 'Message.Learner.LearningDelivery.LearnPlanEndDate', transform: 'isoDate' },
			{ csv: 'Funding module (aim {n})', xsd: 'Message.Learner.LearningDelivery.FundModel', transform: 'stringToInt' },
			{ csv: 'Programme type (aim {n})', xsd: 'Message.Learner.LearningDelivery.ProgType', transform: 'stringToIntOptional' },
			{ csv: 'Apprentice standard (aim {n})', xsd: 'Message.Learner.LearningDelivery.StdCode', transform: 'stringToIntOptional' },
			{ csv: 'Delivery postcode (aim {n})', xsd: 'Message.Learner.LearningDelivery.DelLocPostCode', transform: 'uppercaseNoSpaces' },
			{ csv: 'Planned hours (aim {n})', xsd: 'Message.Learner.LearningDelivery.PHours', transform: 'stringToIntOptional' },
			{ csv: 'Actual hours (aim {n})', xsd: 'Message.Learner.LearningDelivery.OTJActHours', transform: 'stringToIntOptional' },
			{ csv: 'Contract Ref (aim {n})', xsd: 'Message.Learner.LearningDelivery.ConRefNumber', transform: 'trim' },
			{ csv: 'EPAO ID (aim {n})', xsd: 'Message.Learner.LearningDelivery.EPAOrgID', transform: 'trim' },
			{ csv: 'Completion status (aim {n})', xsd: 'Message.Learner.LearningDelivery.CompStatus', transform: 'stringToInt' },
			{ csv: 'Actual end date (aim {n})', xsd: 'Message.Learner.LearningDelivery.LearnActEndDate', transform: 'isoDate' },
			{ csv: 'Achievement date (aim {n})', xsd: 'Message.Learner.LearningDelivery.AchDate', transform: 'isoDate' },
			{ csv: 'Outcome (aim {n})', xsd: 'Message.Learner.LearningDelivery.Outcome', transform: 'stringToIntOptional' },
			{ csv: 'Withdrawal reason (aim {n})', xsd: 'Message.Learner.LearningDelivery.WithdrawReason', transform: 'stringToIntOptional' },
			{ csv: 'Outcome grade (aim {n})', xsd: 'Message.Learner.LearningDelivery.OutGrade', transform: 'trim' },
		]),
	],
};

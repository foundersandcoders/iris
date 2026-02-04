/** |===================|| FaC Airtable Mapping ||==================|
 *  | Column mapping for Founders and Coders Airtable 2025-26 Export
 *  | Based on real Airtable export structure (224 columns)
 *  |================================================================|
 */

import type { MappingConfig } from '../types/schemaTypes';
import { generateAimMappings } from '../utils/config/mapping';

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
			{
				csv: 'Aim type (programme aim {n})',
				xsd: 'Message.Learner.LearningDelivery.AimType',
				transform: 'stringToInt',
			},
			{
				csv: 'Programme aim {n} Learning ref ',
				xsd: 'Message.Learner.LearningDelivery.LearnAimRef',
				transform: 'uppercase',
			},
			{
				csv: 'Start date (aim {n})',
				xsd: 'Message.Learner.LearningDelivery.LearnStartDate',
				transform: 'isoDate',
			},
			{
				csv: 'Planned end date (aim {n})',
				xsd: 'Message.Learner.LearningDelivery.LearnPlanEndDate',
				transform: 'isoDate',
			},
			{
				csv: 'Funding module (aim {n})',
				xsd: 'Message.Learner.LearningDelivery.FundModel',
				transform: 'stringToInt',
			},
			{
				csv: 'Programme type (aim {n})',
				xsd: 'Message.Learner.LearningDelivery.ProgType',
				transform: 'stringToIntOptional',
			},
			{
				csv: 'Apprentice standard (aim {n})',
				xsd: 'Message.Learner.LearningDelivery.StdCode',
				transform: 'stringToIntOptional',
			},
			{
				csv: 'Delivery postcode (aim {n})',
				xsd: 'Message.Learner.LearningDelivery.DelLocPostCode',
				transform: 'uppercaseNoSpaces',
			},
			{
				csv: 'Planned hours (aim {n})',
				xsd: 'Message.Learner.LearningDelivery.PHours',
				transform: 'stringToIntOptional',
			},
			{
				csv: 'Actual hours (aim {n})',
				xsd: 'Message.Learner.LearningDelivery.OTJActHours',
				transform: 'stringToIntOptional',
			},
			{
				csv: 'Contract Ref (aim {n})',
				xsd: 'Message.Learner.LearningDelivery.ConRefNumber',
				transform: 'trim',
			},
			{
				csv: 'EPAO ID (aim {n})',
				xsd: 'Message.Learner.LearningDelivery.EPAOrgID',
				transform: 'trim',
			},
			{
				csv: 'Completion status (aim {n})',
				xsd: 'Message.Learner.LearningDelivery.CompStatus',
				transform: 'stringToInt',
			},
			{
				csv: 'Actual end date (aim {n})',
				xsd: 'Message.Learner.LearningDelivery.LearnActEndDate',
				transform: 'isoDate',
			},
			{
				csv: 'Achievement date (aim {n})',
				xsd: 'Message.Learner.LearningDelivery.AchDate',
				transform: 'isoDate',
			},
			{
				csv: 'Outcome (aim {n})',
				xsd: 'Message.Learner.LearningDelivery.Outcome',
				transform: 'stringToIntOptional',
			},
			{
				csv: 'Withdrawal reason (aim {n})',
				xsd: 'Message.Learner.LearningDelivery.WithdrawReason',
				transform: 'stringToIntOptional',
			},
			{
				csv: 'Outcome grade (aim {n})',
				xsd: 'Message.Learner.LearningDelivery.OutGrade',
				transform: 'trim',
			},
		]),
	],
	famTemplates: [
		{
			typeCsv: 'Contract type (aim {n})',
			codeCsv: 'Contract type code (aim {n})',
			dateFromCsv: 'Date applies from (aim {n})',
			dateToCsv: 'Date applies to (aim {n})',
		},
		{
			typeCsv: 'Source of funding (aim {n})',
			codeCsv: 'Funding indicator (aim {n})',
		},
	],
	appFinTemplates: [
		{
			typeCsv: 'Financial type 1 (aim {n})',
			codeCsv: 'Financial code 1 (aim {n})',
			dateCsv: 'Financial start date 1 (aim {n})',
			amountCsv: 'Training price (aim {n})',
		},
		{
			typeCsv: 'Financial type 2 (aim {n})',
			codeCsv: 'Financial code 2 (aim {n})',
			dateCsv: 'Financial start date 2 (aim {n})',
			amountCsv: 'Total assessment price (aim {n})',
		},
	],
	employmentStatuses: [
		// Set 1
		{
			dateEmpStatAppCsv: 'Employment #1 date applies to',
			empStatCsv: 'Employment status #1',
			empIdCsv: 'Employer identifier #1 ',
			monitoring: [
				{ csvColumn: 'Small employer #1', esmType: 'SEM', transform: 'boolToInt' },
				{ csvColumn: 'Is the learner self employed? #1', esmType: 'SEI', transform: 'boolToInt' },
				{
					csvColumn: 'Has the learner been made redundant? #1',
					esmType: 'REI',
					transform: 'boolToInt',
				},
				{ csvColumn: 'Length of employment #1', esmType: 'LOE', transform: 'stringToInt' },
				{
					csvColumn: 'Employment intensity indicator #1',
					esmType: 'EII',
					transform: 'stringToInt',
				},
				{ csvColumn: 'Length of unemployment #1', esmType: 'LOU', transform: 'stringToInt' },
			],
		},
		// Set 2
		{
			dateEmpStatAppCsv: 'Employment #2 date applies to',
			empStatCsv: 'Employment status #2',
			empIdCsv: 'Employer identifier #2',
			monitoring: [
				{ csvColumn: 'Small employer #2 ', esmType: 'SEM', transform: 'boolToInt' },
				{ csvColumn: 'Is the learner self employed? #2', esmType: 'SEI', transform: 'boolToInt' },
				{
					csvColumn: 'Has the learner been made redundant? #2',
					esmType: 'REI',
					transform: 'boolToInt',
				},
				{ csvColumn: 'Length of employment #2', esmType: 'LOE', transform: 'stringToInt' },
				{
					csvColumn: 'Employment intensity indicator #2',
					esmType: 'EII',
					transform: 'stringToInt',
				},
				{ csvColumn: 'Length of unemployment #2', esmType: 'LOU', transform: 'stringToInt' },
			],
		},
		// Set 3
		{
			dateEmpStatAppCsv: 'Date applies to Employment status #3',
			empStatCsv: 'Employment status #3',
			empIdCsv: 'Employer identifier #3',
			monitoring: [
				{ csvColumn: 'Small employer #3', esmType: 'SEM', transform: 'boolToInt' },
				{ csvColumn: 'Self employed #3', esmType: 'SEI', transform: 'boolToInt' },
				{ csvColumn: 'Made Redundant #3', esmType: 'REI', transform: 'boolToInt' },
				{ csvColumn: 'Length of employment #3', esmType: 'LOE', transform: 'stringToInt' },
				{ csvColumn: 'Employment hours #3', esmType: 'EII', transform: 'stringToInt' },
				{ csvColumn: 'Length of unemployment #3', esmType: 'LOU', transform: 'stringToInt' },
			],
		},
		// Set 4
		{
			dateEmpStatAppCsv: 'Date applies to Employment status #4',
			empStatCsv: 'Employment status #4',
			empIdCsv: 'Employer identifier #4',
			monitoring: [
				{ csvColumn: 'Small employer #4', esmType: 'SEM', transform: 'boolToInt' },
				{ csvColumn: 'Self employed #4', esmType: 'SEI', transform: 'boolToInt' },
				{ csvColumn: 'Made Redundant #4', esmType: 'REI', transform: 'boolToInt' },
				{ csvColumn: 'Length of employment #4', esmType: 'LOE', transform: 'stringToInt' },
				{ csvColumn: 'Employment hours #4', esmType: 'EII', transform: 'stringToInt' },
				{ csvColumn: 'Length of unemployment #4', esmType: 'LOU', transform: 'stringToInt' },
			],
		},
		// Set 5
		{
			dateEmpStatAppCsv: 'Date applies to Employment status #5',
			empStatCsv: 'Employment status #5',
			empIdCsv: 'Employer identifier #5',
			monitoring: [
				{ csvColumn: 'Small employer #5', esmType: 'SEM', transform: 'boolToInt' },
				{ csvColumn: 'Self employed #5', esmType: 'SEI', transform: 'boolToInt' },
				{ csvColumn: 'Made Redundant #5', esmType: 'REI', transform: 'boolToInt' },
				{ csvColumn: 'Length of employment #5', esmType: 'LOE', transform: 'stringToInt' },
				{ csvColumn: 'Employment hours #5', esmType: 'EII', transform: 'stringToInt' },
				{ csvColumn: 'Length of unemployment #5', esmType: 'LOU', transform: 'stringToInt' },
			],
		},
	],
};

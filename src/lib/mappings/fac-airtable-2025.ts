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
	],
};

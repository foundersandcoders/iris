/** |===================|| FaC Airtable Mapping ||==================|
 *  | Default column mapping for Founders and Coders Airtable exports
 *  | Maps CSV columns to ILR XSD paths with transforms
 *  |================================================================|
 */

import type { MappingConfig } from '../types/schemaTypes';

export const facAirtableMapping: MappingConfig = {
	id: 'fac-airtable-2025',
	name: 'Founders and Coders Airtable Export',
	version: '1.0.0',
	targetSchema: {
		namespace: 'ESFA/ILR/2025-26',
		version: '1.0',
		displayName: 'ILR 2025-26 Schema',
	},
	mappings: [
		// === Learner ===
		{
			csvColumn: 'LearnRefNumber',
			xsdPath: 'Message.Learner.LearnRefNumber',
			transform: 'trim',
		},
		{
			csvColumn: 'ULN',
			xsdPath: 'Message.Learner.ULN',
			transform: 'stringToInt',
		},
		{
			csvColumn: 'FamilyName',
			xsdPath: 'Message.Learner.FamilyName',
			transform: 'trim',
		},
		{
			csvColumn: 'GivenNames',
			xsdPath: 'Message.Learner.GivenNames',
			transform: 'trim',
		},
		{
			csvColumn: 'DateOfBirth',
			xsdPath: 'Message.Learner.DateOfBirth',
			transform: 'isoDate',
		},
		{
			csvColumn: 'Ethnicity',
			xsdPath: 'Message.Learner.Ethnicity',
			transform: 'stringToInt',
		},
		{
			csvColumn: 'Sex',
			xsdPath: 'Message.Learner.Sex',
			transform: 'uppercase',
		},
		{
			csvColumn: 'LLDDHealthProb',
			xsdPath: 'Message.Learner.LLDDHealthProb',
			transform: 'stringToInt',
		},
		{
			csvColumn: 'NINumber',
			xsdPath: 'Message.Learner.NINumber',
			transform: 'uppercase',
		},
		{
			csvColumn: 'PostcodePrior',
			xsdPath: 'Message.Learner.PostcodePrior',
			transform: 'uppercase',
		},
		{
			csvColumn: 'Postcode',
			xsdPath: 'Message.Learner.Postcode',
			transform: 'uppercase',
		},
		{
			csvColumn: 'Email',
			xsdPath: 'Message.Learner.ContactDetails.Email',
			transform: 'trim',
		},

		// === LearningDelivery ===
		{
			csvColumn: 'LearnAimRef',
			xsdPath: 'Message.Learner.LearningDelivery.LearnAimRef',
			transform: 'uppercase',
		},
		{
			csvColumn: 'AimType',
			xsdPath: 'Message.Learner.LearningDelivery.AimType',
			transform: 'stringToInt',
		},
		{
			csvColumn: 'AimSeqNumber',
			xsdPath: 'Message.Learner.LearningDelivery.AimSeqNumber',
			transform: 'stringToInt',
		},
		{
			csvColumn: 'LearnStartDate',
			xsdPath: 'Message.Learner.LearningDelivery.LearnStartDate',
			transform: 'isoDate',
		},
		{
			csvColumn: 'LearnPlanEndDate',
			xsdPath: 'Message.Learner.LearningDelivery.LearnPlanEndDate',
			transform: 'isoDate',
		},
		{
			csvColumn: 'FundModel',
			xsdPath: 'Message.Learner.LearningDelivery.FundModel',
			transform: 'stringToInt',
		},
		{
			csvColumn: 'ProgType',
			xsdPath: 'Message.Learner.LearningDelivery.ProgType',
			transform: 'stringToIntOptional',
		},
		{
			csvColumn: 'StdCode',
			xsdPath: 'Message.Learner.LearningDelivery.StdCode',
			transform: 'stringToIntOptional',
		},
		{
			csvColumn: 'DelLocPostCode',
			xsdPath: 'Message.Learner.LearningDelivery.DelLocPostCode',
			transform: 'uppercase',
		},
		{
			csvColumn: 'CompStatus',
			xsdPath: 'Message.Learner.LearningDelivery.CompStatus',
			transform: 'stringToInt',
		},
		{
			csvColumn: 'LearnActEndDate',
			xsdPath: 'Message.Learner.LearningDelivery.LearnActEndDate',
			transform: 'isoDate',
		},
		{
			csvColumn: 'Outcome',
			xsdPath: 'Message.Learner.LearningDelivery.Outcome',
			transform: 'stringToIntOptional',
		},
	],
};

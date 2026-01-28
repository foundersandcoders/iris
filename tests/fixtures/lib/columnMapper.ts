import type { ColumnMapping, MappingConfig } from '../../../src/lib/types/schemaTypes';

export const simpleMappings: ColumnMapping[] = [
	{
		csvColumn: 'Learner Reference',
		xsdPath: 'Message.Learner.LearnRefNumber',
	},
	{
		csvColumn: 'Given Names',
		xsdPath: 'Message.Learner.GivenNames',
	},
	{
		csvColumn: 'Family Name',
		xsdPath: 'Message.Learner.FamilyName',
	},
];

export const mappingsWithTransform: ColumnMapping[] = [
	{
		csvColumn: 'Birth Date',
		xsdPath: 'Message.Learner.DateOfBirth',
		transform: (value: string) => new Date(value).toISOString().split('T')[0],
	},
	{
		csvColumn: 'Postcode',
		xsdPath: 'Message.Learner.Postcode',
		transform: (value: string) => value.toUpperCase().replace(/\s+/g, ''),
	},
];

export const sampleCsvRow: Record<string, string> = {
	'Learner Reference': 'L12345',
	'Given Names': 'Jane',
	'Family Name': 'Smith',
	'Birth Date': '1995-06-15',
	Postcode: 'sw1a 1aa',
};

export const mockMappingConfig: MappingConfig = {
	id: 'test-mapping',
	name: 'Test Mapping Configuration',
	version: '1.0.0',
	targetSchemaVersion: '25',
	mappings: simpleMappings,
};

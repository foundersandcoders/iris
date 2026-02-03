/** |===================|| Storage Test Fixtures ||==================|
 *  | Reusable test data for storage abstraction tests.
 *  |=================================================================|
 */
import type { IrisConfig } from '$lib/types/configTypes';
import type { MappingConfig } from '$lib/types/schemaTypes';
import type { SubmissionMetadata, HistoryEntry } from '$lib/types/storageTypes';

export const defaultConfig: IrisConfig = {
	provider: {
		ukprn: 10000000,
		name: 'Founders and Coders',
	},
	submission: {
		softwareSupplier: 'Founders and Coders',
		softwarePackage: 'Iris',
		release: '1.0.0',
	},
};

export const customConfig: IrisConfig = {
	provider: {
		ukprn: 12345678,
		name: 'Test Provider',
	},
	submission: {
		softwareSupplier: 'Test Supplier',
		softwarePackage: 'Test Package',
		release: '2.0.0',
	},
	outputDir: '/custom/path',
};

export const malformedConfigJson = '{ invalid json }';

export const customMapping: MappingConfig = {
	id: 'custom-test',
	name: 'Custom Test Mapping',
	version: '1.0.0',
	targetSchema: {
		namespace: 'ESFA/ILR/2025-26',
		version: '1.0',
	},
	mappings: [
		{
			csvColumn: 'TestColumn',
			xsdPath: 'Message.Learner.TestField',
			transform: 'trim',
		},
	],
};

export const userMapping: MappingConfig = {
	id: 'user-mapping',
	name: 'User Mapping',
	version: '1.0.0',
	targetSchema: { namespace: 'ESFA/ILR/2025-26' },
	mappings: [],
};

export const sampleXml = '<?xml version="1.0"?><Message></Message>';

export const sampleXmlWithContent = (index: number) =>
	`<?xml version="1.0"?><Message>${index}</Message>`;

export const sampleMetadata: SubmissionMetadata = {
	timestamp: '2025-01-15T10:30:00.000Z',
	learnerCount: 5,
	schema: 'ESFA/ILR/2025-26',
	checksum: 'abc123',
};

export const userSchemaContent = '<?xml version="1.0"?><xs:schema>USER VERSION</xs:schema>';

export const customSchemaContent = '<xs:schema/>';

export const historyEntry1: HistoryEntry = {
	filename: 'ILR-2025-01-01.xml',
	timestamp: '2025-01-01T00:00:00Z',
	learnerCount: 5,
	checksum: 'hash1',
	schema: 'ESFA/ILR/2025-26',
};

export const historyEntry2: HistoryEntry = {
	filename: 'ILR-2025-01-02.xml',
	timestamp: '2025-01-02T00:00:00Z',
	learnerCount: 8,
	checksum: 'hash2',
	schema: 'ESFA/ILR/2025-26',
};

export const historyEntryWithRefs: HistoryEntry = {
	filename: 'ILR-2025-01-15.xml',
	timestamp: '2025-01-15T10:30:00Z',
	learnerCount: 10,
	checksum: 'abc123',
	schema: 'ESFA/ILR/2025-26',
	learnerRefs: ['L001', 'L002'],
};

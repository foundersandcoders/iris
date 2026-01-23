import type { CSVRow } from '../../../src/lib/utils/csv/csv-parser';

export const validHeaders = [
	'LearnRefNumber',
	'ULN',
	'DateOfBirth',
	'Ethnicity',
	'Sex',
	'LLDDHealthProb',
	'PostcodePrior',
	'Postcode',
	'LearnAimRef',
	'AimType',
	'AimSeqNumber',
	'LearnStartDate',
	'LearnPlanEndDate',
	'FundModel',
	'DelLocPostCode',
	'CompStatus',
];

export const validRow: CSVRow = {
	LearnRefNumber: 'ABC123',
	ULN: '1234567890',
	DateOfBirth: '2000-01-15',
	Ethnicity: '31',
	Sex: 'M',
	LLDDHealthProb: '2',
	PostcodePrior: 'E1 6AN',
	Postcode: 'E1 6AN',
	LearnAimRef: '60161533',
	AimType: '1',
	AimSeqNumber: '1',
	LearnStartDate: '2025-09-01',
	LearnPlanEndDate: '2026-08-31',
	FundModel: '36',
	DelLocPostCode: 'E1 6AN',
	CompStatus: '1',
};

export const incompleteHeaders = ['LearnRefNumber', 'ULN'];

export const rowWithEmptyULN: CSVRow = {
	...validRow,
	ULN: '',
};

export const rowWithWhitespaceLearnRef: CSVRow = {
	...validRow,
	LearnRefNumber: '   ',
};

export const multipleRowsWithErrors: CSVRow[] = [
	validRow,
	{ ...validRow, ULN: '' },
	{ ...validRow, Sex: '' },
];

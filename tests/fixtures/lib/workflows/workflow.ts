import type { CSVRow } from '../../../../src/lib/utils/csv/csvParser';

export const validHeaders = [
	'LearnRefNum',
	'ULN',
	'Family name',
	'Given name',
	'Date of birth',
	'Ethnic group',
	'Sex ',
	'Primary additional needs',
	'Prior post code',
	'Post code',
	'Prior attainment date applies to',
	'Prior attainment',
	'Programme aim 1 Learning ref ',
	'Aim type (programme aim 1)',
	'Start date (aim 1)',
	'Planned end date (aim 1)',
	'Funding module (aim 1)',
	'Delivery postcode (aim 1)',
	'Completion status (aim 1)',
];

export const validRow: CSVRow = {
	'LearnRefNum': 'ABC123',
	'ULN': '1234567890',
	'Family name': 'Smith',
	'Given name': 'John',
	'Date of birth': '2000-01-15',
	'Ethnic group': '31',
	'Sex ': 'M',
	'Primary additional needs': '2',
	'Prior post code': 'E1 6AN',
	'Post code': 'E1 6AN',
	'Prior attainment date applies to': '2025-09-01',
	'Prior attainment': '2',
	'Programme aim 1 Learning ref ': '60161533',
	'Aim type (programme aim 1)': '1',
	'Start date (aim 1)': '2025-09-01',
	'Planned end date (aim 1)': '2026-08-31',
	'Funding module (aim 1)': '36',
	'Delivery postcode (aim 1)': 'E1 6AN',
	'Completion status (aim 1)': '1',
};

export const validCsvContent = [validHeaders.join(','), Object.values(validRow).join(',')].join(
	'\n'
);

export const invalidCsvContent = `LearnRefNum,ULN
ABC123,`;

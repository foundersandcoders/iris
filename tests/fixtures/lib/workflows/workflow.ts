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

// === Multiple Learners Fixtures ===

// Headers extended to include aims 2-3
export const multipleLearnersHeaders = [
	...validHeaders,
	// Aim 2
	'Programme aim 2 Learning ref ',
	'Aim type (programme aim 2)',
	'Start date (aim 2)',
	'Planned end date (aim 2)',
	'Funding module (aim 2)',
	'Delivery postcode (aim 2)',
	'Completion status (aim 2)',
	// Aim 3
	'Programme aim 3 Learning ref ',
	'Aim type (programme aim 3)',
	'Start date (aim 3)',
	'Planned end date (aim 3)',
	'Funding module (aim 3)',
	'Delivery postcode (aim 3)',
	'Completion status (aim 3)',
];

// Learner 1: Single aim
export const learner1SingleAim: CSVRow = {
	...validRow,
	'LearnRefNum': 'LEARN001',
	'ULN': '1111111111',
	'Family name': 'Jones',
	'Given name': 'Alice',
};

// Learner 2: Three aims
export const learner2ThreeAims: CSVRow = {
	...validRow,
	'LearnRefNum': 'LEARN002',
	'ULN': '2222222222',
	'Family name': 'Brown',
	'Given name': 'Bob',
	// Aim 2
	'Programme aim 2 Learning ref ': '50086832',
	'Aim type (programme aim 2)': '3',
	'Start date (aim 2)': '2025-09-01',
	'Planned end date (aim 2)': '2026-08-31',
	'Funding module (aim 2)': '36',
	'Delivery postcode (aim 2)': 'E1 6AN',
	'Completion status (aim 2)': '1',
	// Aim 3
	'Programme aim 3 Learning ref ': '60000123',
	'Aim type (programme aim 3)': '3',
	'Start date (aim 3)': '2025-09-01',
	'Planned end date (aim 3)': '2026-08-31',
	'Funding module (aim 3)': '36',
	'Delivery postcode (aim 3)': 'E1 6AN',
	'Completion status (aim 3)': '1',
};

export const multiplelearnersCsvContent = [
	multipleLearnersHeaders.join(','),
	Object.values(learner1SingleAim).concat(['', '', '', '', '', '', '', '', '', '', '', '', '', '']).join(','),
	Object.values(learner2ThreeAims).join(','),
].join('\n');

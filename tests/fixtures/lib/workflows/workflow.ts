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

// === FAM and AppFinRecord Fixtures ===

// Headers with FAM and AppFinRecord fields for aim 1
export const famAppFinHeaders = [
	...validHeaders,
	// FAM fields
	'Contract type (aim 1)',
	'Contract type code (aim 1)',
	'Date applies from (aim 1)',
	'Date applies to (aim 1)',
	'Source of funding (aim 1)',
	'Funding indicator (aim 1)',
	// AppFinRecord fields
	'Financial type 1 (aim 1)',
	'Financial code 1 (aim 1)',
	'Financial start date 1 (aim 1)',
	'Training price (aim 1)',
	'Financial type 2 (aim 1)',
	'Financial code 2 (aim 1)',
	'Financial start date 2 (aim 1)',
	'Total assessment price (aim 1)',
];

// Learner with FAM and AppFinRecord data
export const learnerWithFamAppFin: CSVRow = {
	...validRow,
	'LearnRefNum': 'FAMTEST01',
	'ULN': '3333333333',
	'Family name': 'Wilson',
	'Given name': 'Charlie',
	// FAM data
	'Contract type (aim 1)': 'ACT',
	'Contract type code (aim 1)': '1',
	'Date applies from (aim 1)': '2025-09-01',
	'Date applies to (aim 1)': '2026-08-31',
	'Source of funding (aim 1)': 'SOF',
	'Funding indicator (aim 1)': '105',
	// AppFinRecord data
	'Financial type 1 (aim 1)': 'TNP',
	'Financial code 1 (aim 1)': '1',
	'Financial start date 1 (aim 1)': '2025-09-01',
	'Training price (aim 1)': '15000',
	'Financial type 2 (aim 1)': 'TNP',
	'Financial code 2 (aim 1)': '2',
	'Financial start date 2 (aim 1)': '2025-09-01',
	'Total assessment price (aim 1)': '3000',
};

export const famAppFinCsvContent = [
	famAppFinHeaders.join(','),
	Object.values(learnerWithFamAppFin).join(','),
].join('\n');

// === Employment Status Fixtures ===

// Headers with multiple employment status fields
export const employmentStatusHeaders = [
	...validHeaders,
	// Employment status #1
	'Employment #1 date applies to',
	'Employment status #1',
	'Employer identifier #1 ',
	'Small employer #1',
	'Is the learner self employed? #1',
	'Has the learner been made redundant? #1',
	'Length of employment #1',
	'Employment intensity indicator #1',
	'Length of unemployment #1',
	// Employment status #2
	'Employment #2 date applies to',
	'Employment status #2',
	'Employer identifier #2',
	'Small employer #2 ',
	'Is the learner self employed? #2',
	'Has the learner been made redundant? #2',
	'Length of employment #2',
	'Employment intensity indicator #2',
	'Length of unemployment #2',
	// Employment status #3
	'Date applies to Employment status #3',
	'Employment status #3',
	'Employer identifier #3',
	'Small employer #3',
	'Self employed #3',
	'Made Redundant #3',
	'Length of employment #3',
	'Employment hours #3',
	'Length of unemployment #3',
];

// Learner with 3 employment statuses
export const learnerWithEmploymentStatuses: CSVRow = {
	...validRow,
	'LearnRefNum': 'EMPTEST01',
	'ULN': '4444444444',
	'Family name': 'Davis',
	'Given name': 'Dana',
	// Employment status #1
	'Employment #1 date applies to': '2025-09-01',
	'Employment status #1': '10',
	'Employer identifier #1 ': '999999999',
	'Small employer #1': '1',
	'Is the learner self employed? #1': '0',
	'Has the learner been made redundant? #1': '0',
	'Length of employment #1': '4',
	'Employment intensity indicator #1': '1',
	'Length of unemployment #1': '',
	// Employment status #2
	'Employment #2 date applies to': '2025-12-01',
	'Employment status #2': '10',
	'Employer identifier #2': '888888888',
	'Small employer #2 ': '0',
	'Is the learner self employed? #2': '0',
	'Has the learner been made redundant? #2': '0',
	'Length of employment #2': '2',
	'Employment intensity indicator #2': '1',
	'Length of unemployment #2': '',
	// Employment status #3
	'Date applies to Employment status #3': '2026-03-01',
	'Employment status #3': '11',
	'Employer identifier #3': '',
	'Small employer #3': '',
	'Self employed #3': '1',
	'Made Redundant #3': '0',
	'Length of employment #3': '',
	'Employment hours #3': '',
	'Length of unemployment #3': '3',
};

export const employmentStatusCsvContent = [
	employmentStatusHeaders.join(','),
	Object.values(learnerWithEmploymentStatuses).join(','),
].join('\n');

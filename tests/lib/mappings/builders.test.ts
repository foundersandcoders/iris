import { describe, it, expect } from 'vitest';
import { buildFamEntries, buildAppFinRecords, buildEmploymentStatuses } from '../../../src/lib/mappings/builders';
import type { FamTemplate, AppFinTemplate, EmploymentStatusConfig } from '../../../src/lib/types/schemaTypes';

describe('buildFamEntries', () => {
	const famTemplates: FamTemplate[] = [
		{
			typeCsv: 'Contract type (aim {n})',
			codeCsv: 'Contract type code (aim {n})',
			dateFromCsv: 'Date applies from (aim{n})',
			dateToCsv: 'Date applies to (aim {n})',
		},
		{
			typeCsv: 'Source of funding (aim {n})',
			codeCsv: 'Funding indicator (aim {n})',
		},
	];

	it('builds FAM entries for apprenticeship aim (2 FAMs with dates)', () => {
		const csvRow = {
			'Contract type (aim 1)': 'ACT',
			'Contract type code (aim 1)': '1',
			'Date applies from (aim1)': '2025-09-01',
			'Date applies to (aim 1)': '2026-08-31',
			'Source of funding (aim 1)': 'SOF',
			'Funding indicator (aim 1)': '105',
		};

		const result = buildFamEntries(csvRow, famTemplates, 1);

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			LearnDelFAMType: 'ACT',
			LearnDelFAMCode: '1',
			LearnDelFAMDateFrom: '2025-09-01',
			LearnDelFAMDateTo: '2026-08-31',
		});
		expect(result[1]).toEqual({
			LearnDelFAMType: 'SOF',
			LearnDelFAMCode: '105',
		});
	});

	it('builds FAM entries for bootcamp aim (1 FAM - ACT skipped)', () => {
		const csvRow = {
			'Contract type (aim 2)': '', // Empty - bootcamp has no ACT
			'Contract type code (aim 2)': '',
			'Source of funding (aim 2)': 'SOF',
			'Funding indicator (aim 2)': '116',
		};

		const result = buildFamEntries(csvRow, famTemplates, 2);

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			LearnDelFAMType: 'SOF',
			LearnDelFAMCode: '116',
		});
	});

	it('returns empty array for aim with no FAM data', () => {
		const csvRow = {
			'Contract type (aim 3)': '',
			'Source of funding (aim 3)': '',
		};

		const result = buildFamEntries(csvRow, famTemplates, 3);

		expect(result).toHaveLength(0);
	});

	it('handles case-insensitive column matching', () => {
		const csvRow = {
			'CONTRACT TYPE (AIM 1)': 'ACT',
			'contract type code (aim 1)': '1',
			'Source Of Funding (Aim 1)': 'SOF',
			'FUNDING INDICATOR (AIM 1)': '105',
		};

		const result = buildFamEntries(csvRow, famTemplates, 1);

		expect(result).toHaveLength(2);
	});

	it('returns empty array when templates undefined', () => {
		const csvRow = { 'Contract type (aim 1)': 'ACT' };
		const result = buildFamEntries(csvRow, undefined, 1);
		expect(result).toHaveLength(0);
	});
});

describe('buildAppFinRecords', () => {
	const appFinTemplates: AppFinTemplate[] = [
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
	];

	it('builds AppFinRecord entries for apprenticeship aim (2 records: TNP training + assessment)', () => {
		const csvRow = {
			'Financial type 1 (aim 1)': 'TNP',
			'Financial code 1 (aim 1)': '1',
			'Financial start date 1 (aim 1)': '2025-09-01',
			'Training price (aim 1)': '12000',
			'Financial type 2 (aim 1)': 'TNP',
			'Financial code 2 (aim 1)': '2',
			'Financial start date 2 (aim 1)': '2025-09-01',
			'Total assessment price (aim 1)': '3000',
		};

		const result = buildAppFinRecords(csvRow, appFinTemplates, 1);

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			AFinType: 'TNP',
			AFinCode: '1',
			AFinDate: '2025-09-01',
			AFinAmount: 12000,
		});
		expect(result[1]).toEqual({
			AFinType: 'TNP',
			AFinCode: '2',
			AFinDate: '2025-09-01',
			AFinAmount: 3000,
		});
	});

	it('builds empty array for bootcamp aim (no financial records)', () => {
		const csvRow = {
			'Financial type 1 (aim 2)': '', // Empty - bootcamp has no AppFinRecord
			'Financial code 1 (aim 2)': '',
			'Financial type 2 (aim 2)': '',
		};

		const result = buildAppFinRecords(csvRow, appFinTemplates, 2);

		expect(result).toHaveLength(0);
	});

	it('handles case-insensitive column matching', () => {
		const csvRow = {
			'FINANCIAL TYPE 1 (AIM 1)': 'TNP',
			'financial code 1 (aim 1)': '1',
			'Financial Start Date 1 (Aim 1)': '2025-09-01',
			'TRAINING PRICE (AIM 1)': '12000',
		};

		const result = buildAppFinRecords(csvRow, appFinTemplates, 1);

		expect(result).toHaveLength(1);
		expect(result[0].AFinAmount).toBe(12000);
	});

	it('returns empty array when templates undefined', () => {
		const csvRow = { 'Financial type 1 (aim 1)': 'TNP' };
		const result = buildAppFinRecords(csvRow, undefined, 1);
		expect(result).toHaveLength(0);
	});
});

describe('buildEmploymentStatuses', () => {
	const employmentConfigs: EmploymentStatusConfig[] = [
		{
			dateEmpStatAppCsv: 'Employment #1 date applies to',
			empStatCsv: 'Employment status #1',
			empIdCsv: 'Employer identifier #1 ',
			monitoring: [
				{ csvColumn: 'Small employer #1', esmType: 'SEM', transform: 'boolToInt' },
				{ csvColumn: 'Is the learner self employed? #1', esmType: 'SEI', transform: 'boolToInt' },
				{ csvColumn: 'Length of employment #1', esmType: 'LOE', transform: 'stringToInt' },
			],
		},
		{
			dateEmpStatAppCsv: 'Employment #2 date applies to',
			empStatCsv: 'Employment status #2',
			empIdCsv: 'Employer identifier #2',
			monitoring: [
				{ csvColumn: 'Small employer #2', esmType: 'SEM', transform: 'boolToInt' },
			],
		},
		{
			dateEmpStatAppCsv: 'Employment #3 date applies to',
			empStatCsv: 'Employment status #3',
			empIdCsv: 'Employer identifier #3',
			monitoring: [],
		},
	];

	it('builds 2 populated employment status entries, skips 1 empty', () => {
		const csvRow = {
			'Employment #1 date applies to': '2025-09-01',
			'Employment status #1': '10',
			'Employer identifier #1 ': '12345678',
			'Small employer #1': 'yes',
			'Is the learner self employed? #1': '0',
			'Length of employment #1': '6',
			'Employment #2 date applies to': '2026-01-01',
			'Employment status #2': '11',
			'Employer identifier #2': '87654321',
			'Small employer #2': '0',
			'Employment status #3': '', // Empty - skipped
		};

		const result = buildEmploymentStatuses(csvRow, employmentConfigs);

		expect(result).toHaveLength(2);

		expect(result[0]).toEqual({
			EmpStat: 10,
			DateEmpStatApp: '2025-09-01',
			EmpId: 12345678,
			EmploymentStatusMonitoring: [
				{ ESMType: 'SEM', ESMCode: 1 },
				// SEI: 0 now skipped (Bug 7 fix - omit spurious ESM/0 entries)
				{ ESMType: 'LOE', ESMCode: 6 },
			],
		});

		expect(result[1]).toEqual({
			EmpStat: 11,
			DateEmpStatApp: '2026-01-01',
			EmpId: 87654321,
			// EmploymentStatusMonitoring omitted (SEM: 0 skipped per Bug 7 fix)
		});
	});

	it('builds entry without EmpId when empty', () => {
		const csvRow = {
			'Employment #1 date applies to': '2025-09-01',
			'Employment status #1': '10',
			'Employer identifier #1 ': '', // Empty - not included
			'Small employer #1': 'yes',
		};

		const result = buildEmploymentStatuses(csvRow, employmentConfigs);

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			EmpStat: 10,
			DateEmpStatApp: '2025-09-01',
			EmploymentStatusMonitoring: [{ ESMType: 'SEM', ESMCode: 1 }],
		});
		expect(result[0].EmpId).toBeUndefined();
	});

	it('builds entry without monitoring when all monitoring fields empty', () => {
		const csvRow = {
			'Employment #1 date applies to': '2025-09-01',
			'Employment status #1': '10',
			'Employer identifier #1 ': '12345678',
			'Small employer #1': '',
			'Is the learner self employed? #1': '',
			'Length of employment #1': '',
		};

		const result = buildEmploymentStatuses(csvRow, employmentConfigs);

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			EmpStat: 10,
			DateEmpStatApp: '2025-09-01',
			EmpId: 12345678,
		});
		expect(result[0].EmploymentStatusMonitoring).toBeUndefined();
	});

	it('handles mixed monitoring fields (some empty, some populated)', () => {
		const csvRow = {
			'Employment #1 date applies to': '2025-09-01',
			'Employment status #1': '10',
			'Employer identifier #1 ': '12345678',
			'Small employer #1': 'yes',
			'Is the learner self employed? #1': '', // Empty - skipped
			'Length of employment #1': '6',
		};

		const result = buildEmploymentStatuses(csvRow, employmentConfigs);

		expect(result).toHaveLength(1);
		expect(result[0].EmploymentStatusMonitoring).toEqual([
			{ ESMType: 'SEM', ESMCode: 1 },
			{ ESMType: 'LOE', ESMCode: 6 },
		]);
	});

	it('handles case-insensitive column matching', () => {
		const csvRow = {
			'EMPLOYMENT #1 DATE APPLIES TO': '2025-09-01',
			'employment status #1': '10',
			'Small Employer #1': 'yes',
		};

		const result = buildEmploymentStatuses(csvRow, employmentConfigs);

		expect(result).toHaveLength(1);
		expect(result[0].EmpStat).toBe(10);
	});

	it('returns empty array when configs undefined', () => {
		const csvRow = { 'Employment status #1': '10' };
		const result = buildEmploymentStatuses(csvRow, undefined);
		expect(result).toHaveLength(0);
	});
});

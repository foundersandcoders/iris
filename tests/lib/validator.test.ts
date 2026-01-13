import { describe, it, expect } from 'vitest';
import { validateRows, type ValidationResult } from '../../src/lib/validator';
import type { CSVRow } from '../../src/lib/parser';

describe('validator', () => {
  describe('validateRows', () => {
    const validHeaders = [
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

    const validRow: CSVRow = {
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

    it('returns valid result for complete data', () => {
      const result = validateRows([validRow], validHeaders);

      expect(result.valid).toBe(true);
      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(0);
      expect(result.issues).toHaveLength(0);
    });

    it('detects missing required headers', () => {
      const incompleteHeaders = ['LearnRefNumber', 'ULN'];
      const result = validateRows([], incompleteHeaders);

      expect(result.valid).toBe(false);
      expect(result.errorCount).toBeGreaterThan(0);

      const missingHeaderIssues = result.issues.filter(
        (i) => i.code === 'MISSING_REQUIRED_HEADER'
      );
      expect(missingHeaderIssues.length).toBe(14); // 16 required - 2 provided
    });

    it('detects empty required fields in rows', () => {
      const rowWithEmptyField: CSVRow = {
        ...validRow,
        ULN: '',
      };

      const result = validateRows([rowWithEmptyField], validHeaders);

      expect(result.valid).toBe(false);
      expect(result.errorCount).toBe(1);

      const issue = result.issues[0];
      expect(issue.code).toBe('MISSING_REQUIRED_VALUE');
      expect(issue.field).toBe('ULN');
      expect(issue.row).toBe(0);
    });

    it('detects whitespace-only fields as empty', () => {
      const rowWithWhitespace: CSVRow = {
        ...validRow,
        LearnRefNumber: '   ',
      };

      const result = validateRows([rowWithWhitespace], validHeaders);

      expect(result.valid).toBe(false);
      const issue = result.issues.find((i) => i.field === 'LearnRefNumber');
      expect(issue).toBeDefined();
      expect(issue?.code).toBe('MISSING_REQUIRED_VALUE');
    });

    it('validates multiple rows independently', () => {
      const rows: CSVRow[] = [
        validRow,
        { ...validRow, ULN: '' },
        { ...validRow, Sex: '' },
      ];

      const result = validateRows(rows, validHeaders);

      expect(result.valid).toBe(false);
      expect(result.errorCount).toBe(2);

      const rowIndices = result.issues.map((i) => i.row);
      expect(rowIndices).toContain(1);
      expect(rowIndices).toContain(2);
      expect(rowIndices).not.toContain(0);
    });

    it('counts warnings separately from errors', () => {
      // Currently all issues are errors, but structure supports warnings
      const result = validateRows([validRow], validHeaders);

      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(0);
    });
  });
});
import { describe, it, expect } from 'vitest';
import { validateRows } from '../../src/lib/validator';
import * as fixtures from '../fixtures/validator';

describe('validator', () => {
  describe('validateRows', () => {
    it('returns valid result for complete data', () => {
      const result = validateRows([fixtures.validRow], fixtures.validHeaders);

      expect(result.valid).toBe(true);
      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(0);
      expect(result.issues).toHaveLength(0);
    });

    it('detects missing required headers', () => {
      const result = validateRows([], fixtures.incompleteHeaders);

      expect(result.valid).toBe(false);
      expect(result.errorCount).toBeGreaterThan(0);

      const missingHeaderIssues = result.issues.filter(
        (i) => i.code === 'MISSING_REQUIRED_HEADER'
      );
      expect(missingHeaderIssues.length).toBe(14); // 16 required - 2 provided
    });

    it('detects empty required fields in rows', () => {
      const result = validateRows([fixtures.rowWithEmptyULN], fixtures.validHeaders);

      expect(result.valid).toBe(false);
      expect(result.errorCount).toBe(1);

      const issue = result.issues[0];
      expect(issue.code).toBe('MISSING_REQUIRED_VALUE');
      expect(issue.field).toBe('ULN');
      expect(issue.row).toBe(0);
    });

    it('detects whitespace-only fields as empty', () => {
      const result = validateRows([fixtures.rowWithWhitespaceLearnRef], fixtures.validHeaders);

      expect(result.valid).toBe(false);
      const issue = result.issues.find((i) => i.field === 'LearnRefNumber');
      expect(issue).toBeDefined();
      expect(issue?.code).toBe('MISSING_REQUIRED_VALUE');
    });

    it('validates multiple rows independently', () => {
      const result = validateRows(fixtures.multipleRowsWithErrors, fixtures.validHeaders);

      expect(result.valid).toBe(false);
      expect(result.errorCount).toBe(2);

      const rowIndices = result.issues.map((i) => i.row);
      expect(rowIndices).toContain(1);
      expect(rowIndices).toContain(2);
      expect(rowIndices).not.toContain(0);
    });

    it('counts warnings separately from errors', () => {
      const result = validateRows([fixtures.validRow], fixtures.validHeaders);

      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(0);
    });
  });
});
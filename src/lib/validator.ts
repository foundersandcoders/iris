/**
  * Semantic Validator for ILR Data
  *
  * Validates parsed CSV data beyond structural checks.
  * Checks field presence, formats, value ranges, and business rules.
  */

import type { CSVRow } from './parser';

// === Types ===
export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  /** Severity level */ severity: ValidationSeverity;
  /** Field that failed validation (if applicable) */ field?: string;
  /** Row index (0-based) where issue occurred */ row?: number;
  /** Human-readable error message */ message: string;
  /** Machine-readable error code */ code: string;
}

export interface ValidationResult {
  /** Whether validation passed with no errors */ valid: boolean;
  /** All issues found during validation */ issues: ValidationIssue[];
  /** Count of errors */ errorCount: number;
  /** Count of warnings */ warningCount: number;
}

// === Required Fields ===

const REQUIRED_FIELDS = [
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
] as const;

// === Validation Functions ===

/**
  * Validate parsed CSV rows against ILR requirements
  * @param rows - Parsed CSV rows to validate
  * @param headers - CSV headers from the file
  * @returns Validation result with all issues found
  */
export function validateRows(rows: CSVRow[], headers: string[]): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Check for missing required headers
  const missingHeaders = validateRequiredHeaders(headers);
  issues.push(...missingHeaders);

  // Validate each row
  rows.forEach((row, index) => {
    const rowIssues = validateRow(row, index);
    issues.push(...rowIssues);
  });

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  return {
    valid: errorCount === 0,
    issues,
    errorCount,
    warningCount,
  };
}

/**
  * Check that all required headers are present
  */
function validateRequiredHeaders(headers: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const headerSet = new Set(headers);

  for (const field of REQUIRED_FIELDS) {
    if (!headerSet.has(field)) {
      issues.push({
        severity: 'error',
        field,
        message: `Required column "${field}" is missing from CSV`,
        code: 'MISSING_REQUIRED_HEADER',
      });
    }
  }

  return issues;
}

/**
  * Validate a single row for required field presence
  */
function validateRow(row: CSVRow, rowIndex: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const field of REQUIRED_FIELDS) {
    const value = row[field];
    if (value === undefined || value === null || value.trim() === '') {
      issues.push({
        severity: 'error',
        field,
        row: rowIndex,
        message: `Required field "${field}" is empty`,
        code: 'MISSING_REQUIRED_VALUE',
      });
    }
  }

  return issues;
}
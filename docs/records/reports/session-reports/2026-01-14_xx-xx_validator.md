# 2026-01-14: Semantic Validator

**Period:** 2026-01-13 to 2026-01-14
**Focus:** Implementing semantic validator for CSV input validation

---

## Summary

Implemented the semantic validator for ILR data, checking field presence and required values. Added comprehensive unit tests following the fixtures pattern established for the parser.

---

## Work Completed

### Validator Types (`src/lib/validator.ts`)
- `ValidationSeverity` - Error severity levels (error, warning, info)
- `ValidationIssue` - Individual validation problem with field, row, message, code
- `ValidationResult` - Overall result with valid flag, issues, and counts

### Validation Functions
- `validateRows()` - Main entry point for validating parsed CSV data
- `validateRequiredHeaders()` - Checks all required ILR columns are present
- `validateRow()` - Validates individual row for required field presence
- `REQUIRED_FIELDS` - List of 16 mandatory ILR fields

### Tests (`tests/lib/validator.test.ts`)
- Valid data passes validation
- Missing required headers detected
- Empty required fields detected
- Whitespace-only fields treated as empty
- Multiple rows validated independently
- Error and warning counts tracked separately

### Test Fixtures (`tests/fixtures/validator.ts`)
- Refactored tests to use fixtures pattern
- Shared test data: `validHeaders`, `validRow`, error case rows
- Consistent with parser fixture approach

### Documentation Updates
- Added Testing Conventions to `.claude/CLAUDE.md`
- Updated Project Structure with tests/fixtures layout
- Updated roadmap: validator and unit tests marked complete

---

## Files Created/Modified

- `src/lib/validator.ts` - Semantic validator (new)
- `tests/lib/validator.test.ts` - Validator tests (new)
- `tests/fixtures/validator.ts` - Test fixtures (new)
- `.claude/CLAUDE.md` - Testing conventions, code editing preference
- `docs/roadmaps/mvp.md` - Updated task status

---

## Technical Decisions

### Required Fields Approach
Defined a static list of 16 required ILR fields rather than deriving from schema. This is pragmatic for MVP - schema-driven validation can come later.

### Two-Phase Validation
1. Header validation (missing columns)
2. Row validation (empty values)

This allows early exit if structure is wrong, and provides row-level error context.

### Fixtures Pattern
Adopted consistent test data pattern across modules:
- `tests/fixtures/<module>.ts` exports named constants
- Tests import as `* as fixtures`
- Keeps test files focused on assertions

---

## Next Steps

- Implement storage abstraction for cross-submission history
- Add format validation (date patterns, ULN format, postcode format)
- Connect validator to TUI validate workflow

---

## References

- [MVP Roadmap](../../roadmaps/mvp.md)
- [Parser Tests](../../../tests/lib/parser.test.ts) - Fixtures pattern reference

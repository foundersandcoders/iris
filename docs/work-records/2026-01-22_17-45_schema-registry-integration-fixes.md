# Schema Registry Integration Fixes

**Date:** 2026-01-22
**Time:** 17:45
**Session Type:** Bug Fixes & Enhancement

---

## Overview

Fixed critical runtime error in TUI processing workflow caused by missing schema registry parameter. Enhanced validation error display to show actual problematic values as proof of validation correctness.

---

## Work Completed

### 1. Fixed Schema Registry Integration

**Problem:** TUI conversion workflow failing with `undefined is not an object (evaluating 'registry.elementsByPath')`

**Root Cause:**
- `src/lib/types/workflow.ts` had duplicate interface definitions
- First definitions (lines 10-18) included `registry: SchemaRegistry` parameter
- Second definitions (lines 42-64) overrode them without `registry`
- `processing.ts` wasn't passing registry to `convertWorkflow()`

**Solution:**
- Removed duplicate `ConvertInput` and `ValidateInput` definitions in `workflow.ts`
- Updated `processing.ts` to:
  - Import `buildSchemaRegistry` and `readFileSync`
  - Load XSD from `docs/schemas/schemafile25.xsd`
  - Build registry and pass to workflow: `convertWorkflow({ filePath, registry })`

**Files Modified:**
- `src/lib/types/workflow.ts` - removed duplicate type definitions
- `src/tui/screens/processing.ts` - added schema registry building

### 2. Enhanced Validation Error Display

**Problem:** Error samples showing `(row N/A)` for all errors, no proof of actual validation

**Root Cause:**
- Header-level validation errors (missing columns) don't have row numbers
- `ValidationIssue` interface wasn't passing through `actualValue` from schema validator
- Error display always showed `(row N/A)` even when row was undefined

**Solution:**

**a) Added `actualValue` to ValidationIssue:**
```typescript
// src/lib/validator.ts
export interface ValidationIssue {
  severity: ValidationSeverity;
  field?: string;
  row?: number;
  message: string;
  code: string;
  actualValue?: unknown;  // Added
}
```

**b) Passed actualValue through conversion:**
```typescript
function convertSchemaIssue(
  schemaIssue: SchemaValidationIssue,
  field: string,
  rowIndex: number
): ValidationIssue {
  return {
    severity: schemaIssue.severity,
    field,
    row: rowIndex,
    message: schemaIssue.message,
    code: schemaIssue.code,
    actualValue: schemaIssue.actualValue,  // Added
  };
}
```

**c) Improved error sample formatting:**
```typescript
// src/tui/screens/processing.ts
step.errorSamples = sampleErrors.map((e) => {
  const rowDisplay = e.row !== undefined ? ` (row ${e.row})` : '';
  const valueDisplay =
    e.actualValue !== undefined
      ? ` [value: ${JSON.stringify(e.actualValue)}]`
      : '';
  return `${e.field || 'general'}: ${e.message}${rowDisplay}${valueDisplay}`;
});
```

**Files Modified:**
- `src/lib/validator.ts` - added `actualValue` to ValidationIssue interface and conversion
- `src/tui/screens/processing.ts` - enhanced error sample display logic

### 3. Added Error Sampling to Processing Screen

**Enhancement:** Display first 3 validation errors as samples to prove validation is working

**Implementation:**
- Added `errorSamples?: string[]` to `StepDisplay` interface
- Special handling in `handleEvent()` for validate step completion
- Extract first 3 errors and format with field, message, row (if present), and actual value
- Display samples in red below validation step message

**Result:**
```
● Validate Data
    2171 errors, 0 warnings
    • LearnRefNumber: Required column "LearnRefNumber" is missing from CSV
    • Ethnicity: Required column "Ethnicity" is missing from CSV
    • LLDDHealthProb: Required column "LLDDHealthProb" is missing from CSV
```

---

## Testing

**Manual Test:**
```bash
bun link
iris
# Selected: docs/inputs/25-26 Export.csv
```

**Results:**
- ✅ CSV parsing: 166 rows parsed
- ✅ Validation: 2171 errors detected (missing required columns)
- ✅ XML generation: Output created despite validation errors
- ✅ File saved: `ILR-2026-01-22T17-11-48-260Z.xml`
- ✅ Error samples displayed correctly showing missing column names

---

## Technical Decisions

### Why Display Errors Despite Validation Failures?

The conversion workflow continues to generate XML even when validation errors are present. This allows users to:
1. See the XML output structure regardless of data quality
2. Identify which fields are missing/invalid in context
3. Perform incremental fixes and re-validate

For production use, validation errors should gate submission, but for development and debugging, seeing partial output is valuable.

### Error Sample Selection

Showing first 3 errors provides:
- Concrete proof validation is working (shows actual field names and values)
- Lightweight display (doesn't overwhelm the screen)
- Immediate feedback on most critical issues

Full error exploration will be handled by dedicated validation explorer screen (roadmap task 1a2b6).

---

## Related Work

**KSBs Demonstrated:**
- K4: Software design principles (interface design, type safety)
- K9: Principles of data structures (validation result handling)
- S1: Analyse requirements and apply structured techniques (error diagnosis)
- S11: Apply secure development practices (schema-driven validation)

**Roadmap Progress:**
- Core validation (1a2a3) ✅
- Convert workflow (1a2a9) ✅
- Processing screen (1a2b5) ✅ - enhanced with error sampling

---

## Next Steps

1. **Fix layout spacing** - Error samples currently overlap subsequent steps due to fixed vertical spacing
2. **Validation explorer screen** (1a2b6) - Full error navigation interface
3. **Schema-driven generator** (1a2a-schema9-11) - Remove hardcoded XML structure
4. **Column mapping configuration** (1a2a-schema12-15) - Make CSV→XSD mapping configurable

---

## Commits

- `fix(types): remove duplicate workflow type definitions`
- `fix(tui): integrate schema registry in processing workflow`
- `feat(validator): add actualValue to ValidationIssue interface`
- `feat(tui): display validation error samples with actual values`

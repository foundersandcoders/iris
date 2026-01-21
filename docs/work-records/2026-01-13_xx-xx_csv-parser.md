# 2026-01-13: CSV Parser Enhancement

**Period:** 2026-01-13
**Focus:** Robust CSV parsing for real Airtable exports

---

## Summary

Enhanced the CSV parser to handle real-world Airtable exports using papaparse. The naive comma-splitting was replaced with proper RFC 4180 parsing that handles quoted fields, escaped characters, and BOM markers.

---

## Work Completed

### Parser Enhancement (`src/lib/parser.ts`)
- Replaced naive `split(',')` with papaparse library
- Added `parseCSVContent()` export for browser/Tauri contexts
- Handles quoted fields with embedded commas
- Handles escaped quotes (`""`)
- Trims whitespace from headers (Airtable exports have trailing spaces)
- Handles BOM markers at file start
- Early validation for empty CSV files

### Test Infrastructure
- Created `tests/fixtures/parser.ts` for test fixtures
- Separated fixtures from test logic for accessibility/readability
- Added tests for:
  - Simple CSV parsing
  - Quoted fields with commas
  - Escaped quotes
  - Header whitespace trimming
  - BOM handling
  - Empty line skipping
  - Empty file detection
  - Empty field values

### Dependencies
- Added `papaparse` (runtime)
- Added `@types/papaparse` (dev)

---

## Files Created/Modified

- `src/lib/parser.ts` - Enhanced with papaparse
- `tests/lib/parser.test.ts` - Updated tests using fixtures
- `tests/fixtures/parser.ts` - Test fixtures (new)
- `docs/temp/25-26 Export.csv` - Real Airtable export for reference

---

## Technical Decisions

### Papaparse over manual parsing
- RFC 4180 compliance without reimplementing
- Battle-tested library, works in all contexts (Node, Bun, browser)
- Handles edge cases we'd otherwise miss

### Separate fixtures file
- Improves test file readability (functions can be folded)
- Accessibility consideration for ADHD - reduces wall-of-text effect
- Pattern established for future test files

### Dual export (`parseCSV` + `parseCSVContent`)
- `parseCSV(filePath)` - filesystem version for CLI/TUI
- `parseCSVContent(string)` - pure function for browser/Tauri

---

## Next Steps

- Build semantic validator (beyond structural checks)
- Implement storage abstraction for cross-submission history
- Connect parser to TUI convert workflow

---

## References

- [MVP Roadmap](../roadmaps/mvp.md)
- [papaparse documentation](https://www.papaparse.com/)

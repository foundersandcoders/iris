# CSV vs XML Validation

## Decision Required
Should CSV validation and XML validation be separate workflows, or unified under a single `validate` workflow?

---

## Context
- Milestone 1 requires a working transformation engine that can verify its own output
- We generate XML from CSV (convert workflow) but currently cannot validate the generated XML
- Without XML validation in the core library, we cannot prove the transformation engine produces compliant ILR submissions
- The `iris validate <file>` command (Milestone 3) explicitly targets "existing XML files"

---

## Options
### Option A: Unified workflow (`validate`)
- Single workflow that detects file type and branches internally
- Pros: Simple mental model, single entry point for validation
- Cons: Mixes concerns (pre-conversion CSV checks vs post-generation XML verification)

### Option B: Separate Workflows (`validate-csv`, `validate-xml`)
- Two distinct workflows with different purposes
- `validate-csv`: Pre-conversion checks (before XML generation)
- `validate-xml`: Post-generation verification (round-trip integrity, compliance checks)
- Pros: Clear separation of concerns, different validation rules for each
- Cons: More workflows to maintain

### Option C: Separate workflows + facade (`validate`, `validate-csv`, `validate-xml`)
- Explicit workflows for each format
- Generic `validate` workflow delegates to appropriate handler
- Pros: Best of both worlds - clear separation + convenient unified interface
- Cons: Additional abstraction layer

---

## Final Decision: Option B (separate workflows)
- CSV validation checks source data quality before transformation
- XML validation verifies generated output meets ILR compliance
- Different purposes, different validation rules, different error contexts
- Clearer for users: "validate my source data" vs "verify my generated submission"

### Milestone 1 Implications
- Milestone 1 **requires** XML parsing and validation to be considered complete
- Cannot claim "working transformation engine" without ability to verify XML output
- CSV validation alone is insufficient for production readiness

---

## Implementation Plan
1. Implement `validate-csv` workflow (current branch)
2. Add XML parser library (`fast-xml-parser`)
3. Implement `validate-xml` workflow (separate branch)
4. Update Milestone 1 deliverables to reflect both workflows
5. Mark Milestone 1 complete only when both validation workflows exist

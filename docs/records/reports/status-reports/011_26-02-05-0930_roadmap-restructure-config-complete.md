# Iris 3.2.0 - Status Update

## 1. What Happened

The Iris core library is now feature-complete for MVP (Milestone 1 finished). Spent the last two weeks polishing the config system and restructuring the project roadmap to reflect actual task granularity. All 502 tests passing. We're now transitioning into Milestone 2 (TUI interface), with keyboard navigation as the immediate blocker before any interactive screens can be built.

---

## 2. Shipped

- Complete config management system: Save/load custom field mappings and preferences to local filesystem with validation
- Mapping storage abstraction: List all available mappings, validate against active schema before use
- Roundtrip test suite: Full CSV → XML → validation pipeline working end-to-end (26+ new tests)
- Dynamic schema system (complete): Runtime XSD loading, schema-driven validation/generation, column mapping configuration
- Semantic validator: Beyond-XML validation for real-world ILR constraints (LLDD logic, dates, NI numbers)
- Cross-submission consistency checker: Compare submissions, detect missing learners and data drift
- Storage abstraction for history tracking: Supports configurations, mappings, schemas, submissions, and audit history

---

## 3. Currently Working On

Milestone 2 is blocked on keyboard navigation (2TI.11). Once that's in, all remaining TUI screens become unblocked. Currently staged changes to status report templates ahead of first Milestone 2 commits.

---

## 4. Up Next

- Build keyboard navigation abstraction (arrows, vim keys, custom bindings)
- Once navigation exists: Validation explorer (browse errors/warnings), convert workflow screen, validate workflow screen, success screen
- Direct commands for automation (iris convert, iris validate, iris check) — these don't need TUI, can build in parallel
- Desktop GUI via Tauri/SvelteKit (awaiting M2 workflows to adapt for desktop UX)

---

## 5. Worth Remembering

**Config system design**: Went through three iterations before landing on the right shape. Started with overly flexible JSON, then moved to strongly-typed interfaces with version tracking. The final design treats `configVersion`, `formatVersion`, and `mappingVersion` as independent concerns — allows upgrading file formats without breaking user data.

**Dynamic schema as foundational work**: Spending weeks on this paid off massively. ESFA changes XSD annually; building runtime schema loading meant we never have to hardcode validation rules or XML structure again.

**Test granularity**: Early test coverage was sparse and tightly coupled to UI. Refactored to split core workflows (load CSV, validate, generate XML) as pure functions independent of any interface. Makes testing trivial and gives us confidence across TUI, commands, and desktop.

**Milestone 1 is truly done**: 38 tasks completed. The core transformation engine is solid, well-tested, and ready for any interface to consume it.


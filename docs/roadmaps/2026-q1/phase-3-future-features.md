# Phase 3: Future Features

**Prerequisite:** [Phase 2: Production Features](./phase-2-production-features.md) — All of M3, M4, M5 complete

> [!NOTE]
> This phase contains exploratory features and enhancements beyond the core MVP.
> Tasks are not assigned IDs or dependencies — these are conceptual directions for future development.

---

## Post-Submission Error Prediction

> [!NOTE]
> Analyse ILR XML and predict ESFA validation errors before actual submission

| | Primary | Alternate |
|---|---------|-----------|
| **Requirements** | • Historical submission data<br>• Actual ESFA response storage | |
| **Plan** | Rule-based prediction based on past submission outcomes | 1. Embedded agent<br>2. Customised machine learning model |
| **Architecture Support** | Storage abstraction must handle ESFA response data (designed in Milestone 1) | |

---

## Cross-Submission Analysis

> [!NOTE]
> Advanced analysis of submission patterns over time

**Features:**
- Historical trend reporting (submission patterns over time)
- Anomaly detection across submission periods
- Statistical analysis of submission outcomes

---

## Declarative Transformation Layer

> [!NOTE]
> Make business logic configurable without code changes

**Features:**
- Define transformation rules in JSON/YAML
- Make business logic configurable without code changes
- Allow FaC staff to adjust rules themselves

---

## Enhanced Validation

> [!NOTE]
> More sophisticated validation capabilities

**Features:**
- Integration with ESFA validation API (if available)
- More sophisticated semantic checks
- Custom rule definitions for FaC-specific requirements

---

## Multi-Provider Support

> [!NOTE]
> Extend Iris beyond Founders and Coders

**Features:**
- Export configuration for other training providers
- Template system for different submission patterns
- Shareable transformation rule sets

---

## Dynamic Schema Extensions

> [!NOTE]
> Enhanced schema management features for desktop GUI

**Features:**
- Desktop UI for schema management (mirrors TUI functionality)
- Schema diff viewer (compare two XSD versions)
- Automated mapping suggestions when schema changes
- Schema validation report export

---

## Directory Migration Helper

> [!NOTE]
> Improve UX when users change output directory settings

**Features:**
- Offer to migrate directory contents when user changes `outputDir` in settings
- Prompt user before moving files
- Handle errors gracefully if source files are in use

---

**Previous:** [Phase 2: Production Features](./phase-2-production-features.md)

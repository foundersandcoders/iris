# Configuration File Formats

This document describes the structure and validation of Iris configuration and mapping files.

---

## Overview

Iris uses two main configuration file types:

1. **`IrisConfig`** — User preferences stored in `~/.iris/config.json`
2. **`MappingConfig`** — CSV-to-XSD column mapping definitions stored in `~/.iris/mappings/{id}.json`

Both are JSON files with runtime validation.

---

## IrisConfig

**Location:** `~/.iris/config.json`

**Purpose:** Stores user preferences for active schema and mapping selection.

### Schema

```typescript
interface IrisConfig {
	configVersion: number;    // Config file format version (for migration)
	activeSchema: string;     // Schema filename (e.g., "schemafile25.xsd")
	activeMapping: string;    // Mapping ID (e.g., "fac-airtable-2025")
}
```

### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `configVersion` | `number` | Yes | Config file schema version. Currently `1`. Used for future migration logic when config structure changes. |
| `activeSchema` | `string` | Yes | Filename of the active XSD schema. Must exist in `docs/schemas/` (bundled) or `~/.iris/schemas/` (user). |
| `activeMapping` | `string` | Yes | ID of the active mapping. Must match a bundled mapping (e.g., `'fac-airtable-2025'`) or user mapping in `~/.iris/mappings/`. |

### Default Values

```json
{
	"configVersion": 1,
	"activeSchema": "schemafile25.xsd",
	"activeMapping": "fac-airtable-2025"
}
```

### Validation

Config is validated on load (`storage.loadConfig()`). Invalid configs return a `StorageError` with code `INVALID_JSON`.

**Validation rules:**
- `configVersion` must be a positive integer
- `activeSchema` must be a non-empty string
- `activeMapping` must be a non-empty string

---

## MappingConfig

**Location:** `~/.iris/mappings/{id}.json` (user) or bundled in source code

**Purpose:** Defines how CSV columns map to ILR XSD paths, including learner-level fields, aim-level fields, FAM templates, AppFin templates, and employment statuses.

### Schema

```typescript
interface MappingConfig {
	id: string;
	name: string;
	mappingVersion: string;
	targetSchema: SchemaReference;
	aimDetectionField?: string;
	mappings: ColumnMapping[];
	famTemplates?: FamTemplate[];
	appFinTemplates?: AppFinTemplate[];
	employmentStatuses?: EmploymentStatusConfig[];
}

interface SchemaReference {
	namespace: string;
	version?: string;
	displayName?: string;
}

interface ColumnMapping {
	csvColumn: string;
	xsdPath: string;
	transform?: string;
	aimNumber?: number;
}

interface FamTemplate {
	type?: string;
	typeCsv?: string;
	codeCsv: string;
	dateFromCsv?: string;
	dateToCsv?: string;
}

interface AppFinTemplate {
	typeCsv: string;
	codeCsv: string;
	dateCsv: string;
	amountCsv: string;
}

interface EmploymentStatusConfig {
	dateEmpStatAppCsv: string;
	empStatCsv: string;
	empIdCsv: string;
	monitoring: EsmField[];
}

interface EsmField {
	csvColumn: string;
	esmType: string;
	transform: string;
}
```

### Top-Level Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique mapping identifier (e.g., `'fac-airtable-2025'`). Used for storage and selection. |
| `name` | `string` | Yes | Human-readable mapping name (e.g., `'Founders and Coders Airtable Export (2025-26)'`). |
| `mappingVersion` | `string` | Yes | Semver version of the mapping content (e.g., `'2.0.0'`). Incremented when mapping fields/transforms change. |
| `targetSchema` | `SchemaReference` | Yes | Reference to the XSD schema this mapping was designed for. |
| `aimDetectionField` | `string` | No | CSV column pattern to detect aim presence. Supports `{n}` placeholder (e.g., `'Programme aim {n} Learning ref '`). |
| `mappings` | `ColumnMapping[]` | Yes | Column-to-XSD mappings. Must have at least one entry. |
| `famTemplates` | `FamTemplate[]` | No | FAM (Funding and Monitoring) templates for aims. |
| `appFinTemplates` | `AppFinTemplate[]` | No | AppFin (Apprenticeship Financial) templates for aims. |
| `employmentStatuses` | `EmploymentStatusConfig[]` | No | Employment status configurations (0-6 sets). |

### SchemaReference Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `namespace` | `string` | Yes | XSD target namespace (e.g., `'ESFA/ILR/2025-26'`). Must match loaded schema. |
| `version` | `string` | No | XSD version attribute (e.g., `'1.0'`). Checked as warning (not error) if mismatch. |
| `displayName` | `string` | No | Human-readable schema name (e.g., `'ILR 2025-26 Schema'`). |

### ColumnMapping Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `csvColumn` | `string` | Yes | Exact CSV column name. Case-insensitive during processing. |
| `xsdPath` | `string` | Yes | Dot-notation XSD path (e.g., `'Message.Learner.LearnRefNumber'`). Must exist in schema. |
| `transform` | `string` | No | Transform function name (e.g., `'trim'`, `'stringToInt'`, `'postcode'`). |
| `aimNumber` | `number` | No | Aim number (1-5) for aim-level fields. Omit for learner-level fields. |

### FamTemplate Fields

FAM (Funding and Monitoring) templates define repeating FAM entries per aim.

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `string` | No* | Fixed FAM type code (e.g., `'FFI'`, `'SOF'`, `'ACT'`). Either this OR `typeCsv`. |
| `typeCsv` | `string` | No* | CSV column for FAM type (supports `{n}` placeholder). Either this OR `type`. |
| `codeCsv` | `string` | Yes | CSV column for FAM code (supports `{n}` placeholder). |
| `dateFromCsv` | `string` | No | CSV column for FAM start date (supports `{n}`). |
| `dateToCsv` | `string` | No | CSV column for FAM end date (supports `{n}`). |

**Example:**
```json
{
	"type": "FFI",
	"codeCsv": "Funding indicator (aim {n})"
}
```

### AppFinTemplate Fields

AppFin (Apprenticeship Financial) templates define financial records per aim.

| Field | Type | Required | Description |
|---|---|---|---|
| `typeCsv` | `string` | Yes | CSV column for financial type (supports `{n}`). |
| `codeCsv` | `string` | Yes | CSV column for financial code (supports `{n}`). |
| `dateCsv` | `string` | Yes | CSV column for financial date (supports `{n}`). |
| `amountCsv` | `string` | Yes | CSV column for financial amount (supports `{n}`). |

### EmploymentStatusConfig Fields

Employment status configurations define learner employment records (typically 0-6 sets).

| Field | Type | Required | Description |
|---|---|---|---|
| `dateEmpStatAppCsv` | `string` | Yes | CSV column for employment status date. |
| `empStatCsv` | `string` | Yes | CSV column for employment status code. |
| `empIdCsv` | `string` | Yes | CSV column for employer ID. |
| `monitoring` | `EsmField[]` | Yes | Array of monitoring fields (ESM codes). |

**EsmField:**
| Field | Type | Required | Description |
|---|---|---|---|
| `csvColumn` | `string` | Yes | Exact CSV column name (no `{n}` placeholder). |
| `esmType` | `string` | Yes | ESM type constant (e.g., `'SEM'`, `'SEI'`, `'REI'`). |
| `transform` | `string` | Yes | Transform to apply (e.g., `'stringToInt'`). |

---

## Validation Levels

Iris validates mapping configurations at two levels:

### 1. Structural Validation (on load)

**When:** User mappings loaded via `storage.loadMapping()`

**What:** Validates JSON structure matches `MappingConfig` type

**Checks:**
- All required fields present and correct type
- `id`, `name`, `mappingVersion` are non-empty strings
- `targetSchema.namespace` is a non-empty string
- `mappings` is a non-empty array
- Each mapping has `csvColumn` and `xsdPath`

**Error:** Returns `StorageError` with code `INVALID_JSON`

**Note:** Bundled mappings (TypeScript) skip structural validation (type-checked at compile time).

### 2. Schema Compatibility Validation (explicit)

**When:** Explicitly called via `validateSchemaCompatibility()` or `validateMappingCompatibility()`

**What:** Validates mapping is compatible with loaded XSD schema

**Checks:**
- Namespace match (critical — must match exactly)
- Version match (warning only — mismatches allowed)
- All `xsdPath` values in `mappings[]` exist in schema registry
- All builder-generated paths exist in schema (FAM, AppFin, LLDD, Employment)

**Builder paths checked:**
- FAM: `Message.Learner.LearningDelivery.LearningDeliveryFAM.{LearnDelFAMType, LearnDelFAMCode, LearnDelFAMDateFrom, LearnDelFAMDateTo}` (if `famTemplates` present)
- AppFin: `Message.Learner.LearningDelivery.AppFinRecord.{AFinType, AFinCode, AFinDate, AFinAmount}` (if `appFinTemplates` present)
- LLDD: `Message.Learner.{LLDDHealthProb, LLDDandHealthProblem.LLDDCat, LLDDandHealthProblem.PrimaryLLDD}` (always checked)
- Employment: `Message.Learner.LearnerEmploymentStatus.{EmpStat, DateEmpStatApp, EmpId, EmploymentStatusMonitoring.ESMType, EmploymentStatusMonitoring.ESMCode}` (if `employmentStatuses` present)

**Result:** `CompatibilityResult` with `compatible: boolean`, `errors: string[]`, `warnings: string[]`

---

## Versioning Strategy

Iris uses multiple version fields for different purposes:

### `IrisConfig.configVersion`

**Purpose:** Config file format version

**Type:** `number` (currently `1`)

**Usage:** Future migration logic when `IrisConfig` structure changes

**When to increment:** When adding/removing/renaming fields in `IrisConfig`

### `MappingConfig.mappingVersion`

**Purpose:** Mapping content version

**Type:** `string` (semver, e.g., `'2.0.0'`)

**Usage:** Track changes to mapping field definitions, transforms, templates

**When to increment:**
- Patch: Fix typo in CSV column name, adjust transform
- Minor: Add new field mappings, add template
- Major: Remove fields, change XSD paths, structural refactor

### `SchemaReference.version`

**Purpose:** Expected XSD schema version

**Type:** `string` (e.g., `'1.0'`)

**Usage:** Validate mapping designed for correct XSD version

**When to change:** When XSD schema version attribute changes

### `SubmissionHistory.formatVersion`

**Purpose:** Submission history file format version

**Type:** Literal `1`

**Usage:** Future migration of `submissions.json` structure

**When to increment:** When changing `SubmissionHistory` or `HistoryEntry` structure

---

## Creating Custom Mappings

### Step 1: Define the mapping structure

Create a JSON file with the required fields:

```json
{
	"id": "my-custom-mapping",
	"name": "My Custom ILR Mapping",
	"mappingVersion": "1.0.0",
	"targetSchema": {
		"namespace": "ESFA/ILR/2025-26",
		"version": "1.0",
		"displayName": "ILR 2025-26 Schema"
	},
	"mappings": [
		{
			"csvColumn": "Learner Reference",
			"xsdPath": "Message.Learner.LearnRefNumber"
		},
		{
			"csvColumn": "ULN",
			"xsdPath": "Message.Learner.ULN",
			"transform": "stringToInt"
		}
	]
}
```

### Step 2: Add aim-level fields (if needed)

Use `aimDetectionField` and `aimNumber`:

```json
{
	"aimDetectionField": "Programme aim {n} Learning ref ",
	"mappings": [
		{
			"csvColumn": "Programme aim {n} Learning ref ",
			"xsdPath": "Message.Learner.LearningDelivery.LearnAimRef",
			"aimNumber": 1
		}
	]
}
```

The `{n}` placeholder will be replaced with aim numbers 1-5.

### Step 3: Add templates (if needed)

**FAM:**
```json
{
	"famTemplates": [
		{
			"type": "FFI",
			"codeCsv": "Funding indicator (aim {n})"
		}
	]
}
```

**AppFin:**
```json
{
	"appFinTemplates": [
		{
			"typeCsv": "Financial type 1 (aim {n})",
			"codeCsv": "Financial code 1 (aim {n})",
			"dateCsv": "Financial start date 1 (aim {n})",
			"amountCsv": "Training price (aim {n})"
		}
	]
}
```

**Employment:**
```json
{
	"employmentStatuses": [
		{
			"dateEmpStatAppCsv": "Employment status date 1",
			"empStatCsv": "Employment status 1",
			"empIdCsv": "Employer ID 1",
			"monitoring": [
				{
					"csvColumn": "Employment status monitoring type 1 (ESM 1)",
					"esmType": "SEM",
					"transform": "stringToInt"
				}
			]
		}
	]
}
```

### Step 4: Save and validate

Save to `~/.iris/mappings/my-custom-mapping.json`

Validate using:
```typescript
import { validateMappingCompatibility } from './lib/mappings/compatibility';

const result = await validateMappingCompatibility({
	mapping: myMapping,
	schemaFile: 'schemafile25.xsd',
	storage,
});

if (result.success && result.compatibility?.compatible) {
	console.log('✓ Mapping is compatible');
} else {
	console.error('✗ Compatibility errors:', result.compatibility?.errors);
}
```

### Step 5: Activate

Update `~/.iris/config.json`:
```json
{
	"configVersion": 1,
	"activeSchema": "schemafile25.xsd",
	"activeMapping": "my-custom-mapping"
}
```

---

## Example: Complete Custom Mapping

```json
{
	"id": "example-mapping",
	"name": "Example Custom Mapping",
	"mappingVersion": "1.0.0",
	"targetSchema": {
		"namespace": "ESFA/ILR/2025-26",
		"version": "1.0",
		"displayName": "ILR 2025-26 Schema"
	},
	"aimDetectionField": "Programme aim {n} Learning ref ",
	"mappings": [
		{
			"csvColumn": "Learner Reference",
			"xsdPath": "Message.Learner.LearnRefNumber"
		},
		{
			"csvColumn": "ULN",
			"xsdPath": "Message.Learner.ULN",
			"transform": "stringToInt"
		},
		{
			"csvColumn": "Postcode",
			"xsdPath": "Message.Learner.Postcode",
			"transform": "postcode"
		},
		{
			"csvColumn": "Programme aim {n} Learning ref ",
			"xsdPath": "Message.Learner.LearningDelivery.LearnAimRef",
			"aimNumber": 1
		},
		{
			"csvColumn": "Start date (aim {n})",
			"xsdPath": "Message.Learner.LearningDelivery.LearnStartDate",
			"aimNumber": 1
		}
	],
	"famTemplates": [
		{
			"type": "FFI",
			"codeCsv": "Funding indicator (aim {n})"
		},
		{
			"type": "SOF",
			"codeCsv": "Source of funding (aim {n})"
		}
	],
	"appFinTemplates": [
		{
			"typeCsv": "Financial type 1 (aim {n})",
			"codeCsv": "Financial code 1 (aim {n})",
			"dateCsv": "Financial start date 1 (aim {n})",
			"amountCsv": "Training price (aim {n})"
		}
	],
	"employmentStatuses": [
		{
			"dateEmpStatAppCsv": "Employment status date 1",
			"empStatCsv": "Employment status 1",
			"empIdCsv": "Employer ID 1",
			"monitoring": [
				{
					"csvColumn": "Employment status monitoring type 1 (ESM 1)",
					"esmType": "SEM",
					"transform": "stringToInt"
				},
				{
					"csvColumn": "Employment status monitoring code 1 (ESM 1)",
					"esmType": "SEI",
					"transform": "stringToInt"
				}
			]
		}
	]
}
```

---

## Troubleshooting

### "Invalid mapping structure" error

**Cause:** Structural validation failed on load

**Fix:** Check that:
- All required fields present (`id`, `name`, `mappingVersion`, `targetSchema`, `mappings`)
- `mappings` array is not empty
- Each mapping has `csvColumn` and `xsdPath`
- Field types match schema (strings where expected, etc.)

### "Namespace mismatch" error

**Cause:** `mapping.targetSchema.namespace` doesn't match loaded schema

**Fix:** Update `targetSchema.namespace` to match XSD `targetNamespace` attribute

### "Invalid XSD path" error

**Cause:** `xsdPath` doesn't exist in loaded schema registry

**Fix:** Verify path spelling and structure against XSD. Use dot notation: `Message.Learner.FieldName`

### "Builder path not found" error

**Cause:** FAM/AppFin/LLDD/Employment paths don't exist in schema

**Fix:** Ensure loaded schema matches expected version. Builder paths are hardcoded for standard ILR schemas.

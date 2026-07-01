# schema-forge

## Extraction Guide

Step-by-step guide to extracting schema-forge from Iris into a standalone package. Every step is designed so that Iris continues working unchanged throughout — schema-forge is built *beside* Iris, then Iris switches to consuming it as a dependency at the very end.

### Step 1: Scaffold the package

Create a new repo `schema-forge/` (sibling to `iris/`, not inside it). Initialise with:

```bash
mkdir schema-forge && cd schema-forge
bun init
# Set name to "schema-forge" in package.json
```

Set up the directory structure:

```
schema-forge/
├── src/
│   ├── parse/
│   ├── registry/
│   ├── generate/
│   ├── validate/
│   ├── map/
│   ├── compatibility/
│   ├── xml/
│   └── types/
├── tests/
│   └── fixtures/
├── package.json
└── tsconfig.json
```

Add the single runtime dependency:

```bash
bun add fast-xml-parser@^5.3.3
bun add -d vitest typescript
```

Configure `package.json` subpath exports:

```jsonc
{
  "exports": {
    "./parse":         "./src/parse/index.ts",
    "./registry":      "./src/registry/index.ts",
    "./generate":      "./src/generate/index.ts",
    "./validate":      "./src/validate/index.ts",
    "./map":           "./src/map/index.ts",
    "./compatibility": "./src/compatibility/index.ts",
    "./xml":           "./src/xml/index.ts",
    "./types":         "./src/types/index.ts"
  }
}
```

### Step 2: Copy the generic core (no edits needed)

These files have zero ILR-specific logic. Copy them into schema-forge, adjusting import paths to match the new structure.

| Iris source | schema-forge destination | Notes |
|---|---|---|
| `src/lib/types/interpreterTypes.ts` | `src/types/interpreter.ts` | Pure types, no deps |
| `src/lib/schema/schemaParser.ts` | `src/parse/index.ts` | Only dep: `fast-xml-parser` |
| `src/lib/utils/schema/cardinality.ts` | `src/parse/cardinality.ts` | Deps: interpreter types, raw parser types |
| `src/lib/utils/schema/constraints.ts` | `src/parse/constraints.ts` | Deps: interpreter types, raw parser types |
| `src/lib/utils/schema/typeResolver.ts` | `src/parse/typeResolver.ts` | Deps: interpreter types, raw parser types, constraints |
| `src/lib/utils/schema/elementBuilder.ts` | `src/registry/elementBuilder.ts` | Deps: interpreter types, parse utilities |
| `src/lib/schema/registryBuilder.ts` | `src/registry/index.ts` | Deps: parse module, element builder, type resolver |
| `src/lib/schema/schemaValidator.ts` | `src/validate/index.ts` | Deps: interpreter types, schema validation types |
| `src/lib/utils/xml/xmlGenerator.ts` | `src/generate/index.ts` | Deps: interpreter types only |

After copying, fix all import paths. Every file should import from within schema-forge — no `../../` reaching into Iris.

Run tests after this step to confirm the core works standalone.

### Step 3: Extract validation and mapping types

`src/lib/types/schemaTypes.ts` is mixed — it contains both generic types and ILR-specific builder templates.

**Copy to schema-forge** (`src/types/schema.ts`), keeping only:

- `SchemaValidationSeverity`, `ConstraintViolationType`, `SchemaValidationIssue`, `SchemaValidationResult`
- `createIssue()`, `createEmptyResult()`, `computeResultStats()`
- `ColumnMapping`, `SchemaReference`, `MappingConfig` (generic mapping concepts)

**Leave in Iris:**

- `FamTemplate`, `AppFinTemplate`, `EsmField`, `EmploymentStatusConfig` (ILR builder templates)

Iris keeps its original `schemaTypes.ts` unchanged. It will import these generic types from schema-forge only after the final switchover (Step 8).

### Step 4: Genericise the column mapper

`src/lib/schema/columnMapper.ts` has significant ILR coupling:

- `../transforms/registry` → `getTransform()` (ILR date transforms)
- `../utils/config/mapping` → `hasAimData()` (ILR aim detection)
- `../mappings/builders` → `buildFamEntries()`, `buildAppFinRecords()`, etc.
- `../utils/uuid` → `generateUUID()`

**For schema-forge**, extract a generic `mapToSchema()` that accepts:

```ts
interface MapOptions {
  transforms?: Record<string, (value: string) => string>;  // named transform functions
  builders?: Record<string, (row: Record<string, string>) => Record<string, unknown>[]>;
  generateId?: () => string;  // UUID generator (default: crypto.randomUUID)
}
```

The generic mapper (`src/map/index.ts`) handles:
- Flat column→path mapping with optional transforms
- Builder injection at specified paths
- Repeatable element array creation

The ILR-specific `mapCsvToSchemaWithAims()` stays in Iris — it orchestrates the generic mapper with ILR builders, aim detection, and FAM/AppFin logic.

### Step 5: Genericise schema compatibility

`src/lib/schema/schemaCompatibility.ts` imports `builderPaths.ts` to check FAM, AppFin, Employment, and LLDD paths.

**For schema-forge**, make builder paths pluggable:

```ts
interface CompatibilityOptions {
  builderPaths?: string[];  // additional XSD paths to validate exist in schema
}

function validateSchemaCompatibility(
  mapping: MappingConfig,
  registry: SchemaRegistry,
  options?: CompatibilityOptions
): CompatibilityResult;
```

Iris passes its ILR-specific builder paths via the options. Schema-forge validates them generically.

### Step 6: Create generic XML parser

`src/lib/utils/xml/xmlParser.ts` is ILR-specific (`parseILR()`, `extractLearner()`, etc.).

**For schema-forge** (`src/xml/index.ts`), create a generic parser:

```ts
interface ParseXmlOptions<T extends Record<string, unknown>> {
  extractors?: { [K in keyof T]: (parsed: unknown) => T[K] };
  arrayHeuristics?: (elementName: string, parentName: string) => boolean;
}

function parseXml<T extends Record<string, unknown>>(
  xml: string,
  options?: ParseXmlOptions<T>
): ParseSuccess<T> | ParseError;
```

The core XML validation and `fast-xml-parser` setup lives in schema-forge. Iris implements `parseILR()` on top of this generic parser, passing ILR extractors.

### Step 7: Copy and adapt tests

| Iris tests | schema-forge destination | Notes |
|---|---|---|
| `tests/lib/schema/schemaParser.test.ts` | `tests/parse/` | Generic, copy directly |
| `tests/lib/utils/schema/*.test.ts` | `tests/parse/` | cardinality, constraints, typeResolver |
| `tests/lib/schema/registryBuilder-related tests` | `tests/registry/` | Generic |
| `tests/lib/schema/schemaValidator.test.ts` | `tests/validate/` | Generic |
| `tests/lib/utils/xml/xmlGenerator.test.ts` | `tests/generate/` | Generic |
| `tests/fixtures/lib/schema.ts` | `tests/fixtures/` | Generic schema fixtures |
| `tests/fixtures/lib/utils/xml/xmlGenerator.ts` | `tests/fixtures/` | Generic XML fixtures |

**Stay in Iris:**
- `tests/lib/utils/xml/xmlParser.test.ts` (ILR-specific)
- `tests/fixtures/lib/utils/xml/xmlParser.ts` (ILR XML fixtures)
- Any tests for `mapCsvToSchemaWithAims` or ILR builders

New tests needed for genericised modules:
- Generic mapper with pluggable transforms and builders
- Schema compatibility with custom builder paths
- Generic XML parser with custom extractors

### Step 8: Switchover — Iris consumes schema-forge

Only after schema-forge is working standalone with passing tests:

```bash
# From iris/
bun add ../schema-forge   # or publish and install from npm
```

Replace Iris imports incrementally, module by module:

```ts
// Before (Iris internal)
import { buildSchemaRegistry } from "../lib/schema/registryBuilder";
import { SchemaRegistry } from "../lib/types/interpreterTypes";

// After (schema-forge)
import { buildSchemaRegistry } from "schema-forge/registry";
import type { SchemaRegistry } from "schema-forge/types";
```

Run Iris tests after each module switch. Once all imports point to schema-forge, delete the copied source files from Iris.

**Order of switchover** (least to most coupled):
1. `types` — pure types, no runtime behaviour
2. `parse` — no Iris consumers depend on raw parsing directly
3. `registry` — used everywhere, but a clean swap
4. `validate` — standalone value validation
5. `generate` — XML generation
6. `compatibility` — update to pass builder paths via options
7. `map` — most coupled; update `mapCsvToSchemaWithAims` to call generic mapper with ILR config
8. `xml` — rewrite `parseILR` to use generic parser with ILR extractors

### Step 9: Clean up Iris

After switchover is complete and all tests pass:

- Delete extracted source files from `src/lib/schema/`, `src/lib/utils/schema/`, `src/lib/utils/xml/xmlGenerator.ts`
- Delete extracted type definitions from `src/lib/types/` (keep ILR-specific ones)
- Delete copied test files and fixtures
- Update `src/lib/schema/index.ts` to re-export from schema-forge (or remove entirely)
- Verify no remaining internal imports to deleted files

### Step 10: Publish

```bash
cd schema-forge
# Final checks
bun test
bun run build  # if using a build step

npm publish     # or bun publish
```

Then switch Iris from the local path dependency to the published version:

```bash
cd iris
bun add schema-forge   # from npm registry
```

---

A modular TypeScript toolkit for working with XSD schemas at runtime. Parse XSD files into queryable registries, generate schema-compliant XML from arbitrary data, validate values against schema constraints, and map flat data sources into nested schema structures.

## Why schema-forge?

Most XML tooling falls into two camps: heavyweight code-generation pipelines that produce rigid, schema-specific classes, or low-level DOM manipulation with no schema awareness. schema-forge occupies the middle ground — it interprets XSD schemas at runtime to drive validation, generation, and data mapping without any build step or code generation.

This makes it ideal for applications that need to:

- Support multiple schema versions without recompiling
- Let users supply their own XSD files
- Map messy real-world data (CSV, flat records) into deeply nested XML structures
- Validate individual values against XSD constraints before generating output

## Core Concepts

### SchemaRegistry

The central data structure. A `SchemaRegistry` is the typed, queryable representation of a parsed XSD. It contains:

- A recursive tree of `SchemaElement` nodes (mirroring the XSD structure)
- Lookup maps for fast access by path (`Message.Learner.ULN`) or by name (`ULN`)
- Resolved named types with their constraints
- Namespace and version metadata

```ts
import { buildSchemaRegistry } from "schema-forge/registry";

const xsd = fs.readFileSync("schema.xsd", "utf-8");
const registry = buildSchemaRegistry(xsd);

// Query elements by path
const element = registry.elementsByPath.get("Message.Learner.ULN");
// → SchemaElement { name: 'ULN', baseType: 'string', constraints: { pattern: ['\\d{10}'], ... } }

// Query elements by name (returns array — names may not be unique)
const matches = registry.elementsByName.get("ULN");
```

### SchemaElement

Each node in the registry tree. Captures everything schema-forge needs to validate and generate:

- `name` — Element name
- `path` — Dot-notation path from root (e.g. `Message.Learner.ULN`)
- `baseType` — Resolved XSD base type (`string`, `int`, `decimal`, `date`, `boolean`, etc.)
- `constraints` — Restriction facets (pattern, minLength, maxLength, minInclusive, maxInclusive, enumeration, etc.)
- `cardinality` — `{ min, max }` occurrence bounds
- `children` — Child elements (for complex types)
- `isComplex` — Whether this element has children
- `documentation` — Optional, extracted from `xs:annotation`

## Modules

schema-forge is organised as opt-in subpath exports. Import only what you need.

### `schema-forge/parse`

Low-level XSD parsing. Converts raw XSD XML into intermediate structures.

```ts
import { parseXsd, extractNamespace, extractElements } from "schema-forge/parse";

const parsed = parseXsd(xsdContent);
const namespace = extractNamespace(parsed);
const elements = extractElements(parsed);
```

Most consumers won't use this directly — `schema-forge/registry` wraps it into a higher-level API.

### `schema-forge/registry`

Builds a `SchemaRegistry` from raw XSD content. This is the primary entry point for most use cases.

```ts
import { buildSchemaRegistry } from "schema-forge/registry";

const registry = buildSchemaRegistry(xsdContent, {
  includeDocumentation: true, // extract xs:annotation docs
  resolveNamedTypes: true,    // inline named type constraints (default: true)
});
```

### `schema-forge/generate`

Schema-driven XML generation. Traverses the `SchemaRegistry` to produce XML from flat or nested data objects.

```ts
import { generateFromSchema } from "schema-forge/generate";

const result = generateFromSchema(data, registry, {
  indent: 2,          // indentation (default: 2)
  namespace: "...",   // override namespace
  validate: true,     // warn on constraint violations (default: true)
});

console.log(result.xml);       // the generated XML string
console.log(result.warnings);  // any schema violations encountered
```

Key behaviours:

- Respects element ordering defined in the schema
- Handles cardinality (repeatable elements as arrays)
- Omits optional elements when data is absent
- Escapes XML special characters
- Includes `xmlns` and `xsi` namespace declarations on root
- Returns warnings (not errors) for missing required elements or type mismatches — generation always produces output

### `schema-forge/validate`

Value-level validation against `SchemaElement` constraints.

```ts
import { validateValue } from "schema-forge/validate";

const element = registry.elementsByPath.get("Message.Learner.ULN");
const issues = validateValue("123", element, {
  rowIndex: 0,
  sourceField: "ULN",
});

// issues: [{ severity: 'error', type: 'pattern', message: '...', constraint: '\\d{10}', actualValue: '123' }]
```

Validates:

- **Presence** — Required elements must have values
- **Type** — Value must be coercible to the schema's base type (int, decimal, date, boolean, etc.)
- **Pattern** — Regex patterns from `xs:pattern`
- **Length** — `minLength`, `maxLength`
- **Range** — `minInclusive`, `maxInclusive`, `minExclusive`, `maxExclusive`
- **Enumeration** — Value must be in allowed set

Each issue includes severity (`error` | `warning` | `info`), violation type, human-readable message, the constraint that failed, and the actual value.

### `schema-forge/map`

Maps flat key-value data (e.g. CSV rows) into nested objects matching schema structure, via declarative column mappings.

```ts
import { mapCsvToSchema } from "schema-forge/map";

const mappings = [
  { csvColumn: "Student ID", xsdPath: "Message.Learner.LearnRefNumber" },
  { csvColumn: "Date of Birth", xsdPath: "Message.Learner.DateOfBirth", transform: "isoDate" },
  { csvColumn: "Postcode", xsdPath: "Message.Learner.Postcode" },
];

const nested = mapCsvToSchema(csvRow, mappings, registry);
// → { Message: { Learner: { LearnRefNumber: "ABC123", DateOfBirth: "1990-05-15", Postcode: "E1 6AN" } } }
```

Features:

- Case-insensitive column matching
- Transform functions (e.g. date format conversion)
- Automatic intermediate object creation
- Respects repeatable elements (creates arrays where cardinality allows)

For complex repeating elements that can't be expressed as simple column→path mappings (e.g. a variable number of sub-records derived from multiple columns), see the [Custom Builders](#custom-builders) pattern below.

### `schema-forge/compatibility`

Validates that a mapping configuration is compatible with a loaded schema.

```ts
import { validateSchemaCompatibility } from "schema-forge/compatibility";

const result = validateSchemaCompatibility(mappingConfig, registry);

if (!result.compatible) {
  console.error(result.errors);
  // e.g. "Namespace mismatch", "Path 'Message.Foo.Bar' not found in schema"
}
```

Checks:

- Namespace match (critical error if mismatched)
- Version match (warning if mismatched)
- All mapped XSD paths exist in the registry
- Builder paths exist in the registry

### `schema-forge/xml`

Generic XML parsing with extension points. Parses XML content into structured data, with hooks for custom extraction logic.

```ts
import { parseXml } from "schema-forge/xml";

const result = parseXml(xmlContent, {
  extractors: {
    // Define custom extraction functions for your domain
    header: (parsed) => extractMyHeader(parsed),
    records: (parsed) => extractMyRecords(parsed),
  },
  arrayHeuristics: (name, parent) => {
    // Tell the parser which elements should be treated as arrays
    return ["Record", "Item"].includes(name);
  },
});
```

The parser handles XML validation, structural parsing (via `fast-xml-parser`), and error reporting. Domain-specific extraction logic is provided by the consumer through the `extractors` option.

## Custom Builders

Some schema structures can't be expressed as flat column→path mappings. For example, a single CSV row might contain columns for multiple related sub-records (e.g. `FAM Type 1`, `FAM Code 1`, `FAM Type 2`, `FAM Code 2`), each of which maps to a repeating child element.

schema-forge's mapping module supports this through builder functions — functions you write that receive raw row data and return arrays of nested objects matching the schema structure.

### Pattern

A builder function takes a data row and returns structured objects matching schema element paths:

```ts
type Builder = (row: Record<string, string>) => Record<string, unknown>[];
```

### Example: Conditional repeating elements

Say your schema has a repeating `Tag` element under `Record`, and your CSV has columns `Tag1Type`, `Tag1Code`, `Tag2Type`, `Tag2Code`:

```ts
function buildTags(row: Record<string, string>): Record<string, unknown>[] {
  const tags: Record<string, unknown>[] = [];

  for (const n of [1, 2]) {
    const type = row[`Tag${n}Type`]?.trim();
    const code = row[`Tag${n}Code`]?.trim();

    if (type && code) {
      tags.push({ TagType: type, TagCode: code });
    }
  }

  return tags;
}
```

### Example: Conditional inclusion

Skip generating an element based on other field values:

```ts
function buildOptionalDetail(row: Record<string, string>): Record<string, unknown>[] {
  const status = row["Status"]?.trim();

  // Only include detail record for active entries
  if (status !== "Active") return [];

  return [{
    DetailType: row["DetailType"]?.trim(),
    DetailDate: toIsoDate(row["DetailDate"]),
  }];
}
```

Builders compose naturally with `mapCsvToSchema` — the mapping module injects builder output into the correct position in the nested structure based on the target XSD path.

## Type Exports

All types are available from `schema-forge/types`:

```ts
import type {
  // Core
  SchemaRegistry,
  SchemaElement,
  SchemaConstraints,
  Cardinality,
  XsdBaseType,
  NamedSimpleType,

  // Validation
  SchemaValidationIssue,
  SchemaValidationResult,
  SchemaValidationSeverity,
  ConstraintViolationType,

  // Mapping
  ColumnMapping,
  MappingConfig,

  // Compatibility
  CompatibilityResult,
} from "schema-forge/types";
```

Utility functions for working with types:

```ts
import { isRequired, isRepeatable, isOptional } from "schema-forge/types";

if (isRequired(element)) { /* ... */ }
if (isRepeatable(element)) { /* ... */ }
```

## Supported XSD Features

schema-forge handles a practical subset of XSD:

| Feature | Supported |
|---|---|
| `xs:element` (simple & complex) | Yes |
| `xs:complexType` with `xs:sequence` | Yes |
| `xs:simpleType` with `xs:restriction` | Yes |
| Named type references | Yes (resolved recursively) |
| `minOccurs` / `maxOccurs` | Yes (including `unbounded`) |
| `xs:pattern` | Yes (multiple patterns) |
| `xs:minLength` / `xs:maxLength` | Yes |
| `xs:minInclusive` / `xs:maxInclusive` | Yes |
| `xs:minExclusive` / `xs:maxExclusive` | Yes |
| `xs:totalDigits` / `xs:fractionDigits` | Yes |
| `xs:enumeration` | Yes |
| `xs:annotation` / `xs:documentation` | Yes (opt-in) |
| Base types: string, int, integer, long, decimal, date, dateTime, boolean | Yes |
| `xs:choice` | No |
| `xs:attributeGroup` / `xs:attribute` | No |
| `xs:import` / `xs:include` | No |
| `xs:extension` (complex content) | No |

## Package Structure

```
schema-forge/
├── src/
│   ├── parse/          # XSD parsing (low-level)
│   ├── registry/       # SchemaRegistry builder (primary entry)
│   ├── generate/       # XML generation from data + registry
│   ├── validate/       # Value validation against constraints
│   ├── map/            # CSV/flat data → nested schema mapping
│   ├── compatibility/  # Mapping ↔ schema compatibility checks
│   ├── xml/            # Generic XML parsing with extension hooks
│   └── types/          # All type exports
├── package.json
└── tsconfig.json
```

## Dependencies

- **`fast-xml-parser`** — XML/XSD parsing (the only runtime dependency)

## License

TBD

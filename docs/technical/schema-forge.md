# schema-forge

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

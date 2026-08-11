# schema-forge

Iris consumes its XSD engine from [`@jasonwarrenuk/schema-forge`](https://www.npmjs.com/package/@jasonwarrenuk/schema-forge), published from [JasonWarrenUK/schema-forge](https://github.com/JasonWarrenUK/schema-forge).

The extraction is complete. This document records the outcome; the step-by-step extraction plan it used to hold is no longer useful and has been removed.

## What moved

Sixteen modules, roughly 2000 lines, left `src/lib/` for the package:

| Area | Modules |
|---|---|
| Parsing | `schemaParser`, `cardinality`, `constraints`, `elementBuilder`, `typeResolver` |
| Registry | `registryBuilder` |
| Validation | `schemaValidator`, `csvValidator` |
| Mapping | `columnMapper`, `schemaCompatibility` |
| Generation | `xmlGenerator` |
| Transforms | `transforms/registry` |
| CSV | `csvParser` |
| Types | `interpreterTypes`, `schemaTypes` |

184 tests moved with them. They live in schema-forge now and are not duplicated here.

## What stayed

Everything ILR-specific, which is the point of the split:

- `src/lib/mappings/`: the ILR orchestrator (`ilrColumnMapper`), builders, `builderPaths`, `fac-airtable-2025`
- `src/lib/types/ilrMappingTypes.ts`: `FamTemplate`, `AppFinTemplate`, `EsmField`, `EmploymentStatusConfig`, `IlrMappingConfig`
- `src/lib/workflows/`: the CSV convert, validate, cross-check and XML validate pipelines
- `tests/lib/schema/schemafile25.test.ts`: ILR schema conformance
- `tests/lib/utils/csv/csvValidator.test.ts`: depends on `facAirtableMapping` and `createAimSkipFilter`

The engine has no knowledge of ILR. `grep -rin ilr` across the package returns nothing.

## Importing

Everything comes from the package root. There are no subpath exports.

```ts
import { buildSchemaRegistry, validateValue, generateFromSchema } from '@jasonwarrenuk/schema-forge';
import type { SchemaRegistry, SchemaElement, ColumnMapping } from '@jasonwarrenuk/schema-forge';
```

## Two things to know

**The package ships raw TypeScript.** No build step, no `dist/`. That works because Iris is Bun and Vite throughout, and it means a change in schema-forge needs no compile before Iris can consume it. It also means the package is unusable to a plain Node consumer, which is a deliberate trade rather than an oversight.

**The sync workflow is gone.** `sync-engine.yml` used to force-push these files from Iris into schema-forge on every push to main. The dependency now runs the other way: schema-forge is canonical, and engine changes are made there and released. Do not reintroduce a sync.

## Making an engine change

1. Change and test it in the schema-forge repo
2. Publish a new version
3. `bun update @jasonwarrenuk/schema-forge` here, and run the suites

For local iteration across both repos, `bun link` in schema-forge and `bun link @jasonwarrenuk/schema-forge` here avoids a publish round-trip. Undo it with `bun unlink` before committing, so the lockfile keeps pointing at the registry.

## Known gaps

Carried over from Iris, tracked in schema-forge and documented in its README:

- `xs:choice`, `xs:all`, `xs:attribute`, `xs:include`/`xs:import` and named `xs:complexType` references are dropped silently
- `totalDigits` and `fractionDigits` are parsed but not enforced
- `mapCsvToSchema` does not sanitise `xsdPath`, so a mapping config from an untrusted source can reach `Object.prototype`
- `validateRows` ships untested; its Iris tests were too ILR-coupled to move

None is a regression: they are the state the code was already in, now visible in one place.

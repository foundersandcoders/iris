/** ====== Minimal SchemaRegistry Test Fixture ======
 * A hand-built SchemaRegistry standing in for buildSchemaRegistry's real
 * output, scoped to what mapping-editor.test.ts's grouped-display tests need:
 * a handful of Learner leaf paths, one nested LearnerHE container, and
 * cardinality info for isEffectivelyRequired.
 */
import type { SchemaElement, SchemaRegistry } from '@jasonwarrenuk/schema-forge';

function leaf(path: string, required: boolean): SchemaElement {
	return {
		name: path.split('.').slice(-1)[0],
		path,
		baseType: 'string',
		constraints: {},
		cardinality: { min: required ? 1 : 0, max: 1 },
		children: [],
		isComplex: false,
	};
}

function complex(path: string): SchemaElement {
	return {
		name: path.split('.').slice(-1)[0],
		path,
		baseType: 'string',
		constraints: {},
		cardinality: { min: 0, max: 1 },
		children: [],
		isComplex: true,
	};
}

/** Learner: two direct required-ish fields, plus a nested LearnerHE
 *  container with one field of its own. Mirrors the real schema's shape
 *  (a container's own fields ahead of a nested child group) at a scale
 *  small enough to assert on directly. */
export function buildTestRegistry(): SchemaRegistry {
	const elements: SchemaElement[] = [
		complex('Message.Learner'),
		leaf('Message.Learner.ULN', true),
		leaf('Message.Learner.Sex', true),
		leaf('Message.Learner.DOB', false),
		complex('Message.Learner.LearnerHE'),
		leaf('Message.Learner.LearnerHE.UCASPERID', false),
	];

	const elementsByPath = new Map(elements.map((el) => [el.path, el]));
	const elementsByName = new Map<string, SchemaElement[]>();
	for (const el of elements) {
		const existing = elementsByName.get(el.name);
		if (existing) existing.push(el);
		else elementsByName.set(el.name, [el]);
	}

	return {
		namespace: 'ESFA/ILR/2025-26',
		rootElement: elements[0],
		elementsByPath,
		elementsByName,
		namedTypes: new Map(),
	};
}

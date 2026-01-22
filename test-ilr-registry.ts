import { readFileSync } from 'fs';
import { buildSchemaRegistry } from './src/lib/schema/registryBuilder';
import { SchemaRegistry } from './src/lib/schema/interpreter';

/**
 * Opens a console group with a decorative header that includes the provided name to mark a new logging section.
 */
function zoomIn(name: string): void {
	console.group(`|•|======|| ${name} ||====>>`);
}
/**
 * Ends the current console group and prints a decorative separator sized to `name`.
 *
 * Closes the active console group, logs a horizontal separator line whose length is derived from the length of `name`, and then logs an empty line via `loggy` for spacing.
 *
 * @param name - Label used to determine the length of the separator line
 */
function zoomOut(name: string): void {
	let filler = '';
	let x = 0;

	while (x <= name.length) {
		filler += '—';
		x++;
	}

	console.groupEnd();
	console.log(`|•|————————${filler}————————|`);
	loggy('');
}
/**
 * Logs a single-line message prefixed with a vertical bar and space.
 *
 * @param msg - The message text to log
 */
function loggy(msg: string): void {
	console.log(`| ${msg}`);
}

/**
 * Runs a sample end-to-end test that builds a SchemaRegistry from a local XSD and logs inspection results.
 *
 * Builds a registry from 'docs/schemas/schemafile25.xsd', performs example element and named-type lookups, and emits structured console output summarizing the registry contents.
 */
function realWorldTest() {
	zoomIn('Real World Test');

	const registry = buildEmUp('docs/schemas/schemafile25.xsd');
	lookEmUp(registry);

	zoomOut('Real World Test');
}

/**
 * Builds a SchemaRegistry from a predefined XSD file and logs summary metadata.
 *
 * @param filepath - Ignored by this function; the XSD is read from 'docs/schemas/schemafile25.xsd'.
 * @returns The constructed SchemaRegistry
 */
function buildEmUp(filepath: string) {
	zoomIn('Building Registry');
	const xsd = readFileSync('docs/schemas/schemafile25.xsd', 'utf-8');
	const registry = buildSchemaRegistry(xsd);

	loggy(`Registry built successfully!`);
	loggy(`Namespace: ${registry.namespace}`);
	loggy(`Root element: ${registry.rootElement.name}`);
	loggy(`Root is complex: ${registry.rootElement.isComplex}`);
	loggy(`Root children: ${registry.rootElement.children.length}`);
	loggy(`Total elements by path: ${registry.elementsByPath.size}`);
	loggy(`Total named types: ${registry.namedTypes.size}`);

	zoomOut('Building Registry');

	return registry;
}

/**
 * Performs sample lookups against a SchemaRegistry and logs discovered element and type metadata.
 *
 * Conducts path-based queries for several predefined elements and a named type, logging whether each
 * item was found and key observable properties such as base type, relevant constraints, complexity,
 * cardinality, and child count.
 *
 * @param registry - The SchemaRegistry to inspect; lookup results are written to the console.
 */
function lookEmUp(registry: SchemaRegistry) {
	zoomIn('Sample Element Lookups');
	zoomIn('Message > Learner > ULN');
	const uln = registry.elementsByPath.get('Message/Learner/ULN');
	loggy('Message/Learner/ULN:');
	loggy('Found:' + !!uln);
	if (uln) {
		loggy('Base type:' + uln.baseType);
		loggy('Pattern:' + uln.constraints.pattern);
		loggy('Min length:' + uln.constraints.minLength);
		loggy('Max length:' + uln.constraints.maxLength);
	}
	zoomOut('Message > Learner > ULN');

	zoomIn('Message > Header > Source > UKPRN');
	const ukprn = registry.elementsByPath.get('Message/Header/Source/UKPRN');
	loggy('Message/Header/Source/UKPRN:');
	loggy('Found:' + !!ukprn);
	if (ukprn) {
		loggy('Base type:' + ukprn.baseType);
		loggy('Min inclusive:' + ukprn.constraints.minInclusive);
		loggy('Max inclusive:' + ukprn.constraints.maxInclusive);
	}
	zoomOut('Message > Header > Source > UKPRN');

	zoomIn('Message > Learner');
	const learner = registry.elementsByPath.get('Message/Learner');
	loggy('Message/Learner:');
	loggy('Found:' + !!learner);
	if (learner) {
		loggy('Is complex:' + learner.isComplex);
		loggy('Cardinality:' + learner.cardinality);
		loggy('Children:' + learner.children.length);
	}
	zoomOut('Message > Learner');
	zoomOut('Sample Element Lookups');

	// Check named types
	zoomIn('Named Types');
	const restrictedString = registry.namedTypes.get('RestrictedString');
	loggy('RestrictedString:');
	loggy('Found:' + !!restrictedString);
	if (restrictedString) {
		loggy('Base type:' + restrictedString.baseType);
		loggy('Has pattern:' + !!restrictedString.constraints.pattern);
	}
	zoomOut('Named Types');
}

realWorldTest();
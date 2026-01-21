import { readFileSync } from 'fs';
import { buildSchemaRegistry } from './src/lib/schema/registryBuilder';
import { SchemaRegistry } from './src/lib/schema/interpreter';

function zoomIn(name: string): void {
	console.group(`|•|======|| ${name} ||====>>`);
}
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
function loggy(msg: string): void {
	console.log(`| ${msg}`);
}

function realWorldTest() {
	zoomIn('Real World Test');

	const registry = buildEmUp('docs/schemas/schemafile25.xsd');
	lookEmUp(registry);

	zoomOut('Real World Test');
}

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

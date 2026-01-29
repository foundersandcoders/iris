/** |===================|| Schema Compatibility Validation ||==================|
 *  | Validates that a mapping configuration is compatible with a loaded schema
 *  |==========================================================================|
 */

import type { MappingConfig, SchemaReference } from '../types/schemaTypes';
import type { SchemaRegistry } from '../types/interpreterTypes';

export interface CompatibilityResult {
	compatible: boolean;
	errors: string[];
	warnings: string[];
}

/**
 * Check if a mapping config is compatible with a loaded schema registry
 */
export function validateSchemaCompatibility(
	mapping: MappingConfig,
	registry: SchemaRegistry
): CompatibilityResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	const expected = mapping.targetSchema;
	const actual = {
		namespace: registry.namespace,
		version: registry.version,
		file: registry.sourceFile,
	};

	// Check namespace match (critical)
	if (expected.namespace !== actual.namespace) {
		errors.push(
			`Namespace mismatch: mapping expects "${expected.namespace}" but registry has "${actual.namespace}"`
		);
	}

	// Check version match (warning only - may work across minor versions)
	if (expected.version && actual.version && expected.version !== actual.version) {
		warnings.push(
			`Version mismatch: mapping expects v${expected.version} but registry has v${actual.version}`
		);
	}

	// Validate all XSD paths exist in registry
	for (const columnMapping of mapping.mappings) {
		if (!registry.elementsByPath.has(columnMapping.xsdPath)) {
			errors.push(
				`Invalid XSD path "${columnMapping.xsdPath}" for column "${columnMapping.csvColumn}"`
			);
		}
	}

	return {
		compatible: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Format compatibility result for display
 */
export function formatCompatibilityError(
	mapping: MappingConfig,
	registry: SchemaRegistry,
	result: CompatibilityResult
): string {
	const lines: string[] = ['❌ Mapping Incompatibility Error\n'];

	lines.push(`Mapping: ${mapping.name} (${mapping.id})`);
	lines.push(`  Expects: ${mapping.targetSchema.displayName || mapping.targetSchema.namespace}`);
	if (mapping.targetSchema.version) {
		lines.push(`  Version: ${mapping.targetSchema.version}`);
	}
	lines.push('');

	lines.push('Currently Loaded:');
	lines.push(`  Namespace: ${registry.namespace}`);
	if (registry.version) {
		lines.push(`  Version: ${registry.version}`);
	}
	if (registry.sourceFile) {
		lines.push(`  File: ${registry.sourceFile}`);
	}
	lines.push('');

	if (result.errors.length > 0) {
		lines.push('Errors:');
		for (const err of result.errors) lines.push(`  • ${err}`);
		lines.push('');
	}

	if (result.warnings.length > 0) {
		lines.push('Warnings:');
		for (const warn of result.warnings) lines.push(`  ⚠ ${warn}`);
		lines.push('');
	}

	return lines.join('\n');
}

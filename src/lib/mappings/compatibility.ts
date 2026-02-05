/**
 * Mapping-schema compatibility orchestration.
 * Loads schema, builds registry, and validates compatibility in one call.
 */

import type { MappingConfig } from '../types/schemaTypes';
import type { IrisStorage } from '../storage';
import { buildSchemaRegistry } from '../schema/registryBuilder';
import { validateSchemaCompatibility, type CompatibilityResult } from '../schema/schemaCompatibility';

export interface MappingCompatibilityResult {
	success: boolean;
	compatibility?: CompatibilityResult;
	error?: string;
}

/**
 * Validate that a mapping is compatible with a schema file.
 * Loads the schema, builds registry, and checks compatibility.
 */
export async function validateMappingCompatibility(params: {
	mapping: MappingConfig;
	schemaFile: string;
	storage: IrisStorage;
}): Promise<MappingCompatibilityResult> {
	const { mapping, schemaFile, storage } = params;

	// Load schema file
	const schemaResult = await storage.loadSchema(schemaFile);
	if (!schemaResult.success) {
		return {
			success: false,
			error: `Failed to load schema "${schemaFile}": ${schemaResult.error.message}`,
		};
	}

	// Build schema registry
	let registry;
	try {
		registry = buildSchemaRegistry(schemaResult.data);
	} catch (error) {
		return {
			success: false,
			error: `Failed to build schema registry: ${(error as Error).message}`,
		};
	}

	// Validate compatibility
	const compatibility = validateSchemaCompatibility(mapping, registry);

	return {
		success: true,
		compatibility,
	};
}

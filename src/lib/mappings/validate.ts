/** |===================|| Mapping Validation ||==================|
 *  | Runtime validation of MappingConfig structure.
 *  | Follows the same pattern as validateConfig().
 *  |=============================================================|
 */

/** Validation issue for mapping validation */
export interface MappingValidationIssue {
	field: string;
	message: string;
}

/** Result of mapping validation */
export interface MappingValidationResult {
	valid: boolean;
	issues: MappingValidationIssue[];
}

/**
 * Validate mapping configuration structure and values
 * @param mapping - Mapping object to validate (typed as unknown for runtime validation)
 * @returns Validation result with any issues found
 */
export function validateMappingStructure(mapping: unknown): MappingValidationResult {
	const issues: MappingValidationIssue[] = [];

	// Type guard
	if (typeof mapping !== 'object' || mapping === null) {
		return { valid: false, issues: [{ field: 'mapping', message: 'Mapping must be an object' }] };
	}

	const m = mapping as Record<string, unknown>;

	// id
	if (typeof m.id !== 'string' || m.id.trim() === '') {
		issues.push({ field: 'id', message: 'Must be a non-empty string' });
	}

	// name
	if (typeof m.name !== 'string' || m.name.trim() === '') {
		issues.push({ field: 'name', message: 'Must be a non-empty string' });
	}

	// version
	if (typeof m.version !== 'string' || m.version.trim() === '') {
		issues.push({ field: 'version', message: 'Must be a non-empty string' });
	}

	// targetSchema
	if (typeof m.targetSchema !== 'object' || m.targetSchema === null) {
		issues.push({ field: 'targetSchema', message: 'Must be an object' });
	} else {
		const schema = m.targetSchema as Record<string, unknown>;
		if (typeof schema.namespace !== 'string' || schema.namespace.trim() === '') {
			issues.push({ field: 'targetSchema.namespace', message: 'Must be a non-empty string' });
		}
		// version and displayName are optional, but if present must be strings
		if (schema.version !== undefined && typeof schema.version !== 'string') {
			issues.push({ field: 'targetSchema.version', message: 'Must be a string if provided' });
		}
		if (schema.displayName !== undefined && typeof schema.displayName !== 'string') {
			issues.push({ field: 'targetSchema.displayName', message: 'Must be a string if provided' });
		}
	}

	// mappings
	if (!Array.isArray(m.mappings)) {
		issues.push({ field: 'mappings', message: 'Must be an array' });
	} else if (m.mappings.length === 0) {
		issues.push({ field: 'mappings', message: 'Must contain at least one mapping' });
	} else {
		// Validate each mapping entry
		m.mappings.forEach((entry, index) => {
			if (typeof entry !== 'object' || entry === null) {
				issues.push({ field: `mappings[${index}]`, message: 'Must be an object' });
				return;
			}

			const e = entry as Record<string, unknown>;
			if (typeof e.csvColumn !== 'string' || e.csvColumn.trim() === '') {
				issues.push({
					field: `mappings[${index}].csvColumn`,
					message: 'Must be a non-empty string',
				});
			}
			if (typeof e.xsdPath !== 'string' || e.xsdPath.trim() === '') {
				issues.push({ field: `mappings[${index}].xsdPath`, message: 'Must be a non-empty string' });
			}
			// transform and aimNumber are optional, no validation needed
		});
	}

	// Optional fields: if present, must be arrays (lightweight check)
	if (m.famTemplates !== undefined && !Array.isArray(m.famTemplates)) {
		issues.push({ field: 'famTemplates', message: 'Must be an array if provided' });
	}
	if (m.appFinTemplates !== undefined && !Array.isArray(m.appFinTemplates)) {
		issues.push({ field: 'appFinTemplates', message: 'Must be an array if provided' });
	}
	if (m.employmentStatuses !== undefined && !Array.isArray(m.employmentStatuses)) {
		issues.push({ field: 'employmentStatuses', message: 'Must be an array if provided' });
	}

	return {
		valid: issues.length === 0,
		issues,
	};
}

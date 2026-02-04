/** |===================|| Configuration Types ||==================|
 *  | User preferences, provider settings, and field mappings.
 *  | Loads from storage with fallback to defaults.
 *  |==============================================================|
 */

import { createStorage } from '../storage';
import packageJson from '../../../package.json';

export interface ProviderConfig {
	ukprn: number;
	name?: string;
}

export interface SubmissionConfig {
	softwareSupplier?: string;
	softwarePackage?: string;
}

export interface IrisConfig {
	/** Config file format version (for future migration logic) */
	configVersion: number;
	provider: ProviderConfig;
	submission: SubmissionConfig;
	/** Active schema filename (e.g. 'schemafile25.xsd') */
	activeSchema: string;
	/** Active mapping ID (e.g. 'fac-airtable-2025') */
	activeMapping: string;
	/** Collection type (e.g. 'ILR') */
	collection?: string;
	/** Serial number for amalgamation (2-char, defaults to '01') */
	serialNo?: string;
	/** Custom output directory for submissions */
	outputDir?: string;
}

/** Default configuration values */
export const DEFAULT_CONFIG: IrisConfig = {
	configVersion: 1,
	provider: {
		ukprn: 10000000,
		name: 'Founders and Coders',
	},
	submission: {
		softwareSupplier: 'Founders and Coders',
		softwarePackage: 'Iris',
	},
	activeSchema: 'schemafile25.xsd',
	activeMapping: 'fac-airtable-2025',
	collection: 'ILR',
	serialNo: '01',
};

/** Validation issue for config validation */
export interface ConfigValidationIssue {
	field: string;
	message: string;
}

/** Result of config validation */
export interface ConfigValidationResult {
	valid: boolean;
	issues: ConfigValidationIssue[];
}

/**
 * Validate configuration structure and values
 * @param config - Configuration object to validate (typed as unknown for runtime validation)
 * @returns Validation result with any issues found
 */
export function validateConfig(config: unknown): ConfigValidationResult {
	const issues: ConfigValidationIssue[] = [];

	// Type guard
	if (typeof config !== 'object' || config === null) {
		return { valid: false, issues: [{ field: 'config', message: 'Config must be an object' }] };
	}

	const c = config as Record<string, unknown>;

	// configVersion
	if (
		typeof c.configVersion !== 'number' ||
		c.configVersion < 1 ||
		!Number.isInteger(c.configVersion)
	) {
		issues.push({ field: 'configVersion', message: 'Must be a positive integer' });
	}

	// provider.ukprn
	if (typeof c.provider !== 'object' || c.provider === null) {
		issues.push({ field: 'provider', message: 'Must be an object' });
	} else {
		const provider = c.provider as Record<string, unknown>;
		if (typeof provider.ukprn !== 'number' || !Number.isInteger(provider.ukprn)) {
			issues.push({ field: 'provider.ukprn', message: 'Must be a number' });
		} else {
			const ukprnStr = provider.ukprn.toString();
			if (ukprnStr.length !== 8) {
				issues.push({ field: 'provider.ukprn', message: 'Must be an 8-digit number' });
			}
		}
	}

	// activeSchema
	if (typeof c.activeSchema !== 'string' || c.activeSchema.trim() === '') {
		issues.push({ field: 'activeSchema', message: 'Must be a non-empty string' });
	}

	// activeMapping
	if (typeof c.activeMapping !== 'string' || c.activeMapping.trim() === '') {
		issues.push({ field: 'activeMapping', message: 'Must be a non-empty string' });
	}

	// collection (optional)
	if (c.collection !== undefined) {
		if (typeof c.collection !== 'string' || c.collection.length !== 3) {
			issues.push({ field: 'collection', message: 'Must be a 3-character string' });
		}
	}

	// serialNo (optional)
	if (c.serialNo !== undefined) {
		if (typeof c.serialNo !== 'string' || c.serialNo.length !== 2) {
			issues.push({ field: 'serialNo', message: 'Must be a 2-character string' });
		}
	}

	return {
		valid: issues.length === 0,
		issues,
	};
}

/**
 * Get configuration from storage
 * Loads from ~/.iris/config.json if exists, otherwise returns defaults
 *
 * @returns Configuration with user settings or defaults
 * @throws If storage fails to read config (not if file missing - that returns defaults)
 */
export async function getConfig(): Promise<IrisConfig> {
	const storage = createStorage();
	const result = await storage.loadConfig();

	// Storage returns defaults if file doesn't exist
	// Only fails on actual read/parse errors
	if (!result.success) {
		throw new Error(`Failed to load config: ${result.error.message}`);
	}

	return result.data;
}

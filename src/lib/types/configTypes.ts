/** |===================|| Configuration Types ||==================|
 *  | User preferences, provider settings, and field mappings.
 *  | Loads from storage with fallback to defaults.
 *  |==============================================================|
 */

import { createStorage } from '../storage';

export interface ProviderConfig {
	ukprn: number;
	name?: string;
}

export interface SubmissionConfig {
	softwareSupplier?: string;
	softwarePackage?: string;
	release?: string;
}

/**
 * Column mapping configuration (Phase 4)
 * Maps CSV column names to XSD element paths
 *
 * @example
 * {
 *   "LearnRefNumber": "Message.Learner.LearnRefNumber",
 *   "ULN": "Message.Learner.ULN"
 * }
 */
export interface ColumnMapping {
	[csvColumn: string]: string; // XSD path
}

export interface IrisConfig {
	provider: ProviderConfig;
	submission: SubmissionConfig;
	/** Phase 4 - not yet implemented */
	columnMapping?: ColumnMapping;
	outputDir?: string;
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

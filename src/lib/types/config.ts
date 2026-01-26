/** |===================|| Configuration Types ||==================|
 *  | User preferences, provider settings, and field mappings.
 *  | Phase 4 implementation stub - API contract defined here.
 *  |==============================================================|
 */

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
 * Get configuration (stub implementation)
 * TODO: Implement config loading from ~/.iris/config.json
 *
 * @returns Default configuration with placeholder UKPRN
 */
export function getConfig(): IrisConfig {
	return {
		provider: {
			ukprn: 10000000, // TODO: Load from ~/.iris/config.json
			name: 'Founders and Coders', // TODO: Load from ~/.iris/config.json
		},
		submission: {
			softwareSupplier: 'Founders and Coders',
			softwarePackage: 'Iris',
			release: '1.3.0',
		},
	};
}

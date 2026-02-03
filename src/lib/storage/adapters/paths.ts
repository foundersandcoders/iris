/** |===================|| Storage Paths ||==================|
 *  | Cross-platform path construction for Iris storage.
 *  | Internal: ~/.iris (config, history, schemas)
 *  | Output: ~/Documents/Iris (user-visible submissions)
 *  |=========================================================|
 */
import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';

export interface StoragePaths {
	// Internal (hidden)
	internal: string; // ~/.iris
	config: string; // ~/.iris/config.json
	mappings: string; // ~/.iris/mappings/
	schemas: string; // ~/.iris/schemas/
	history: string; // ~/.iris/history/
	reports: string; // ~/.iris/reports/

	// User output (visible)
	output: string; // ~/Documents/Iris (or config.outputDir)
	submissions: string; // ~/Documents/Iris/submissions/
}

/** Get default output directory for user-visible files (cross-platform) */
export function getDefaultOutputDir(): string {
	const home = homedir();
	const documentsDir = join(home, 'Documents');

	// Check if Documents exists (standard on most systems)
	if (existsSync(documentsDir)) {
		return join(documentsDir, 'Iris');
	}

	// Fallback to ~/Iris if Documents doesn't exist
	return join(home, 'Iris');
}

export interface StoragePathsOptions {
	outputDir?: string;
	internalRoot?: string; // For testing: override ~/.iris
}

/**
 * Construct all Iris storage paths
 * @param options - Optional overrides for output and internal directories
 */
export function getStoragePaths(options: StoragePathsOptions = {}): StoragePaths {
	const home = homedir();
	const internal = options.internalRoot ?? join(home, '.iris');
	const output = options.outputDir ?? getDefaultOutputDir();

	return {
		// Internal
		internal,
		config: join(internal, 'config.json'),
		mappings: join(internal, 'mappings'),
		schemas: join(internal, 'schemas'),
		history: join(internal, 'history'),
		reports: join(internal, 'reports'),

		// Output
		output,
		submissions: join(output, 'submissions'),
	};
}

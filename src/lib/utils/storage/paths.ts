/** |===================|| Storage Paths ||==================|
 *  | Cross-platform path construction for Iris storage.
 *  | Internal: ~/.iris (config, history, mappings)
 *  | Output: ~/Documents/Iris (user-visible submissions, schemas)
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
	schemas: string; // ~/Documents/Iris/schemas/ (or config.schemaDir)
	history: string; // ~/.iris/history/
	reports: string; // ~/.iris/reports/
	internalSubmissions: string; // ~/.iris/submissions/ (metadata only)

	// User output (visible)
	output: string; // ~/Documents/Iris (or config.outputDir)
	submissions: string; // ~/Documents/Iris/submissions/
}

/** Get default schema directory for user XSD files (cross-platform) */
export function getDefaultSchemaDir(): string {
	const home = homedir();
	const documentsDir = join(home, 'Documents');
	if (existsSync(documentsDir)) {
		return join(documentsDir, 'Iris', 'Schemas');
	}
	return join(home, 'Iris', 'Schemas');
}

/** Get default CSV input directory with cascade: ~/Downloads/Airtable/ → ~/Downloads/ → cwd */
export function getDefaultCsvInputDir(): string {
	const home = homedir();

	// First try: ~/Downloads/Airtable/
	const airtableDir = join(home, 'Downloads', 'Airtable');
	if (existsSync(airtableDir)) {
		return airtableDir;
	}

	// Second try: ~/Downloads/
	const downloadsDir = join(home, 'Downloads');
	if (existsSync(downloadsDir)) {
		return downloadsDir;
	}

	// Final fallback: current working directory
	return process.cwd();
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
	schemaDir?: string;
	internalRoot?: string; // For testing: override ~/.iris
}

/**
 * Construct all Iris storage paths
 * @param options - Optional overrides for output and internal directories
 */
export function getStoragePaths(options: StoragePathsOptions = {}): StoragePaths {
	const home = homedir();
	const internal = options.internalRoot ?? join(home, '.iris');

	// If user explicitly configured outputDir, use it as-is (final destination)
	// Otherwise use default with /Submissions appended
	const output = options.outputDir ?? getDefaultOutputDir();
	const submissions = options.outputDir ?? join(getDefaultOutputDir(), 'Submissions');

	return {
		// Internal
		internal,
		config: join(internal, 'config.json'),
		mappings: join(internal, 'mappings'),
		schemas: options.schemaDir
			?? (options.internalRoot ? join(internal, 'schemas') : getDefaultSchemaDir()),
		history: join(internal, 'history'),
		reports: join(internal, 'reports'),
		internalSubmissions: join(internal, 'submissions'),

		// Output
		output,
		submissions,
	};
}

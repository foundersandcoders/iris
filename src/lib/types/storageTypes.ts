/** |===================|| Storage Types ||==================|
 *  | Type definitions for storage operations, results, and
 *  | submission metadata/history.
 *  |=========================================================|
 */

import type { StorageError } from '../storage/errors';
import type { StoragePaths } from '../utils/storage/paths';

export type { StoragePaths } from '../utils/storage/paths';

/**
 * Result type for storage operations (explicit error handling)
 */
export type StorageResult<T> = { success: true; data: T } | { success: false; error: StorageError };

/**
 * Options for listing files
 */
export interface ListOptions {
	pattern?: string; // glob pattern, e.g. "*.json"
	sortBy?: 'name' | 'modified' | 'created';
	order?: 'asc' | 'desc';
}

/**
 * Metadata for a submission (saved alongside XML)
 */
export interface SubmissionMetadata {
	timestamp: string; // ISO 8601
	learnerCount: number;
	schema: string; // Schema namespace used
	checksum?: string; // SHA256 of XML content
}

/**
 * Summary info about a submission (for listing)
 */
export interface SubmissionInfo {
	filename: string;
	path: string;
	metadata?: SubmissionMetadata;
	size: number;
	modified: Date;
}

/**
 * Cross-submission history entry
 */
export interface HistoryEntry {
	filename: string;
	timestamp: string;
	learnerCount: number;
	checksum: string;
	schema: string;
	learnerRefs?: string[]; // For cross-check
}

/**
 * Cross-submission history structure
 */
export interface SubmissionHistory {
	version: 1;
	submissions: HistoryEntry[];
}

/**
 * Low-level storage adapter interface
 */
export interface StorageAdapter {
	// Read operations
	read(path: string): Promise<string>;
	readJson<T>(path: string): Promise<T>;
	exists(path: string): Promise<boolean>;

	// Write operations
	write(path: string, content: string): Promise<void>;
	writeJson<T>(path: string, data: T): Promise<void>;

	// Directory operations
	list(dir: string, options?: ListOptions): Promise<string[]>;
	ensureDir(dir: string): Promise<void>;

	// Delete operations
	delete(path: string): Promise<void>;
}

/**
 * High-level storage interface
 */
export interface IrisStorage {
	readonly paths: StoragePaths;

	// Lifecycle
	init(): Promise<StorageResult<void>>;

	// Config
	loadConfig(): Promise<StorageResult<import('../types/configTypes').IrisConfig>>;
	saveConfig(config: import('../types/configTypes').IrisConfig): Promise<StorageResult<void>>;

	// Mappings
	loadMapping(id: string): Promise<StorageResult<import('../types/schemaTypes').MappingConfig>>;
	saveMapping(mapping: import('../types/schemaTypes').MappingConfig): Promise<StorageResult<void>>;
	listMappings(): Promise<StorageResult<string[]>>;

	// Schemas
	loadSchema(name: string): Promise<StorageResult<string>>;
	listSchemas(): Promise<StorageResult<string[]>>;

	// Submissions
	saveSubmission(xml: string, metadata?: SubmissionMetadata): Promise<StorageResult<string>>;
	listSubmissions(): Promise<StorageResult<SubmissionInfo[]>>;

	// History (cross-submission checks)
	loadHistory(): Promise<StorageResult<SubmissionHistory>>;
	appendHistory(entry: HistoryEntry): Promise<StorageResult<void>>;
}

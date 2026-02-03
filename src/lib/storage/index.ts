/** |===================|| Storage Module ||==================|
 *  | Public API for Iris storage operations.
 *  |==========================================================|
 */
export { createStorage } from './storage';
export { getStoragePaths, getDefaultOutputDir } from './adapters/paths';
export { StorageError } from './errors';
export { createBunAdapter } from './adapters/bun';

// Re-export types
export type {
	StoragePaths,
	StorageResult,
	StorageAdapter,
	IrisStorage,
	ListOptions,
	SubmissionMetadata,
	SubmissionInfo,
	SubmissionHistory,
	HistoryEntry,
} from '../types/storageTypes';

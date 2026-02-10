/** |===================|| Iris Storage ||==================|
 *  | High-level storage API for Iris data management.
 *  | Handles config, mappings, schemas, submissions, history.
 *  |========================================================|
 */
import { join, basename } from 'path';
import { stat } from 'fs/promises';
import type {
	IrisStorage,
	StorageAdapter,
	StorageResult,
	SubmissionMetadata,
	SubmissionInfo,
	SubmissionHistory,
	HistoryEntry,
} from '../types/storageTypes';
import { DEFAULT_CONFIG, validateConfig, type IrisConfig } from '../types/configTypes';
import type { MappingConfig } from '../types/schemaTypes';
import { getStoragePaths, type StoragePaths } from '../utils/storage/paths';
import { StorageError } from './errors';
import { createBunAdapter } from './adapters/bun';
import { facAirtableMapping } from '../mappings/fac-airtable-2025';
import { validateMappingStructure } from '../mappings/validate';
import packageJson from '../../../package.json';

// Embed schema for compiled binary
import bundledSchemaXsd from '../../../docs/schemas/schemafile25.xsd' with { type: 'text' };

/** Bundled schema dir, resolved relative to this file (not cwd).
 *  create.ts is at src/lib/storage/ — project root is 3 levels up. */
const BUNDLED_SCHEMA_DIR = join(import.meta.dir, '..', '..', '..', 'docs', 'schemas');

/** Map of embedded schemas (available in compiled binary) */
const BUNDLED_SCHEMAS: Record<string, string> = {
	'schemafile25.xsd': bundledSchemaXsd,
};

interface StorageOptions {
	outputDir?: string;
	schemaDir?: string;
	internalRoot?: string;
	adapter?: StorageAdapter;
}

export function createStorage(options: StorageOptions = {}): IrisStorage {
	const paths = getStoragePaths({
		outputDir: options.outputDir,
		schemaDir: options.schemaDir,
		internalRoot: options.internalRoot,
	});
	const adapter = options.adapter ?? createBunAdapter();

	return {
		paths,

		// === Lifecycle ===
		async init(): Promise<StorageResult<void>> {
			try {
				// Ensure all internal directories exist
				await adapter.ensureDir(paths.internal);
				await adapter.ensureDir(paths.mappings);
				await adapter.ensureDir(paths.schemas);
				await adapter.ensureDir(paths.history);
				await adapter.ensureDir(paths.reports);
				await adapter.ensureDir(paths.internalSubmissions);

				// Ensure output directories exist
				await adapter.ensureDir(paths.output);
				await adapter.ensureDir(paths.submissions);

				return { success: true, data: undefined };
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof StorageError
							? error
							: StorageError.writeFailed(paths.internal, error as Error),
				};
			}
		},

		// === Config ===
		async loadConfig(): Promise<StorageResult<IrisConfig>> {
			try {
				if (await adapter.exists(paths.config)) {
					const loadedConfig = await adapter.readJson<IrisConfig>(paths.config);

					// Validate the loaded config
					const validation = validateConfig(loadedConfig);
					if (!validation.valid) {
						const errorMessages = validation.issues
							.map((i) => `${i.field}: ${i.message}`)
							.join(', ');
						return {
							success: false,
							error: StorageError.invalidJson(
								paths.config,
								new Error(`Invalid config: ${errorMessages}`)
							),
						};
					}

					// Merge with defaults to backfill any missing fields
					const config = { ...DEFAULT_CONFIG, ...loadedConfig };
					return { success: true, data: config };
				}

				// Return default config if file doesn't exist
				return { success: true, data: { ...DEFAULT_CONFIG } };
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof StorageError
							? error
							: StorageError.readFailed(paths.config, error as Error),
				};
			}
		},

		async saveConfig(config: IrisConfig): Promise<StorageResult<void>> {
			try {
				await adapter.writeJson(paths.config, config);
				return { success: true, data: undefined };
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof StorageError
							? error
							: StorageError.writeFailed(paths.config, error as Error),
				};
			}
		},

		// === Mappings ===
		async loadMapping(id: string): Promise<StorageResult<MappingConfig>> {
			try {
				// Check bundled mappings first
				if (id === facAirtableMapping.id) {
					return { success: true, data: facAirtableMapping };
				}

				// Try user mappings
				const mappingPath = join(paths.mappings, `${id}.json`);
				if (await adapter.exists(mappingPath)) {
					const mapping = await adapter.readJson<MappingConfig>(mappingPath);

					// Validate mapping structure
					const validation = validateMappingStructure(mapping);
					if (!validation.valid) {
						const issueMessages = validation.issues
							.map((issue) => `${issue.field}: ${issue.message}`)
							.join(', ');
						return {
							success: false,
							error: StorageError.invalidJson(
								mappingPath,
								new Error(`Invalid mapping structure: ${issueMessages}`)
							),
						};
					}

					return { success: true, data: mapping };
				}

				return { success: false, error: StorageError.notFound(mappingPath) };
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof StorageError
							? error
							: StorageError.readFailed(join(paths.mappings, id), error as Error),
				};
			}
		},

		async saveMapping(mapping: MappingConfig): Promise<StorageResult<void>> {
			try {
				// Reject attempts to overwrite bundled mapping IDs
				if (mapping.id === facAirtableMapping.id) {
					return {
						success: false,
						error: StorageError.alreadyExists(
							`Bundled mapping '${mapping.id}' cannot be overwritten`
						),
					};
				}

				// Validate structure before writing
				const validation = validateMappingStructure(mapping);
				if (!validation.valid) {
					const issueMessages = validation.issues
						.map((issue) => `${issue.field}: ${issue.message}`)
						.join(', ');
					return {
						success: false,
						error: StorageError.invalidStructure(
							join(paths.mappings, `${mapping.id}.json`),
							issueMessages
						),
					};
				}

				// Ensure mappings directory exists (defensive)
				await adapter.ensureDir(paths.mappings);

				const mappingPath = join(paths.mappings, `${mapping.id}.json`);
				await adapter.writeJson(mappingPath, mapping);
				return { success: true, data: undefined };
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof StorageError
							? error
							: StorageError.writeFailed(join(paths.mappings, mapping.id), error as Error),
				};
			}
		},

		async deleteMapping(id: string): Promise<StorageResult<void>> {
			try {
				// Block deletion of bundled mappings
				if (id === facAirtableMapping.id) {
					return {
						success: false,
						error: StorageError.permissionDenied(
							`Bundled mapping '${id}' cannot be deleted`
						),
					};
				}

				const mappingPath = join(paths.mappings, `${id}.json`);
				if (!(await adapter.exists(mappingPath))) {
					return { success: false, error: StorageError.notFound(mappingPath) };
				}

				await adapter.delete(mappingPath);
				return { success: true, data: undefined };
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof StorageError
							? error
							: StorageError.writeFailed(join(paths.mappings, id), error as Error),
				};
			}
		},

		async listMappings(): Promise<StorageResult<string[]>> {
			try {
				// Start with bundled mappings
				const bundledIds = [facAirtableMapping.id];

				// Scan user mappings directory
				const userMappingFiles = await adapter.list(paths.mappings, { pattern: '*.json' });
				const userMappingIds = userMappingFiles
					.map((file) => basename(file, '.json'))
					.filter((id) => id.length > 0);

				// Combine and deduplicate (bundled listed first, then user)
				const allMappings = [...new Set([...bundledIds, ...userMappingIds])];

				return { success: true, data: allMappings };
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof StorageError
							? error
							: StorageError.readFailed(paths.mappings, error as Error),
				};
			}
		},

		// === Schemas ===
		async loadSchema(name: string): Promise<StorageResult<string>> {
			try {
				// Try user schemas first (precedence: user > embedded > bundled)
				const userSchemaPath = join(paths.schemas, name);
				if (await adapter.exists(userSchemaPath)) {
					const schema = await adapter.read(userSchemaPath);
					return { success: true, data: schema };
				}

				// Check embedded schemas (available in compiled binary)
				if (BUNDLED_SCHEMAS[name]) {
					return { success: true, data: BUNDLED_SCHEMAS[name] };
				}

				// Fall back to bundled schemas (dev mode — may not exist in compiled binary)
				try {
					const bundledSchemaPath = join(BUNDLED_SCHEMA_DIR, name);
					if (await adapter.exists(bundledSchemaPath)) {
						const schema = await adapter.read(bundledSchemaPath);
						return { success: true, data: schema };
					}
				} catch {
					// Ignore filesystem errors (expected in compiled binary)
				}

				return { success: false, error: StorageError.notFound(name) };
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof StorageError ? error : StorageError.readFailed(name, error as Error),
				};
			}
		},

		async listSchemas(): Promise<StorageResult<string[]>> {
			try {
				// List user schemas
				const userSchemas = await adapter.list(paths.schemas, { pattern: '*.xsd' });

				// Get embedded schema names
				const embeddedSchemas = Object.keys(BUNDLED_SCHEMAS);

				// Try to list bundled schemas (may fail in compiled binary)
				let bundledSchemas: string[] = [];
				try {
					const bundledSchemaDir = BUNDLED_SCHEMA_DIR;
					bundledSchemas = await adapter.list(bundledSchemaDir, { pattern: '*.xsd' });
				} catch {
					// Ignore — expected in compiled binary
				}

				// Combine and deduplicate (user takes precedence)
				const allSchemas = [...new Set([...userSchemas, ...embeddedSchemas, ...bundledSchemas])];

				return { success: true, data: allSchemas };
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof StorageError
							? error
							: StorageError.readFailed(paths.schemas, error as Error),
				};
			}
		},

		// === Submissions ===
		async saveSubmission(
			xml: string,
			metadata?: SubmissionMetadata
		): Promise<StorageResult<string>> {
			try {
				const now = new Date();
				let filename: string;

				// Use ESFA-compliant format if all required fields present
				if (metadata?.ukprn && metadata?.collectionYear && metadata?.serialNo) {
					// Format: ILR-LLLLLLLL-YYYY-yyyymmdd-hhmmss-NN.XML
					const dateStr = [
						String(now.getFullYear()),
						String(now.getMonth() + 1).padStart(2, '0'),
						String(now.getDate()).padStart(2, '0'),
					].join('');
					const timeStr = [
						String(now.getHours()).padStart(2, '0'),
						String(now.getMinutes()).padStart(2, '0'),
						String(now.getSeconds()).padStart(2, '0'),
					].join('');
					const collection = metadata.collection ?? 'ILR';
					filename = `${collection}-${metadata.ukprn}-${metadata.collectionYear}-${dateStr}-${timeStr}-${metadata.serialNo}.XML`;
				} else {
					// Fallback for incomplete metadata
					const timestamp = now.toISOString().replace(/[:.]/g, '-');
					filename = `ILR-${timestamp}.xml`;
				}

				const submissionPath = join(paths.submissions, filename);
				await adapter.write(submissionPath, xml);

				// Save metadata to internal directory if provided
				if (metadata) {
					const metadataPath = join(paths.internalSubmissions, `${filename}.meta.json`);
					await adapter.writeJson(metadataPath, metadata);
				}

				return { success: true, data: submissionPath };
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof StorageError
							? error
							: StorageError.writeFailed(paths.submissions, error as Error),
				};
			}
		},

		async listSubmissions(): Promise<StorageResult<SubmissionInfo[]>> {
			try {
				// Match both .xml and .XML extensions (backward compat + new ESFA format)
				const allFiles = await adapter.list(paths.submissions, {
					pattern: 'ILR-*',
					sortBy: 'modified',
					order: 'desc',
				});
				const files = allFiles.filter(f => f.endsWith('.xml') || f.endsWith('.XML'));

				const submissions: SubmissionInfo[] = [];

				for (const filename of files) {
					const filePath = join(paths.submissions, filename);
					const fileStat = await stat(filePath);

					// Try to load metadata if it exists
					const metadataPath = join(paths.internalSubmissions, `${filename}.meta.json`);
					let metadata: SubmissionMetadata | undefined;
					if (await adapter.exists(metadataPath)) {
						try {
							metadata = await adapter.readJson<SubmissionMetadata>(metadataPath);
						} catch {
							// Ignore metadata read errors
						}
					}

					submissions.push({
						filename,
						path: filePath,
						metadata,
						size: fileStat.size,
						modified: fileStat.mtime,
					});
				}

				return { success: true, data: submissions };
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof StorageError
							? error
							: StorageError.readFailed(paths.submissions, error as Error),
				};
			}
		},

		// === History ===
		async loadHistory(): Promise<StorageResult<SubmissionHistory>> {
			try {
				const historyPath = join(paths.history, 'submissions.json');

				if (await adapter.exists(historyPath)) {
					const history = await adapter.readJson<SubmissionHistory>(historyPath);
					return { success: true, data: history };
				}

				// Return empty history if file doesn't exist
				const emptyHistory: SubmissionHistory = {
					formatVersion: 1,
					submissions: [],
				};
				return { success: true, data: emptyHistory };
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof StorageError
							? error
							: StorageError.readFailed(paths.history, error as Error),
				};
			}
		},

		async appendHistory(entry: HistoryEntry): Promise<StorageResult<void>> {
			try {
				const historyResult = await this.loadHistory();
				if (!historyResult.success) {
					return historyResult;
				}

				const history = historyResult.data;
				history.submissions.push(entry);

				// Sort by timestamp descending (newest first)
				history.submissions.sort((a, b) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
				);

				const historyPath = join(paths.history, 'submissions.json');
				await adapter.writeJson(historyPath, history);

				return { success: true, data: undefined };
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof StorageError
							? error
							: StorageError.writeFailed(paths.history, error as Error),
				};
			}
		},

		async deleteHistoryEntry(checksum: string): Promise<StorageResult<void>> {
			try {
				const historyResult = await this.loadHistory();
				if (!historyResult.success) {
					return historyResult;
				}

				const history = historyResult.data;
				const originalLength = history.submissions.length;

				// Filter out entry with matching checksum
				history.submissions = history.submissions.filter(
					(entry) => entry.checksum !== checksum
				);

				// If nothing was removed, return success (idempotent)
				if (history.submissions.length === originalLength) {
					return { success: true, data: undefined };
				}

				// Write updated history
				const historyPath = join(paths.history, 'submissions.json');
				await adapter.writeJson(historyPath, history);

				return { success: true, data: undefined };
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof StorageError
							? error
							: StorageError.writeFailed(paths.history, error as Error),
				};
			}
		},
	};
}

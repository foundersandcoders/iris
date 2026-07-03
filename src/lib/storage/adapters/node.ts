/** |===================|| Node Storage Adapter ||==================|
 *  | Node.js-compatible implementation of StorageAdapter interface.
 *  | Uses node:fs/promises (readFile/writeFile/access) instead of
 *  | Bun.file()/Bun.write(). Behaviour mirrors the Bun adapter so
 *  | callers can run identically under either runtime.
 *  |=================================================================|
 */
import { readFile, writeFile, access, readdir, stat, mkdir, unlink } from 'fs/promises';
import { dirname, join } from 'path';
import { StorageError } from '../errors';
import type { StorageAdapter, ListOptions } from '../../types/storageTypes';
import { globToRegExp } from './globPattern';

export function createNodeAdapter(): StorageAdapter {
	return {
		async read(path: string): Promise<string> {
			try {
				return await readFile(path, 'utf-8');
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
					throw StorageError.notFound(path);
				}
				throw StorageError.readFailed(path, error as Error);
			}
		},

		async readJson<T>(path: string): Promise<T> {
			const content = await this.read(path);
			try {
				return JSON.parse(content) as T;
			} catch (error) {
				throw StorageError.invalidJson(path, error as Error);
			}
		},

		async exists(path: string): Promise<boolean> {
			try {
				await access(path);
				return true;
			} catch {
				return false;
			}
		},

		async write(path: string, content: string): Promise<void> {
			try {
				await writeFile(path, content, 'utf-8');
			} catch (error) {
				throw StorageError.writeFailed(path, error as Error);
			}
		},

		async writeJson<T>(path: string, data: T): Promise<void> {
			const content = JSON.stringify(data, null, 2);
			await this.write(path, content);
		},

		async list(dir: string, options?: ListOptions): Promise<string[]> {
			try {
				const entries = await readdir(dir);

				// Apply pattern filter if provided
				let filtered = entries;
				if (options?.pattern) {
					const regex = globToRegExp(options.pattern);
					filtered = entries.filter((name) => regex.test(name));
				}

				// Apply sorting if requested
				if (options?.sortBy) {
					const statsMap = new Map<string, { modified: Date; created: Date }>();
					await Promise.all(
						filtered.map(async (name) => {
							const filePath = join(dir, name);
							const fileStat = await stat(filePath);
							statsMap.set(name, {
								modified: fileStat.mtime,
								created: fileStat.birthtime,
							});
						})
					);

					filtered.sort((a, b) => {
						let comparison = 0;
						if (options.sortBy === 'name') {
							comparison = a.localeCompare(b);
						} else if (options.sortBy === 'modified') {
							comparison =
								statsMap.get(a)!.modified.getTime() - statsMap.get(b)!.modified.getTime();
						} else if (options.sortBy === 'created') {
							comparison = statsMap.get(a)!.created.getTime() - statsMap.get(b)!.created.getTime();
						}

						return options.order === 'desc' ? -comparison : comparison;
					});
				}

				return filtered;
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
					return []; // Directory doesn't exist yet
				}
				throw StorageError.readFailed(dir, error as Error);
			}
		},

		async ensureDir(dir: string): Promise<void> {
			try {
				await mkdir(dir, { recursive: true });
			} catch (error) {
				throw StorageError.writeFailed(dir, error as Error);
			}
		},

		async delete(path: string): Promise<void> {
			try {
				await unlink(path);
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
					throw StorageError.notFound(path);
				}
				throw StorageError.writeFailed(path, error as Error);
			}
		},
	};
}

/** |===================|| Bun Storage Adapter ||==================|
 *  | Bun-specific implementation of StorageAdapter interface.
 *  | Uses Bun.file(), Bun.write(), and native fs operations.
 *  |===============================================================|
 */
import { readdir, stat, mkdir, unlink } from 'fs/promises';
import { join, basename } from 'path';
import { StorageError } from '../errors';
import type { StorageAdapter, ListOptions } from '../../types/storageTypes';

export function createBunAdapter(): StorageAdapter {
	return {
		async read(path: string): Promise<string> {
			const file = Bun.file(path);
			if (!(await file.exists())) {
				throw StorageError.notFound(path);
			}
			try {
				return await file.text();
			} catch (error) {
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
			const file = Bun.file(path);
			return await file.exists();
		},

		async write(path: string, content: string): Promise<void> {
			try {
				await Bun.write(path, content);
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
					const regex = new RegExp(options.pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
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

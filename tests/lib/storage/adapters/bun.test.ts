/** |===================|| Bun Adapter Tests ||==================|
 *  | Tests for Bun storage adapter implementation.
 *  | Note: Full adapter functionality tested in storage.test.ts
 *  |=============================================================|
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { tmpdir } from 'os';
import { rm } from 'fs/promises';
import { createBunAdapter } from '$lib/storage/adapters/bun';
import { StorageError } from '$lib/storage/errors';

describe('BunAdapter', () => {
	let adapter: ReturnType<typeof createBunAdapter>;
	let testDir: string;

	beforeEach(async () => {
		adapter = createBunAdapter();
		testDir = join(tmpdir(), `bun-adapter-test-${Date.now()}`);
		await adapter.ensureDir(testDir);
	});

	afterEach(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	describe('write and read', () => {
		it('writes and reads text content', async () => {
			const filePath = join(testDir, 'test.txt');
			await adapter.write(filePath, 'test content');

			const content = await adapter.read(filePath);
			expect(content).toBe('test content');
		});

		it('throws StorageError when reading non-existent file', async () => {
			await expect(adapter.read(join(testDir, 'missing.txt'))).rejects.toThrow(StorageError);
		});
	});

	describe('writeJson and readJson', () => {
		it('writes and reads JSON content', async () => {
			const filePath = join(testDir, 'test.json');
			const data = { foo: 'bar', count: 42 };

			await adapter.writeJson(filePath, data);
			const result = await adapter.readJson(filePath);

			expect(result).toEqual(data);
		});

		it('throws StorageError on invalid JSON', async () => {
			const filePath = join(testDir, 'invalid.json');
			await adapter.write(filePath, '{ invalid json }');

			await expect(adapter.readJson(filePath)).rejects.toThrow(StorageError);
		});
	});

	describe('exists', () => {
		it('returns true for existing file', async () => {
			const filePath = join(testDir, 'exists.txt');
			await adapter.write(filePath, 'content');

			expect(await adapter.exists(filePath)).toBe(true);
		});

		it('returns false for non-existent file', async () => {
			expect(await adapter.exists(join(testDir, 'missing.txt'))).toBe(false);
		});
	});

	describe('list', () => {
		beforeEach(async () => {
			await adapter.write(join(testDir, 'file1.txt'), 'content');
			await adapter.write(join(testDir, 'file2.json'), '{}');
			await adapter.write(join(testDir, 'other.md'), 'content');
		});

		it('lists all files in directory', async () => {
			const files = await adapter.list(testDir);
			expect(files).toHaveLength(3);
		});

		it('filters by pattern', async () => {
			const files = await adapter.list(testDir, { pattern: '*.json' });
			expect(files).toEqual(['file2.json']);
		});

		it('returns empty array for non-existent directory', async () => {
			const files = await adapter.list(join(testDir, 'missing'));
			expect(files).toEqual([]);
		});
	});

	describe('ensureDir', () => {
		it('creates directory if it does not exist', async () => {
			const newDir = join(testDir, 'nested', 'dir');
			await adapter.ensureDir(newDir);

			// Verify by writing a file to the new directory
			const testFile = join(newDir, 'test.txt');
			await adapter.write(testFile, 'content');
			expect(await adapter.exists(testFile)).toBe(true);
		});
	});

	describe('delete', () => {
		it('deletes existing file', async () => {
			const filePath = join(testDir, 'delete-me.txt');
			await adapter.write(filePath, 'content');

			await adapter.delete(filePath);

			expect(await adapter.exists(filePath)).toBe(false);
		});

		it('throws StorageError when deleting non-existent file', async () => {
			await expect(adapter.delete(join(testDir, 'missing.txt'))).rejects.toThrow(StorageError);
		});
	});
});

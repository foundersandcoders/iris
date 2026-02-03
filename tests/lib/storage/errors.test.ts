/** |===================|| Storage Errors Tests ||==================|
 *  | Tests for storage error types and factory methods.
 *  | Note: Error handling is tested in context in storage.test.ts
 *  |================================================================|
 */
import { describe, it, expect } from 'vitest';
import { StorageError } from '$lib/storage/errors';

describe('StorageError', () => {
	describe('constructor', () => {
		it('creates error with code, message, and path', () => {
			const error = new StorageError('NOT_FOUND', 'File not found', '/test/path');

			expect(error.name).toBe('StorageError');
			expect(error.code).toBe('NOT_FOUND');
			expect(error.message).toBe('File not found');
			expect(error.path).toBe('/test/path');
		});

		it('includes cause when provided', () => {
			const cause = new Error('Original error');
			const error = new StorageError('READ_FAILED', 'Read failed', '/test/path', cause);

			expect(error.cause).toBe(cause);
		});
	});

	describe('factory methods', () => {
		it('notFound creates NOT_FOUND error', () => {
			const error = StorageError.notFound('/missing/file');

			expect(error.code).toBe('NOT_FOUND');
			expect(error.path).toBe('/missing/file');
			expect(error.message).toContain('/missing/file');
		});

		it('invalidJson creates INVALID_JSON error', () => {
			const cause = new Error('Unexpected token');
			const error = StorageError.invalidJson('/bad/file.json', cause);

			expect(error.code).toBe('INVALID_JSON');
			expect(error.path).toBe('/bad/file.json');
			expect(error.cause).toBe(cause);
		});

		it('writeFailed creates WRITE_FAILED error', () => {
			const cause = new Error('Permission denied');
			const error = StorageError.writeFailed('/readonly/file', cause);

			expect(error.code).toBe('WRITE_FAILED');
			expect(error.path).toBe('/readonly/file');
			expect(error.cause).toBe(cause);
		});

		it('readFailed creates READ_FAILED error', () => {
			const cause = new Error('File locked');
			const error = StorageError.readFailed('/locked/file', cause);

			expect(error.code).toBe('READ_FAILED');
			expect(error.cause).toBe(cause);
		});

		it('permissionDenied creates PERMISSION_DENIED error', () => {
			const error = StorageError.permissionDenied('/protected/file');

			expect(error.code).toBe('PERMISSION_DENIED');
			expect(error.path).toBe('/protected/file');
		});

		it('alreadyExists creates ALREADY_EXISTS error', () => {
			const error = StorageError.alreadyExists('/existing/file');

			expect(error.code).toBe('ALREADY_EXISTS');
			expect(error.path).toBe('/existing/file');
		});
	});
});

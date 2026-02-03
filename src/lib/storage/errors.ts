/** |===================|| Storage Errors ||==================|
 *  | Custom error types for storage operations with semantic
 *  | error codes and factory methods.
 *  |==========================================================|
 */

export type StorageErrorCode =
	| 'NOT_FOUND'
	| 'PERMISSION_DENIED'
	| 'INVALID_JSON'
	| 'WRITE_FAILED'
	| 'DIR_NOT_FOUND'
	| 'ALREADY_EXISTS'
	| 'READ_FAILED'
	| 'UNKNOWN';

export class StorageError extends Error {
	constructor(
		public readonly code: StorageErrorCode,
		message: string,
		public readonly path: string,
		public readonly cause?: Error
	) {
		super(message);
		this.name = 'StorageError';
	}

	static notFound(path: string): StorageError {
		return new StorageError('NOT_FOUND', `File not found: ${path}`, path);
	}

	static invalidJson(path: string, cause: Error): StorageError {
		return new StorageError(
			'INVALID_JSON',
			`Invalid JSON in ${path}: ${cause.message}`,
			path,
			cause
		);
	}

	static writeFailed(path: string, cause: Error): StorageError {
		return new StorageError(
			'WRITE_FAILED',
			`Failed to write ${path}: ${cause.message}`,
			path,
			cause
		);
	}

	static readFailed(path: string, cause: Error): StorageError {
		return new StorageError('READ_FAILED', `Failed to read ${path}: ${cause.message}`, path, cause);
	}

	static permissionDenied(path: string, cause?: Error): StorageError {
		return new StorageError('PERMISSION_DENIED', `Permission denied: ${path}`, path, cause);
	}

	static alreadyExists(path: string): StorageError {
		return new StorageError('ALREADY_EXISTS', `File already exists: ${path}`, path);
	}
}

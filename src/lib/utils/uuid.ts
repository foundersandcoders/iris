/** |===================|| UUID Generation ||==================|
 *  | Simple UUID v4 generation for SWSupAimId field
 *  |===========================================================|
 */

/**
 * Generate a RFC 4122 compliant UUID v4
 * @returns UUID string in format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUID(): string {
	// Use crypto.randomUUID if available (Node 19+, Bun)
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}

	// Fallback implementation for older environments
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

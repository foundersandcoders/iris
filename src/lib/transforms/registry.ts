/** |===================|| Transform Registry ||==================|
 *  | Built-in transformation functions for CSV→XML mapping.
 *  | Transforms are referenced by name in mapping configurations.
 *  |=============================================================|
 */

export interface TransformMetadata {
	fn: (value: string) => unknown;
	description: string;
	example: string;
	category: 'type' | 'date' | 'string' | 'conditional';
}

export const TRANSFORMS: Record<string, TransformMetadata> = {
	// === Type Conversions ===
	stringToInt: {
		fn: (v: string) => parseInt(v, 10) || 0,
		description: 'Convert string to integer (defaults to 0 if invalid)',
		example: "'123' → 123, 'invalid' → 0",
		category: 'type',
	},

	stringToIntOptional: {
		fn: (v: string) => {
			const trimmed = v.trim();
			if (trimmed === '') return undefined;
			const parsed = parseInt(trimmed, 10);
			return Number.isNaN(parsed) ? undefined : parsed;
		},
		description: 'Convert to integer, or undefined if empty',
		example: "'' → undefined, '123' → 123",
		category: 'type',
	},

	stringToFloat: {
		fn: (v: string) => parseFloat(v) || 0,
		description: 'Convert string to floating point number (defaults to 0 if invalid)',
		example: "'123.45' → 123.45, 'invalid' → 0",
		category: 'type',
	},

	stringToBoolean: {
		fn: (v: string) => v.toLowerCase() === 'true',
		description: "Convert 'true'/'false' strings to boolean",
		example: "'true' → true, 'false' → false",
		category: 'type',
	},

	// === Date/Time ===
	isoDate: {
		fn: (v: string) => v,
		description: 'Pass through ISO date string (YYYY-MM-DD)',
		example: "'2025-01-28' → '2025-01-28'",
		category: 'date',
	},

	isoDateTime: {
		fn: (v: string) => v,
		description: 'Pass through ISO datetime string',
		example: "'2025-01-28T10:30:00Z' → '2025-01-28T10:30:00Z'",
		category: 'date',
	},

	// === String Transformations ===
	trim: {
		fn: (v: string) => v.trim(),
		description: 'Remove leading/trailing whitespace',
		example: "' text ' → 'text'",
		category: 'string',
	},

	uppercase: {
		fn: (v: string) => v.toUpperCase(),
		description: 'Convert to uppercase',
		example: "'male' → 'MALE'",
		category: 'string',
	},

	uppercaseNoSpaces: {
		fn: (v: string) => v.toUpperCase().replace(/\s+/g, ''),
		description: 'Convert to uppercase and remove all spaces',
		example: "'sw1a 1aa' → 'SW1A1AA'",
		category: 'string',
	},

	lowercase: {
		fn: (v: string) => v.toLowerCase(),
		description: 'Convert to lowercase',
		example: "'MALE' → 'male'",
		category: 'string',
	},

	removeSpaces: {
		fn: (v: string) => v.replace(/\s+/g, ''),
		description: 'Strip all whitespace',
		example: "'AB 123 CD' → 'AB123CD'",
		category: 'string',
	},

	// === Conditional ===
	nullIfEmpty: {
		fn: (v: string) => (v.trim() === '' ? null : v),
		description: 'Convert empty string to null',
		example: "'' → null, 'text' → 'text'",
		category: 'conditional',
	},
};

/**
 * Resolve a transform function by name
 * @throws Error if transform name not found
 */
export function getTransform(name: string): TransformMetadata['fn'] {
	const transform = TRANSFORMS[name];
	if (!transform) {
		throw new Error(
			`Unknown transform: "${name}". Available: ${Object.keys(TRANSFORMS).join(', ')}`
		);
	}
	return transform.fn;
}

/**
 * Get all available transform names grouped by category
 */
export function getTransformsByCategory(): Record<string, string[]> {
	const grouped: Record<string, string[]> = {
		type: [],
		date: [],
		string: [],
		conditional: [],
	};

	for (const [name, meta] of Object.entries(TRANSFORMS)) {
		grouped[meta.category].push(name);
	}

	return grouped;
}

/**
 * Get transform metadata for display in UI
 */
export function getTransformMetadata(name: string): TransformMetadata | null {
	return TRANSFORMS[name] ?? null;
}

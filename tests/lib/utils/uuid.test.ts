import { describe, it, expect } from 'vitest';
import { generateUUID } from '../../../src/lib/utils/uuid';

describe('generateUUID', () => {
	it('should generate a valid UUID v4 format', () => {
		const uuid = generateUUID();

		// UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

		expect(uuid).toMatch(uuidRegex);
	});

	it('should generate unique UUIDs', () => {
		const uuid1 = generateUUID();
		const uuid2 = generateUUID();

		expect(uuid1).not.toBe(uuid2);
	});

	it('should generate UUIDs of correct length', () => {
		const uuid = generateUUID();

		expect(uuid).toHaveLength(36); // 32 hex chars + 4 hyphens
	});

	it('should include hyphens in correct positions', () => {
		const uuid = generateUUID();

		expect(uuid[8]).toBe('-');
		expect(uuid[13]).toBe('-');
		expect(uuid[18]).toBe('-');
		expect(uuid[23]).toBe('-');
	});

	it('should have 4 in the version position', () => {
		const uuid = generateUUID();

		// Position 14 should be '4' (UUID version 4)
		expect(uuid[14]).toBe('4');
	});
});

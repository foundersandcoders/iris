import { describe, it, expect } from 'vitest';
import { parseILR } from '../../src/lib/xml-parser';
import { generateILR } from '../../src/lib/generator';

describe('parseILR', () => {
	it('parses valid ILR XML');
	it('returns error for malformed XML');
	it('returns error for missing Message element');
	it('handles single learner (not array)');
	it('handles multiple learners');
	it('round-trips with generator output');
});

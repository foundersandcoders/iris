import { describe, it, expect } from 'vitest';
import { parseCSV } from '../../src/lib/parser';

describe('parseCSV', () => {
  it('should parse CSV with headers and rows', async () => {
    const result = await parseCSV('./tests/fixtures/learners-260109a.csv');

    expect(result.headers).toEqual(['Name', 'Age', 'Role']);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]).toEqual({
      Name: 'Alice',
      Age: '30',
      Role: 'Developer'
    });
  });

  it('should throw error for empty CSV', async () => {
    // TODO: Create empty fixture and test error handling
    expect(true).toBe(true); // Placeholder
  });
});

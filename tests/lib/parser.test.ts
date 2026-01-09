import { parseCSV } from '../../src/lib/parser';

const result = await parseCSV('./tests/fixtures/learners-260109a.csv');
console.log('Headers:', result.headers);
console.log('Rows:', result.rows);

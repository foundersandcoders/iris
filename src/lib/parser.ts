/**
 * CSV Parser with header-based column matching
 *
 * Parses CSV files by reading headers first, then mapping data to column names.
 * Tolerates column reordering since mapping is based on header names, not position.
 */
// Type definitions
export type CSVRow = Record<string, string>;
export interface CSVData {
  headers: string[];
  rows: CSVRow[];
}

/**
 * Parse a CSV file from the filesystem
 * @param filePath - Absolute path to CSV file
 * @returns Parsed CSV data with headers and rows
 */
export async function parseCSV(filePath: string): Promise<CSVData> {
  const file = Bun.file(filePath);
  const contents = await file.text();

  const lines = contents
    .split('\n')
    .filter(line => line.trim() !== '');

  if (lines.length === 0) throw new Error('CSV file is empty');

  const headers = parseHeaders(lines[0]);
  const rows = lines
    .slice(1)
    .map(line => parseRow(line, headers));

  return { headers, rows };
}

/**
 * Parse CSV header row
 * @param firstLine - First line of CSV file
 * @returns Array of header names
 */
function parseHeaders(firstLine: string): string[] {
  return firstLine
    .split(',')
    .map(header => header.trim());
}

/**
 * Parse a CSV row and map values to headers
 * @param line - CSV line to parse
 * @param headers - Column headers
 * @returns Object mapping header names to values
 */
function parseRow(line: string, headers: string[]): CSVRow {
  const values = line
    .split(',')
    .map(value => value.trim());

  const row: CSVRow = {};
  headers.forEach((header, index) => {
    row[header] = values[index] || '';
  });

  return row;
}

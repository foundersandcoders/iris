import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { validateRows } from '../../../../src/lib/utils/csv/csvValidator';
import { buildSchemaRegistry } from '../../../../src/lib/schema/registryBuilder';
import type { SchemaRegistry } from '../../../../src/lib/schema/schemaInterpreter';
import * as fixtures from '../../../fixtures/lib/utils/csv/csvValidator';

describe('validator', () => {
	let registry: SchemaRegistry;

	beforeAll(() => {
		const xsdPath = join(process.cwd(), 'docs/schemas/schemafile25.xsd');
		const xsdContent = readFileSync(xsdPath, 'utf-8');
		registry = buildSchemaRegistry(xsdContent);
	});

	describe('validateRows', () => {
		it('returns valid result for complete data', () => {
			const result = validateRows([fixtures.validRow], fixtures.validHeaders, registry);

			expect(result.valid).toBe(true);
			expect(result.errorCount).toBe(0);
			expect(result.warningCount).toBe(0);
			expect(result.issues).toHaveLength(0);
		});

		it('detects missing required headers', () => {
			const result = validateRows([], fixtures.incompleteHeaders, registry);

			expect(result.valid).toBe(false);
			expect(result.errorCount).toBeGreaterThan(0);

			const missingHeaderIssues = result.issues.filter((i) => i.code === 'MISSING_REQUIRED_HEADER');
			expect(missingHeaderIssues.length).toBeGreaterThan(0);
		});

		it('detects empty required fields in rows', () => {
			const result = validateRows([fixtures.rowWithEmptyULN], fixtures.validHeaders, registry);

			expect(result.valid).toBe(false);
			expect(result.errorCount).toBeGreaterThan(0);

			const ulnIssue = result.issues.find((i) => i.field === 'ULN');
			expect(ulnIssue).toBeDefined();
			expect(ulnIssue?.row).toBe(0);
		});

		it('detects whitespace-only fields as empty', () => {
			const result = validateRows(
				[fixtures.rowWithWhitespaceLearnRef],
				fixtures.validHeaders,
				registry
			);

			expect(result.valid).toBe(false);
			const issue = result.issues.find((i) => i.field === 'LearnRefNumber');
			expect(issue).toBeDefined();
		});

		it('validates multiple rows independently', () => {
			const result = validateRows(fixtures.multipleRowsWithErrors, fixtures.validHeaders, registry);

			expect(result.valid).toBe(false);
			expect(result.errorCount).toBeGreaterThan(0);

			const rowIndices = result.issues.map((i) => i.row);
			expect(rowIndices).toContain(1);
			expect(rowIndices).toContain(2);
			expect(rowIndices).not.toContain(0);
		});

		it('counts warnings separately from errors', () => {
			const result = validateRows([fixtures.validRow], fixtures.validHeaders, registry);

			expect(result.errorCount).toBe(0);
			expect(result.warningCount).toBe(0);
		});
	});
});

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdir, rm, writeFile } from 'fs/promises';
import { readFileSync } from 'fs';

import { convertWorkflow } from '../../../src/lib/workflows/csvConvert';
import { xmlValidateWorkflow } from '../../../src/lib/workflows/xmlValidate';
import { buildSchemaRegistry } from '../../../src/lib/schema/registryBuilder';
import type { SchemaRegistry } from '../../../src/lib/types/interpreterTypes';
import { facAirtableMapping } from '../../../src/lib/mappings/fac-airtable-2025';
import * as fixtures from '../../fixtures/lib/workflows/workflow';

describe('Round-trip Integration: CSV → XML → Validate', () => {
	let registry: SchemaRegistry;
	let testDir: string;

	beforeAll(() => {
		const xsdPath = join(process.cwd(), 'docs/schemas/schemafile25.xsd');
		const xsdContent = readFileSync(xsdPath, 'utf-8');
		registry = buildSchemaRegistry(xsdContent);
	});

	beforeEach(async () => {
		testDir = join(tmpdir(), `iris-roundtrip-${Date.now()}`);
		await mkdir(testDir, { recursive: true });
	});

	afterEach(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	it('should produce valid XML from valid CSV', async () => {
		// 1. Setup CSV file
		const testCsvPath = join(testDir, 'input.csv');
		await writeFile(testCsvPath, fixtures.validCsvContent);

		// 2. Run Convert Workflow
		const convertGen = convertWorkflow({
			filePath: testCsvPath,
			outputDir: testDir,
			registry,
			mapping: facAirtableMapping,
		});

		let convertResult;
		while (true) {
			const next = await convertGen.next();
			if (next.done) {
				convertResult = next.value;
				break;
			}
		}

		expect(convertResult.success).toBe(true);
		const xmlPath = convertResult.data?.outputPath;
		expect(xmlPath).toBeDefined();

		// 3. Run XML Validate Workflow on the output
		const validateGen = xmlValidateWorkflow({
			filePath: xmlPath!,
			registry,
		});

		let validateResult;
		while (true) {
			const next = await validateGen.next();
			if (next.done) {
				validateResult = next.value;
				break;
			}
		}

		// 4. Final Assertions
		expect(validateResult.success).toBe(true);
		expect(validateResult.data?.validation.valid).toBe(true);
		expect(validateResult.data?.validation.errorCount).toBe(0);

		// 5. Verify LearningDelivery exists in generated XML
		const xmlContent = convertResult.data?.xml || '';
		expect(xmlContent).toContain('<LearningDelivery>');
	});

	it('should produce invalid XML if CSV contains schema-violating data', async () => {
		// 1. Setup CSV with invalid LearnRefNumber (too long: 13 chars, max is 12)
		const invalidRow = { ...fixtures.validRow, LearnRefNum: 'TOOLONGREF123' };
		const invalidCsvContent = [
			fixtures.validHeaders.join(','),
			Object.values(invalidRow).join(','),
		].join('\n');

		const testCsvPath = join(testDir, 'invalid_input.csv');
		await writeFile(testCsvPath, invalidCsvContent);

		// 2. Run Convert Workflow
		const convertGen = convertWorkflow({
			filePath: testCsvPath,
			outputDir: testDir,
			registry,
			mapping: facAirtableMapping,
		});

		let convertResult;
		while (true) {
			const next = await convertGen.next();
			if (next.done) {
				convertResult = next.value;
				break;
			}
		}

		expect(convertResult.success).toBe(true);
		const xmlPath = convertResult.data?.outputPath;

		// 3. Run XML Validate Workflow
		const validateGen = xmlValidateWorkflow({
			filePath: xmlPath!,
			registry,
		});

		let validateResult;
		while (true) {
			const next = await validateGen.next();
			if (next.done) {
				validateResult = next.value;
				break;
			}
		}

		// 4. Assert that XML validation caught the error
		expect(validateResult.success).toBe(true);
		expect(validateResult.data?.validation.valid).toBe(false);
		expect(validateResult.data?.validation.errorCount).toBeGreaterThan(0);

		const learnRefError = validateResult.data?.validation.issues.find(
			(i) => i.elementPath === 'Message.Learner.LearnRefNumber'
		);
		expect(learnRefError).toBeDefined();
		expect(learnRefError?.type).toBe('pattern');
	});
});

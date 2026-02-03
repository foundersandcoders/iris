import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdir, rm, writeFile } from 'fs/promises';
import { readFileSync } from 'fs';

import { convertWorkflow } from '../../../src/lib/workflows/csvConvert';
import { xmlValidateWorkflow } from '../../../src/lib/workflows/xmlValidate';
import { skimWorkflow } from '../../../src/lib/workflows/utils';
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
		const convertResult = await skimWorkflow(
			convertWorkflow({
				filePath: testCsvPath,
				outputDir: testDir,
				registry,
				mapping: facAirtableMapping,
			})
		);

		expect(convertResult.success).toBe(true);
		const xmlPath = convertResult.data?.outputPath;
		expect(xmlPath).toBeDefined();

		// 3. Run XML Validate Workflow on the output
		const validateResult = await skimWorkflow(
			xmlValidateWorkflow({
				filePath: xmlPath!,
				registry,
			})
		);

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
		const convertResult = await skimWorkflow(
			convertWorkflow({
				filePath: testCsvPath,
				outputDir: testDir,
				registry,
				mapping: facAirtableMapping,
			})
		);

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

	it('should handle multiple learners with different aim counts', async () => {
		// 1. Setup CSV file with 2 learners (1 aim and 3 aims)
		const testCsvPath = join(testDir, 'multiple_learners.csv');
		await writeFile(testCsvPath, fixtures.multiplelearnersCsvContent);

		// 2. Run Convert Workflow
		const convertResult = await skimWorkflow(
			convertWorkflow({
				filePath: testCsvPath,
				outputDir: testDir,
				registry,
				mapping: facAirtableMapping,
			})
		);

		expect(convertResult.success).toBe(true);
		const xmlPath = convertResult.data?.outputPath;
		expect(xmlPath).toBeDefined();

		// 3. Run XML Validate Workflow
		const validateResult = await skimWorkflow(
			xmlValidateWorkflow({
				filePath: xmlPath!,
				registry,
			})
		);

		// 4. Assert valid XML
		expect(validateResult.success).toBe(true);
		expect(validateResult.data?.validation.valid).toBe(true);
		expect(validateResult.data?.validation.errorCount).toBe(0);

		// 5. Verify structure
		const xmlContent = convertResult.data?.xml || '';

		// Should have 2 Learner elements
		const learnerMatches = xmlContent.match(/<Learner>/g);
		expect(learnerMatches).toHaveLength(2);

		// Should have 4 total LearningDelivery elements (1 + 3)
		const deliveryMatches = xmlContent.match(/<LearningDelivery>/g);
		expect(deliveryMatches).toHaveLength(4);

		// Verify learner identifiers
		expect(xmlContent).toContain('<LearnRefNumber>LEARN001</LearnRefNumber>');
		expect(xmlContent).toContain('<LearnRefNumber>LEARN002</LearnRefNumber>');
	});

	it('should generate FAM and AppFinRecord elements from aim templates', async () => {
		// 1. Setup CSV file with FAM and AppFinRecord data
		const testCsvPath = join(testDir, 'fam_appfin.csv');
		await writeFile(testCsvPath, fixtures.famAppFinCsvContent);

		// 2. Run Convert Workflow
		const convertResult = await skimWorkflow(
			convertWorkflow({
				filePath: testCsvPath,
				outputDir: testDir,
				registry,
				mapping: facAirtableMapping,
			})
		);

		expect(convertResult.success).toBe(true);
		const xmlPath = convertResult.data?.outputPath;
		expect(xmlPath).toBeDefined();

		// 3. Run XML Validate Workflow
		const validateResult = await skimWorkflow(
			xmlValidateWorkflow({
				filePath: xmlPath!,
				registry,
			})
		);

		// 4. Assert valid XML
		expect(validateResult.success).toBe(true);
		expect(validateResult.data?.validation.valid).toBe(true);
		expect(validateResult.data?.validation.errorCount).toBe(0);

		// 5. Verify FAM and AppFinRecord structures
		const xmlContent = convertResult.data?.xml || '';

		// Should have LearningDeliveryFAM elements
		expect(xmlContent).toContain('<LearningDeliveryFAM>');
		expect(xmlContent).toContain('<LearnDelFAMType>ACT</LearnDelFAMType>');
		expect(xmlContent).toContain('<LearnDelFAMCode>1</LearnDelFAMCode>');
		expect(xmlContent).toContain('<LearnDelFAMType>SOF</LearnDelFAMType>');
		expect(xmlContent).toContain('<LearnDelFAMCode>105</LearnDelFAMCode>');

		// Should have AppFinRecord elements
		expect(xmlContent).toContain('<AppFinRecord>');
		expect(xmlContent).toContain('<AFinType>TNP</AFinType>');
		expect(xmlContent).toContain('<AFinCode>1</AFinCode>');
		expect(xmlContent).toContain('<AFinAmount>15000</AFinAmount>');
		expect(xmlContent).toContain('<AFinCode>2</AFinCode>');
		expect(xmlContent).toContain('<AFinAmount>3000</AFinAmount>');
	});

	it('should handle learners with multiple employment status records', async () => {
		// 1. Setup CSV file with 3 employment statuses
		const testCsvPath = join(testDir, 'employment_statuses.csv');
		await writeFile(testCsvPath, fixtures.employmentStatusCsvContent);

		// 2. Run Convert Workflow
		const convertResult = await skimWorkflow(
			convertWorkflow({
				filePath: testCsvPath,
				outputDir: testDir,
				registry,
				mapping: facAirtableMapping,
			})
		);

		expect(convertResult.success).toBe(true);
		const xmlPath = convertResult.data?.outputPath;
		expect(xmlPath).toBeDefined();

		// 3. Run XML Validate Workflow
		const validateResult = await skimWorkflow(
			xmlValidateWorkflow({
				filePath: xmlPath!,
				registry,
			})
		);

		// 4. Assert valid XML
		expect(validateResult.success).toBe(true);
		expect(validateResult.data?.validation.valid).toBe(true);
		expect(validateResult.data?.validation.errorCount).toBe(0);

		// 5. Verify employment status structures
		const xmlContent = convertResult.data?.xml || '';

		// Should have 3 LearnerEmploymentStatus elements
		const empStatusMatches = xmlContent.match(/<LearnerEmploymentStatus>/g);
		expect(empStatusMatches).toHaveLength(3);

		// Verify employment status values
		expect(xmlContent).toContain('<EmpStat>10</EmpStat>');
		expect(xmlContent).toContain('<EmpStat>11</EmpStat>');

		// Should have EmploymentStatusMonitoring elements
		expect(xmlContent).toContain('<EmploymentStatusMonitoring>');
		expect(xmlContent).toContain('<ESMType>SEM</ESMType>');
		expect(xmlContent).toContain('<ESMType>LOE</ESMType>');
		expect(xmlContent).toContain('<ESMType>EII</ESMType>');
		expect(xmlContent).toContain('<ESMType>SEI</ESMType>');
		expect(xmlContent).toContain('<ESMType>LOU</ESMType>');
	});
});

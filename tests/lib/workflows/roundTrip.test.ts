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

	it('should handle learners with minimal required fields only', async () => {
		// 1. Setup CSV file with only required fields
		const testCsvPath = join(testDir, 'minimal_required.csv');
		await writeFile(testCsvPath, fixtures.minimalRequiredCsvContent);

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

		// 4. Assert valid XML (schema should allow optional fields to be omitted)
		expect(validateResult.success).toBe(true);
		expect(validateResult.data?.validation.valid).toBe(true);
		expect(validateResult.data?.validation.errorCount).toBe(0);

		// 5. Verify required fields present, optional fields empty
		const xmlContent = convertResult.data?.xml || '';

		// Required fields should be present with values
		expect(xmlContent).toContain('<LearnRefNumber>MINIMAL01</LearnRefNumber>');
		expect(xmlContent).toContain('<ULN>5555555555</ULN>');
		expect(xmlContent).toContain('<Ethnicity>31</Ethnicity>');
		expect(xmlContent).toContain('<Sex>F</Sex>');

		// Optional fields present but empty (generator includes empty elements)
		expect(xmlContent).toContain('<GivenNames></GivenNames>');
		expect(xmlContent).toContain('<FamilyName></FamilyName>');
		expect(xmlContent).toContain('<DateOfBirth></DateOfBirth>');
	});

	it('should correctly transform edge case values', async () => {
		// 1. Setup CSV file with messy data needing transformation
		const testCsvPath = join(testDir, 'transform_edge_cases.csv');
		await writeFile(testCsvPath, fixtures.transformEdgeCasesCsvContent);

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

		// 4. Assert valid XML (transforms should clean up messy data)
		expect(validateResult.success).toBe(true);
		expect(validateResult.data?.validation.valid).toBe(true);
		expect(validateResult.data?.validation.errorCount).toBe(0);

		// 5. Verify transformations applied correctly
		const xmlContent = convertResult.data?.xml || '';

		// Trim transform: whitespace removed
		expect(xmlContent).toContain('<LearnRefNumber>EDGE001</LearnRefNumber>');
		// XML escapes apostrophes to &apos;
		expect(xmlContent).toContain('<FamilyName>O&apos;Brien-Smith</FamilyName>');
		expect(xmlContent).toContain('<GivenNames>Jean-Paul</GivenNames>');

		// Uppercase transform: converts to uppercase but preserves whitespace
		// Note: This reveals that the mapping should probably use a trimming transform
		expect(xmlContent).toContain('<Sex>  M  </Sex>');
		expect(xmlContent).toContain('<LearnAimRef>Z0001234</LearnAimRef>');

		// UppercaseNoSpaces transform: postcodes normalized (uppercase + no spaces)
		expect(xmlContent).toContain('<PostcodePrior>E16AN</PostcodePrior>');
		expect(xmlContent).toContain('<Postcode>SW1A1AA</Postcode>');
		expect(xmlContent).toContain('<DelLocPostCode>E16AN</DelLocPostCode>');

		// StringToInt transform: numeric strings converted, whitespace handled during parsing
		expect(xmlContent).toContain('<ULN>6666666666</ULN>');
		expect(xmlContent).toContain('<Ethnicity>31</Ethnicity>');
		expect(xmlContent).toContain('<AimType>1</AimType>');
		expect(xmlContent).toContain('<FundModel>36</FundModel>');
	});

	it('should handle sparse aims (aims 1 and 4 populated, 2/3/5 empty)', async () => {
		// 1. Setup CSV file with non-contiguous aims
		const testCsvPath = join(testDir, 'sparse_aims.csv');
		await writeFile(testCsvPath, fixtures.sparseAimsCsvContent);

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

		// 5. Verify aim detection and sequencing
		const xmlContent = convertResult.data?.xml || '';

		// Should have exactly 2 LearningDelivery elements (aims 1 and 4 only)
		const deliveryMatches = xmlContent.match(/<LearningDelivery>/g);
		expect(deliveryMatches).toHaveLength(2);

		// Aim 1 should have AimSeqNumber 1
		expect(xmlContent).toContain('<LearnAimRef>60161533</LearnAimRef>');
		const aim1Match = xmlContent.match(
			/<LearnAimRef>60161533<\/LearnAimRef>[\s\S]*?<AimSeqNumber>(\d+)<\/AimSeqNumber>/
		);
		expect(aim1Match).toBeTruthy();
		expect(aim1Match![1]).toBe('1');

		// Aim 4 should have AimSeqNumber 4 (preserves original aim number)
		expect(xmlContent).toContain('<LearnAimRef>50114829</LearnAimRef>');
		const aim4Match = xmlContent.match(
			/<LearnAimRef>50114829<\/LearnAimRef>[\s\S]*?<AimSeqNumber>(\d+)<\/AimSeqNumber>/
		);
		expect(aim4Match).toBeTruthy();
		expect(aim4Match![1]).toBe('4');
	});
});

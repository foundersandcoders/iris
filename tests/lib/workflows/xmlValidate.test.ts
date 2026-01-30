import { describe, it, expect, beforeAll } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import { xmlValidateWorkflow } from '../../../src/lib/workflows/xmlValidate';
import { consumeWorkflow } from '../../../src/lib/workflows/utils';
import { buildSchemaRegistry } from '../../../src/lib/schema/registryBuilder';
import type { SchemaRegistry } from '../../../src/lib/types/interpreterTypes';
import * as fixtures from '../../fixtures/lib/workflows/xmlValidate';

describe('xmlValidateWorkflow', () => {
	let registry: SchemaRegistry;
	let tempDir: string;

	beforeAll(async () => {
		registry = buildSchemaRegistry(await Bun.file('docs/schemas/schemafile25.xsd').text());

		tempDir = join(tmpdir(), 'iris-test-xml-validate');
		mkdirSync(tempDir, { recursive: true });
	});

	it('validates valid XML without errors', async () => {
		const filePath = join(tempDir, 'valid.xml');
		writeFileSync(filePath, fixtures.validIlrXml);

		const { events, result } = await consumeWorkflow(
			xmlValidateWorkflow({ filePath, registry })
		);

		const eventKeys = events.map((e) => `${e.type}:${e.step.id}`);

		expect(result.success).toBe(true);
		expect(eventKeys).toContain('step:start:load');
		expect(eventKeys).toContain('step:complete:load');
		expect(eventKeys).toContain('step:start:parse');
		expect(eventKeys).toContain('step:complete:parse');
		expect(eventKeys).toContain('step:start:validate');
		expect(eventKeys).toContain('step:complete:validate');

		unlinkSync(filePath);
	});
});

import { describe, it, expect, beforeAll } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import { xmlValidateWorkflow } from '../../../src/lib/workflows/xmlValidate';
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

		const workflow = xmlValidateWorkflow({ filePath, registry });

		const events: string[] = [];
		let result;

		for await (const event of workflow) {
			events.push(`${event.type}:${event.step.id}`);
			if (event.type === 'step:complete' || event.type === 'step:error') {
				result = event;
			}
		}

		// Get final result
		const gen = xmlValidateWorkflow({ filePath, registry });
		let done = false;
		let finalResult;
		while (!done) {
			const next = await gen.next();
			if (next.done) {
				finalResult = next.value;
				done = true;
			}
		}

		expect(finalResult.success).toBe(true);
		expect(events).toContain('step:start:load');
		expect(events).toContain('step:complete:load');
		expect(events).toContain('step:start:parse');
		expect(events).toContain('step:complete:parse');
		expect(events).toContain('step:start:validate');
		expect(events).toContain('step:complete:validate');

		unlinkSync(filePath);
	});
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { convertWorkflow } from '../../../src/lib/workflows/convert';
import type { WorkflowResult, WorkflowStepEvent } from '../../../src/lib/types/workflow';
import type { ConvertOutput } from '../../../src/lib/types/workflow';
import * as fixtures from '../../fixtures/lib/workflows/workflow';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdir, rm, writeFile } from 'fs/promises';

async function runWorkflow(
  input: Parameters<typeof convertWorkflow>[0]
): Promise<{ events: WorkflowStepEvent[]; result: WorkflowResult<ConvertOutput> }> {
  const gen = convertWorkflow(input);
  const events: WorkflowStepEvent[] = [];

  while (true) {
    const next = await gen.next();
    if (next.done) {
      return { events, result: next.value };
    }
    events.push(next.value);
  }
}

describe('convertWorkflow', () => {
  let testDir: string;
  let testCsvPath: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `iris-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    testCsvPath = join(testDir, 'test.csv');
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('successful conversion', () => {
    it('yields step events in correct order', async () => {
      await writeFile(testCsvPath, fixtures.validCsvContent);

      const { events } = await runWorkflow({
        filePath: testCsvPath,
        outputDir: testDir,
      });

      const eventKeys = events.map((e) => `${e.type}:${e.step.id}`);

      expect(eventKeys).toEqual([
        'step:start:parse',
        'step:complete:parse',
        'step:start:validate',
        'step:complete:validate',
        'step:start:generate',
        'step:complete:generate',
        'step:start:save',
        'step:complete:save',
      ]);
    });

    it('returns successful result with output data', async () => {
      await writeFile(testCsvPath, fixtures.validCsvContent);

      const { result } = await runWorkflow({
        filePath: testCsvPath,
        outputDir: testDir,
      });

      expect(result.success).toBe(true);
      expect(result.data?.xml).toContain('<?xml version="1.0"');
      expect(result.data?.outputPath).toContain('ILR-');
      expect(result.data?.csvData.rows).toHaveLength(1);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('saves XML file to output directory', async () => {
      await writeFile(testCsvPath, fixtures.validCsvContent);

      const { result } = await runWorkflow({
        filePath: testCsvPath,
        outputDir: testDir,
      });

      const outputFile = Bun.file(result.data!.outputPath);
      expect(await outputFile.exists()).toBe(true);

      const content = await outputFile.text();
      expect(content).toContain('<Message xmlns="ESFA/ILR/2025-26">');
      expect(content).toContain('<LearnRefNumber>ABC123</LearnRefNumber>');
    });
  });

  describe('error handling', () => {
    it('fails on missing file', async () => {
      const { events, result } = await runWorkflow({
        filePath: join(testDir, 'nonexistent.csv'),
        outputDir: testDir,
      });

      expect(events).toContainEqual(
        expect.objectContaining({ type: 'step:start', step: expect.objectContaining({ id: 'parse' }) })
      );
      expect(events).toContainEqual(
        expect.objectContaining({ type: 'step:error', step: expect.objectContaining({ id: 'parse' }) })
      );
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('reports validation errors but continues', async () => {
      await writeFile(testCsvPath, fixtures.invalidCsvContent);

      const { result } = await runWorkflow({
        filePath: testCsvPath,
        outputDir: testDir,
      });

      expect(result.success).toBe(true);
      expect(result.data?.validation.valid).toBe(false);
      expect(result.data?.validation.errorCount).toBeGreaterThan(0);
    });
  });

  describe('step progress', () => {
    it('updates step status through lifecycle', async () => {
      await writeFile(testCsvPath, fixtures.validCsvContent);

      const { events } = await runWorkflow({
        filePath: testCsvPath,
        outputDir: testDir,
      });

      const parseEvents = events
        .filter((e) => e.step.id === 'parse')
        .map((e) => ({
          status: e.step.status,
          progress: e.step.progress
        }));

      expect(parseEvents[0]).toEqual({ status: 'pending', progress: 0 });
      expect(parseEvents[1]).toEqual({ status: 'complete', progress: 100 });
    });
  });
});
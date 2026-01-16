import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { convertWorkflow } from '../../../src/lib/workflows/convert';
import * as fixtures from '../../fixtures/lib/workflows/workflow';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdir, rm, writeFile } from 'fs/promises';

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

      const workflow = convertWorkflow({
        filePath: testCsvPath,
        outputDir: testDir,
      });

      const events: string[] = [];
      for await (const event of workflow) {
        events.push(`${event.type}:${event.step.id}`);
      }

      expect(events).toEqual([
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

      const workflow = convertWorkflow({
        filePath: testCsvPath,
        outputDir: testDir,
      });

      let result;
      for await (const _ of workflow) {
        // consume events
      }

      /* TODO: Generator return value isn't accessible via for-await.
        * Need to use .next() to get final return
        */
      const gen = convertWorkflow({
        filePath: testCsvPath,
        outputDir: testDir,
      });

      let done = false;
      while (!done) {
        const next = await gen.next();
        done = next.done ?? false;
        if (done) result = next.value;
      }

      // TODO: Check & update these expect() calls when .next() is implemented
      expect(result.success).toBe(true);
      expect(result.data?.xml).toContain('<?xml version="1.0"');
      expect(result.data?.outputPath).toContain('ILR-');
      expect(result.data?.csvData.rows).toHaveLength(1);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('saves XML file to output directory', async () => {
      await writeFile(testCsvPath, fixtures.validCsvContent);

      const gen = convertWorkflow({
        filePath: testCsvPath,
        outputDir: testDir,
      });

      let result;
      let done = false;
      while (!done) {
        const next = await gen.next();
        done = next.done ?? false;
        if (done) result = next.value;
      }

      // TODO: exclude undefined result
      const outputFile = Bun.file(result.data!.outputPath);
      expect(await outputFile.exists()).toBe(true);

      const content = await outputFile.text();
      expect(content).toContain('<Message xmlns="ESFA/ILR/2025-26">');
      expect(content).toContain('<LearnRefNumber>ABC123</LearnRefNumber>');
    });
  });

  describe('error handling', () => {
    it('fails on missing file', async () => {
      const gen = convertWorkflow({
        filePath: join(testDir, 'nonexistent.csv'),
        outputDir: testDir,
      });

      const events: { type: string; stepId: string }[] = [];
      let result;
      let done = false;

      while (!done) {
        const next = await gen.next();
        done = next.done ?? false;
        if (done) {
          result = next.value;
        } else {
          events.push({ type: next.value.type, stepId: next.value.step.id });
        }
      }

      expect(events).toContainEqual({ type: 'step:start', stepId: 'parse' });
      expect(events).toContainEqual({ type: 'step:error', stepId: 'parse' });

      // TODO: exclude undefined results
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('reports validation errors but continues', async () => {
      await writeFile(testCsvPath, fixtures.invalidCsvContent);

      const gen = convertWorkflow({
        filePath: testCsvPath,
        outputDir: testDir,
      });

      let result;
      let done = false;
      while (!done) {
        const next = await gen.next();
        done = next.done ?? false;
        if (done) result = next.value;
      }

      /* TODO: exclude undefined results

        * Workflow succeeds even with validation errors (they're reported, not fatal)
        */
      expect(result.success).toBe(true);
      expect(result.data?.validation.valid).toBe(false);
      expect(result.data?.validation.errorCount).toBeGreaterThan(0);
    });
  });

  describe('step progress', () => {
    it('updates step status through lifecycle', async () => {
      await writeFile(testCsvPath, fixtures.validCsvContent);

      const gen = convertWorkflow({
        filePath: testCsvPath,
        outputDir: testDir,
      });

      const parseEvents: { status: string; progress: number }[] = [];

      let done = false;
      while (!done) {
        const next = await gen.next();
        done = next.done ?? false;
        // TODO: disentangle WorkflowStepEvent from WorkflowResult<ConvertOutput>
        if (!done && next.value.step.id === 'parse') {
          parseEvents.push({
            status: next.value.step.status,
            progress: next.value.step.progress,
          });
        }
      }

      expect(parseEvents[0]).toEqual({ status: 'pending', progress: 0 });
      expect(parseEvents[1]).toEqual({ status: 'complete', progress: 100 });
    });
  });
});

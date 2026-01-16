/** Processing Screen
  *
  * Displays live progress as the convert workflow runs.
  * Shows step status, messages, and handles completion/errors.
  */

import type { Terminal } from 'terminal-kit';
import { Layout } from '../utils/layout';
import { THEMES } from '../theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import { convertWorkflow } from '../../lib/workflows/convert';
import type { WorkflowStepEvent, WorkflowResult, ConvertOutput } from '../../lib/types/workflow';

const theme = THEMES.themeLight;

interface StepDisplay {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'complete' | 'failed' | 'skipped';
  message?: string;
}

export class ProcessingScreen implements Screen {
  readonly name = 'processing';
  private layout: Layout;
  private steps: StepDisplay[] = [
    { id: 'parse', name: 'Parse CSV', status: 'pending' },
    { id: 'validate', name: 'Validate Data', status: 'pending' },
    { id: 'generate', name: 'Generate XML', status: 'pending' },
    { id: 'save', name: 'Save Output', status: 'pending' },
  ];
  private result: WorkflowResult<ConvertOutput> | null = null;
  private error: Error | null = null;

  constructor(private term: Terminal) {
    this.layout = new Layout(term);
  }

  async render(data?: ScreenData): Promise<ScreenResult> {
    const filePath = data?.filePath as string;
    if (!filePath) return { action: 'pop' };

    this.drawScreen();

    try {
      const workflow = convertWorkflow({ filePath });

      for await (const event of workflow) {
        this.handleEvent(event);
        this.drawScreen();
      }

      /* LOG (25-01-16): Capturing generator returns
        *
        * Get final result - need to run again to capture return value
        *
        * (for-await doesn't give us the return)
        */
      const gen = convertWorkflow({ filePath });
      let done = false;
      while (!done) {
        const next = await gen.next();
        if (next.done) {
          this.result = next.value;
          done = true;
        }
      }
    } catch (err) {
      this.error = err instanceof Error ? err : new Error(String(err));
    }

    this.drawScreen();

    return new Promise((resolve) => {
      this.term.on('key', (key: string) => {
        this.cleanup();

        if (this.result?.success) {
          resolve({
            action: 'push',
            screen: 'success',
            data: {
              outputPath: this.result.data?.outputPath,
              validation: this.result.data?.validation,
              duration: this.result.duration,
            },
          });
        } else {
          resolve({ action: 'pop' });
        }
      });
    });
  }

  cleanup(): void {
    this.term.removeAllListeners('key');
  }

  private handleEvent(event: WorkflowStepEvent): void {
    const step = this.steps.find((s) => s.id === event.step.id);
    if (!step) return;

    if (event.type === 'step:start') {
      step.status = 'running';
      step.message = undefined;
    } else if (event.type === 'step:complete') {
      step.status = 'complete';
      step.message = event.step.message;
    } else if (event.type === 'step:error') {
      step.status = 'failed';
      step.message = event.step.error?.message;
    }
  }

  private drawScreen(): void {
    const region = this.layout.draw({
      title: 'Converting',
      statusBar: this.result ? '[Any key] Continue' : 'Processing...',
    });

    const startY = region.contentTop + 1;

    this.steps.forEach((step, index) => {
      const y = startY + index * 2;
      this.term.moveTo(4, y);

      const icon = this.getStatusIcon(step.status);
      const color = this.getStatusColor(step.status);

      this.term.colorRgbHex(color)(`${icon}  ${step.name}`);

      if (step.message) {
        this.term.moveTo(8, y + 1);
        this.term.colorRgbHex(theme.textMuted)(step.message);
      }
    });

    if (this.result) {
      const summaryY = startY + this.steps.length * 2 + 2;
      this.term.moveTo(4, summaryY);

      if (this.result.success) {
        this.term.colorRgbHex(theme.success)('✓ Conversion complete');
        this.term.moveTo(4, summaryY + 1);
        this.term.colorRgbHex(theme.textMuted)(`Duration: ${this.result.duration}ms`);
      } else {
        this.term.colorRgbHex(theme.error)('✗ Conversion failed');
        if (this.result.error) {
          this.term.moveTo(4, summaryY + 1);
          this.term.colorRgbHex(theme.textMuted)(this.result.error.message);
        }
      }
    }

    if (this.error) {
      const errorY = startY + this.steps.length * 2 + 2;
      this.term.moveTo(4, errorY);
      this.term.colorRgbHex(theme.error)(`Error: ${this.error.message}`);
    }
  }

  private getStatusIcon(status: StepDisplay['status']): string {
    switch (status) {
      case 'pending': return '○';
      case 'running': return '◐';
      case 'complete': return '●';
      case 'failed': return '✗';
      case 'skipped': return '◌';
    }
  }

  private getStatusColor(status: StepDisplay['status']): string {
    switch (status) {
      case 'pending': return theme.textMuted;
      case 'running': return theme.primary;
      case 'complete': return theme.success;
      case 'failed': return theme.error;
      case 'skipped': return theme.textMuted;
    }
  }
}

/** ====== TUI Application ======
 * Manages full-screen terminal interface, screen transitions, and workflows
 */
import { createCliRenderer, type KeyEvent } from '@opentui/core';
import { Router } from './utils/router';
import { Dashboard } from './screens/dashboard';
import { FilePicker } from './screens/file-picker';
import { ProcessingScreen } from './screens/processing';
import type { Renderer } from './types';

interface TUIOptions {
	startCommand?: string;
	args?: string[];
}

export class TUI {
	private renderer!: Renderer;
	private router!: Router;

	constructor(private options: TUIOptions = {}) {}

	async start(): Promise<void> {
		this.renderer = await createCliRenderer();
		this.router = new Router(this.renderer);

		this.registerInputHandlers();
		this.registerScreens();

		try {
			await this.router.push('dashboard');
			this.renderer.start();
		} catch (error) {
			// Phase 1 (OpenTUI foundation) complete but screens not yet migrated
			// Stop renderer before writing to stderr to avoid OpenTUI console overlay
			try {
				this.renderer.stop();
			} catch {
				// Renderer might not be in a stoppable state
			}

			// Write to stderr after renderer is stopped
			process.stderr.write('\n❌ TUI screens not yet migrated to OpenTUI\n');
			process.stderr.write('   Phase 1 complete (bootstrap + router)\n');
			process.stderr.write('   Phase 2 pending (screen migration: 2TI.24-26)\n\n');
			if (error instanceof Error) {
				process.stderr.write(`   Error: ${error.message}\n\n`);
			}
			process.exit(1);
		}
	}

	private registerInputHandlers(): void {
		this.renderer.keyInput.on('keypress', (key: KeyEvent) => {
			if (key.ctrl && key.name === 'c') {
				this.cleanup();
				process.exit(0);
			}
		});
	}

	private registerScreens(): void {
		this.router.register('dashboard', (ctx) => new Dashboard(ctx));
		this.router.register('convert', (ctx) => new FilePicker(ctx));
		this.router.register('processing', (ctx) => new ProcessingScreen(ctx));
	}

	private cleanup(): void {
		this.renderer.stop();
	}
}

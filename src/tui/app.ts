/** ====== TUI Application ======
 * Manages full-screen terminal interface, screen transitions, and workflows
 */
import { createCliRenderer } from '@opentui/core';
import { Router } from './utils/router';
import { Dashboard } from './screens/dashboard';
import { FilePicker } from './screens/file-picker';
import { WorkflowScreen } from './screens/workflow';
import { SuccessScreen } from './screens/success';
import { ValidationExplorerScreen } from './screens/validation-explorer';
import { CheckResultsScreen } from './screens/check-results';
import { MappingBuilderScreen } from './screens/mapping-builder';
import { MappingEditorScreen } from './screens/mapping-editor';
import { MappingSaveScreen } from './screens/mapping-save';
import { SettingsScreen } from './screens/settings';
import { AboutScreen } from './screens/about';
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
		this.renderer = await createCliRenderer({
			exitOnCtrlC: true,
		});

		this.router = new Router(this.renderer);
		this.registerScreens();

		await this.router.push('dashboard');

		// Router returns when quit action received
		this.renderer.destroy();
	}

	private registerScreens(): void {
		this.router.register('dashboard', (ctx) => new Dashboard(ctx));
		this.router.register('file-picker', (ctx) => new FilePicker(ctx));
		this.router.register('workflow', (ctx) => new WorkflowScreen(ctx));
		this.router.register('success', (ctx) => new SuccessScreen(ctx));
		this.router.register('validation-explorer', (ctx) => new ValidationExplorerScreen(ctx));
		this.router.register('check-results', (ctx) => new CheckResultsScreen(ctx));
		this.router.register('mapping-builder', (ctx) => new MappingBuilderScreen(ctx));
		this.router.register('mapping-editor', (ctx) => new MappingEditorScreen(ctx));
		this.router.register('mapping-save', (ctx) => new MappingSaveScreen(ctx));
		this.router.register('settings', (ctx) => new SettingsScreen(ctx));
		this.router.register('about', (ctx) => new AboutScreen(ctx));
	}
}

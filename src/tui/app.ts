/** ====== TUI Application ======
 * Manages full-screen terminal interface, screen transitions, and workflows
 */
import { createCliRenderer } from '@opentui/core';
import { Router } from './utils/router';
import { ToastManager } from './utils/toastManager';
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
import { HistoryScreen } from './screens/history';
import type { Renderer } from './types';
import { theme, applyTheme } from '../../assets/brand/theme';
import { isRemoteSession } from './utils/transitions';
import { getConfig, DEFAULT_CONFIG } from '../lib/types/configTypes';

interface TUIOptions {
	startCommand?: string;
	args?: string[];
}

export class TUI {
	private renderer!: Renderer;
	private router!: Router;
	private toasts!: ToastManager;

	constructor(private options: TUIOptions = {}) {}

	async start(): Promise<void> {
		// A broken config file must not stop the TUI booting: getConfig()
		// throws on genuine read/parse errors (not on a missing file, which
		// resolves to defaults), so fall back rather than propagate. Loaded
		// before createCliRenderer so applyTheme() below picks the correct
		// theme.background for first paint, no light-then-dark flash.
		const config = await getConfig().catch(() => DEFAULT_CONFIG);
		applyTheme(config.theme ?? 'light');

		this.renderer = await createCliRenderer({
			exitOnCtrlC: true,
			backgroundColor: theme.background,
		});

		this.toasts = new ToastManager(this.renderer);
		this.toasts.attach();

		const motion = !(config.reduceMotion ?? false) && !isRemoteSession();

		this.router = new Router(this.renderer, this.toasts, { motion });
		this.registerScreens();

		try {
			// Router returns when quit action received.
			await this.router.push('dashboard');
		} finally {
			// Runs on the normal quit path AND if push()/a screen's render()
			// throws, otherwise an uncaught error mid-navigation would skip
			// teardown entirely and leave the terminal in a broken state.
			// dispose() (which detaches the transitions engine's frame
			// callback) must precede renderer.destroy(): detaching after
			// destruction would touch a renderer that's already torn down.
			this.router.dispose();
			this.toasts.detach();
			this.renderer.destroy();
		}
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
		this.router.register('history', (ctx) => new HistoryScreen(ctx));
	}
}

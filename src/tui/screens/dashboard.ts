/** ====== Dashboard Screen ======
 * Main menu and entry point for TUI
 */
import {
	BoxRenderable,
	TextRenderable,
	SelectRenderable,
	SelectRenderableEvents,
	type SelectOption,
} from '@opentui/core';
import type { RenderContext, Renderer } from '../types';
import { theme, symbols } from '../../../assets/brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import { Keymap } from '../utils/keymap';
import { appShell, panel } from '../components';
import { createStorage } from '../../lib/storage';
import type { IrisConfig } from '../../lib/types/configTypes';
import type { HistoryEntry } from '../../lib/types/storageTypes';

interface MenuItem {
	key: string;
	label: string;
	implemented: boolean;
}

const CONTAINER_ID = 'dashboard-root';
const RECENT_ACTIVITY_LIMIT = 5;

/** One "Recent Activity" row: date, filename, learner count. */
function formatActivityRow(entry: HistoryEntry): string {
	const parsed = new Date(entry.timestamp);
	const date = Number.isNaN(parsed.getTime())
		? 'Unknown date'
		: parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	return `${date}  ${entry.filename}  ${entry.learnerCount} learner(s)`;
}

export class Dashboard implements Screen {
	readonly name = 'dashboard';
	private renderer: Renderer;
	private keymap?: Keymap;

	private menuItems: MenuItem[] = [
		{ key: 'convert', label: 'Convert CSV to ILR XML', implemented: true },
		{ key: 'validate', label: 'Validate XML Submission', implemented: true },
		{ key: 'check', label: 'Cross-Submission Check', implemented: true },
		{ key: 'mapping-builder', label: 'Mapping Builder', implemented: true },
		{ key: 'history', label: 'Browse Submission History', implemented: true },
		{ key: 'settings', label: 'Settings & Configuration', implemented: true },
		{ key: 'about', label: 'About Iris', implemented: true },
		{ key: 'quit', label: 'Quit', implemented: true },
	];

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		// Load config for directory paths used by file-picker, and recent
		// submission history for the Recent Activity panel.
		const storage = createStorage();
		const configResult = await storage.loadConfig();
		const config: Partial<IrisConfig> = configResult.success ? configResult.data : {};

		const historyResult = await storage.loadHistory();
		const recent: HistoryEntry[] = historyResult.success
			? historyResult.data.submissions.slice(0, RECENT_ACTIVITY_LIMIT)
			: [];

		return new Promise((resolve) => {
			// Menu
			const select = new SelectRenderable(this.renderer, {
				options: this.menuItems.map((item, index) => ({
					name: `${index + 1}  ${item.label}`,
					description: item.implemented ? '' : '(soon)',
					value: item,
				})),
				backgroundColor: theme.background,
				focusedBackgroundColor: theme.background,
				selectedBackgroundColor: theme.highlightFocused,
				selectedTextColor: theme.text,
				textColor: theme.text,
				focusedTextColor: theme.text,
				descriptionColor: theme.textMuted,
				flexGrow: 1,
			});

			// Build keymap before the shell so its keybar can seed the footer
			this.keymap = new Keymap({
				onQuit: () => resolve({ action: 'quit' }),
				onBack: () => resolve({ action: 'quit' }), // ESC also quits at root
				bindings: [
					// Nav hint — arrow keys handled by SelectRenderable; this is bar-only
					{
						keys: ['up', 'down', 'k', 'j'],
						hint: `${symbols.arrows.up}${symbols.arrows.down}/1-8`,
						label: 'Select',
						handler: () => {},
					},
					// Enter hint — Select owns enter nav; handler is a safe passthrough
					{ keys: ['enter'], label: 'Confirm', handler: () => select.selectCurrent() },
					// Number shortcuts 1–8 — dispatch but hidden from the keybar
					...this.menuItems.map((_, i) => ({
						keys: [String(i + 1)],
						label: `Item ${i + 1}`,
						hidden: true,
						when: () => i < this.menuItems.length,
						handler: () => {
							select.setSelectedIndex(i);
							select.selectCurrent();
						},
					})),
				],
			});

			// Shell: header + breadcrumb, content region, footer keybar
			const shell = appShell(this.renderer, {
				id: CONTAINER_ID,
				breadcrumb: 'Dashboard',
				footer: this.keymap.toKeybar(),
			});

			// Menu panel
			const menuPanel = panel(this.renderer, { title: 'Quick Actions', flexGrow: 1 });
			menuPanel.add(select);

			// Recent Activity panel — display-only, newest-first
			const activityPanel = panel(this.renderer, { title: 'Recent Activity', flexGrow: 1 });
			if (recent.length === 0) {
				activityPanel.add(
					new TextRenderable(this.renderer, { content: 'No submissions yet', fg: theme.textMuted })
				);
			} else {
				for (const entry of recent) {
					activityPanel.add(
						new TextRenderable(this.renderer, { content: formatActivityRow(entry), fg: theme.text })
					);
				}
			}

			// Body: menu + activity side by side
			const body = new BoxRenderable(this.renderer, { flexDirection: 'row', flexGrow: 1 });
			body.add(menuPanel.box);
			body.add(activityPanel.box);
			shell.content.add(body);

			// Add to renderer
			this.renderer.root.add(shell.root);
			select.focus();
			this.keymap.attach(this.renderer);

			// Menu item selected
			select.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption) => {
				const item = option.value as MenuItem;
				if (!item) return;

				if (item.key === 'quit') {
					resolve({ action: 'quit' });
				} else if (item.key === 'convert') {
					resolve({
						action: 'push',
						screen: 'file-picker',
						data: {
							fileExtension: '.csv',
							title: 'Select CSV File',
							workflowType: 'convert',
							path: config.csvInputDir,
							outputDir: config.outputDir,
						},
					});
				} else if (item.key === 'validate') {
					resolve({
						action: 'push',
						screen: 'file-picker',
						data: {
							fileExtension: '.csv,.xml',
							title: 'Select File to Validate',
							workflowType: 'validate',
							path: config.outputDir,
						},
					});
				} else if (item.key === 'check') {
					resolve({
						action: 'push',
						screen: 'file-picker',
						data: {
							fileExtension: '.xml',
							title: 'Select Current XML Submission',
							workflowType: 'check-current',
							path: config.outputDir,
						},
					});
				} else if (item.key === 'mapping-builder') {
					resolve({ action: 'push', screen: 'mapping-builder' });
				} else if (item.key === 'settings') {
					resolve({ action: 'push', screen: 'settings' });
				} else if (item.key === 'about') {
					resolve({ action: 'push', screen: 'about' });
				} else if (item.key === 'history') {
					resolve({ action: 'push', screen: 'history' });
				} else if (item.implemented) {
					resolve({ action: 'push', screen: item.key });
				}
			});

		});
	}

	cleanup(): void {
		this.keymap?.detach(this.renderer);
		this.renderer.root.remove(CONTAINER_ID);
	}
}

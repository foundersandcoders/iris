/** ====== Success Screen ======
 * Displays success/failure results for workflows
 * Conditionally shows "View Issues" option if validation issues exist
 */
import {
	TextRenderable,
	SelectRenderable,
	SelectRenderableEvents,
	type SelectOption,
} from '@opentui/core';
import type { RenderContext, Renderer } from '../types';
import { theme, symbols } from '../../../assets/brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import { appShell, panel, type AppShell, type Panel } from '../components';
import { Keymap } from '../utils/keymap';

const CONTAINER_ID = 'success-root';

type WorkflowType = 'convert' | 'validate' | 'check';

export class SuccessScreen implements Screen {
	readonly name = 'success';
	private renderer: Renderer;
	private shell?: AppShell;
	private resultPanel?: Panel;
	private keymap?: Keymap;
	private menu?: SelectRenderable;

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		const type = (data?.type as WorkflowType) || 'convert';
		const failed = data?.failed as boolean;
		const error = data?.error as Error;
		const duration = data?.duration as number;
		const outputPath = data?.outputPath as string;
		const learnerCount = data?.learnerCount as number;
		const hasIssues = data?.hasIssues as boolean;
		const validation = data?.validation;

		// Wait for user selection
		return new Promise((resolve) => {
			this.buildUI(type, failed, error, duration, outputPath, learnerCount, hasIssues, resolve);

			if (failed) {
				this.keymap!.attach(this.renderer);
			} else if (this.menu) {
				this.menu.focus();
				this.keymap!.attach(this.renderer);
				this.menu.on(SelectRenderableEvents.ITEM_SELECTED, (_index: number, option: SelectOption) => {
					if (option.value === 'view-issues') {
						resolve({
							action: 'replace',
							screen: 'validation-explorer',
							data: {
								validation,
								sourceType: 'csv', // TODO: pass through from workflow
							},
						});
					} else {
						resolve({ action: 'replace', screen: 'dashboard' });
					}
				});
			}
		});
	}

	cleanup(): void {
		this.keymap?.detach(this.renderer);
		this.renderer.root.remove(CONTAINER_ID);
	}

	private buildUI(
		type: WorkflowType,
		failed: boolean,
		error: Error | undefined,
		duration: number | undefined,
		outputPath: string | undefined,
		learnerCount: number | undefined,
		hasIssues: boolean | undefined,
		resolve: (result: ScreenResult) => void
	): void {
		const breadcrumb = failed ? this.getFailureTitle(type) : this.getSuccessTitle(type);

		if (failed) {
			const finish = () => resolve({ action: 'replace', screen: 'dashboard' });
			this.keymap = new Keymap({
				bindings: [{ keys: ['enter'], label: 'Continue', handler: finish }],
				onQuit: finish,
			});
		} else {
			this.keymap = new Keymap({
				bindings: [
					// Nav hint — arrow keys handled by SelectRenderable; this is bar-only
					{
						keys: ['up', 'down', 'k', 'j'],
						hint: `${symbols.arrows.up}${symbols.arrows.down}`,
						label: 'Select',
						handler: () => {},
					},
					{ keys: ['enter'], label: 'Confirm', handler: () => this.menu?.selectCurrent() },
				],
			});
		}

		this.shell = appShell(this.renderer, {
			id: CONTAINER_ID,
			breadcrumb,
			footer: this.keymap.toKeybar(),
		});

		this.resultPanel = panel(this.renderer, { title: failed ? 'Failed' : 'Result', flexGrow: 1 });

		// Status icon and message
		if (failed) {
			const icon = new TextRenderable(this.renderer, {
				content: symbols.info.error,
				fg: theme.error,
			});
			this.resultPanel.add(icon);

			const title = new TextRenderable(this.renderer, {
				content: this.getFailureTitle(type),
				fg: theme.error,
			});
			this.resultPanel.add(title);

			if (error) {
				this.resultPanel.add(new TextRenderable(this.renderer, { content: '' }));
				const errorMsg = new TextRenderable(this.renderer, {
					content: `Error: ${error.message}`,
					fg: theme.textMuted,
				});
				this.resultPanel.add(errorMsg);
			}
		} else {
			const icon = new TextRenderable(this.renderer, {
				content: symbols.info.success,
				fg: theme.success,
			});
			this.resultPanel.add(icon);

			const title = new TextRenderable(this.renderer, {
				content: this.getSuccessTitle(type),
				fg: theme.success,
			});
			this.resultPanel.add(title);

			this.resultPanel.add(new TextRenderable(this.renderer, { content: '' }));

			// Context-specific details
			if (type === 'convert') {
				if (outputPath) {
					const pathText = new TextRenderable(this.renderer, {
						content: `Output: ${outputPath}`,
						fg: theme.textMuted,
					});
					this.resultPanel.add(pathText);
				}
				if (learnerCount !== undefined) {
					const countText = new TextRenderable(this.renderer, {
						content: `Learners: ${learnerCount}`,
						fg: theme.textMuted,
					});
					this.resultPanel.add(countText);
				}
				if (hasIssues) {
					const issuesText = new TextRenderable(this.renderer, {
						content: 'Validation warnings present (see details)',
						fg: theme.warning,
					});
					this.resultPanel.add(issuesText);
				}
			}

			if (duration !== undefined) {
				const durationText = new TextRenderable(this.renderer, {
					content: `Duration: ${duration}ms`,
					fg: theme.textMuted,
				});
				this.resultPanel.add(durationText);
			}

			this.resultPanel.add(new TextRenderable(this.renderer, { content: '' }));

			// Menu
			const menuOptions: Array<{ name: string; description: string; value: string }> = [
				{ name: 'Return to Dashboard', description: '', value: 'dashboard' },
			];

			if (hasIssues && type === 'convert') {
				menuOptions.push({ name: 'View Issues', description: '', value: 'view-issues' });
			}

			this.menu = new SelectRenderable(this.renderer, {
				options: menuOptions,
				backgroundColor: theme.background,
				focusedBackgroundColor: theme.background,
				selectedBackgroundColor: theme.highlightFocused,
				selectedTextColor: theme.text,
				textColor: theme.textMuted,
			});

			this.resultPanel.add(this.menu);
		}

		this.shell.content.add(this.resultPanel.box);
		this.renderer.root.add(this.shell.root);
	}

	private getSuccessTitle(type: WorkflowType): string {
		switch (type) {
			case 'convert':
				return 'Conversion Complete';
			case 'validate':
				return 'Validation Complete';
			case 'check':
				return 'Check Complete';
		}
	}

	private getFailureTitle(type: WorkflowType): string {
		switch (type) {
			case 'convert':
				return 'Conversion Failed';
			case 'validate':
				return 'Validation Failed';
			case 'check':
				return 'Check Failed';
		}
	}
}

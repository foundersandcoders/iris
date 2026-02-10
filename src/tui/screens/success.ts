/** ====== Success Screen ======
 * Displays success/failure results for workflows
 * Conditionally shows "View Issues" option if validation issues exist
 */
import { BoxRenderable, TextRenderable, SelectRenderable } from '@opentui/core';
import type { RenderContext, Renderer } from '../types';
import { theme } from '../../../brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';

const CONTAINER_ID = 'success-root';

type WorkflowType = 'convert' | 'validate' | 'check';

export class SuccessScreen implements Screen {
	readonly name = 'success';
	private renderer: Renderer;
	private container?: BoxRenderable;
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

		this.buildUI(type, failed, error, duration, outputPath, learnerCount, hasIssues);

		// Wait for user selection
		return new Promise((resolve) => {
			if (failed) {
				// Failure mode: any key returns to dashboard
				const handler = () => {
					this.renderer.keyInput.off('keypress', handler);
					resolve({ action: 'replace', screen: 'dashboard' });
				};
				this.renderer.keyInput.once('keypress', handler);
			} else if (this.menu) {
				// Success mode: use menu
				this.menu.focus();
				this.menu.once('itemSelected', (_index: number, option: { value?: string }) => {
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
		this.renderer.root.remove(CONTAINER_ID);
	}

	private buildUI(
		type: WorkflowType,
		failed: boolean,
		error: Error | undefined,
		duration: number | undefined,
		outputPath: string | undefined,
		learnerCount: number | undefined,
		hasIssues: boolean | undefined
	): void {
		this.container = new BoxRenderable(this.renderer, {
			id: CONTAINER_ID,
			flexDirection: 'column',
			width: '100%',
			height: '100%',
			backgroundColor: theme.background,
		});

		// Status icon and message
		if (failed) {
			const icon = new TextRenderable(this.renderer, {
				content: '✗',
				fg: theme.error,
			});
			this.container.add(icon);

			const title = new TextRenderable(this.renderer, {
				content: this.getFailureTitle(type),
				fg: theme.error,
			});
			this.container.add(title);

			if (error) {
				this.container.add(new TextRenderable(this.renderer, { content: '' }));
				const errorMsg = new TextRenderable(this.renderer, {
					content: `Error: ${error.message}`,
					fg: theme.textMuted,
				});
				this.container.add(errorMsg);
			}

			this.container.add(new TextRenderable(this.renderer, { content: '' }));
			const hint = new TextRenderable(this.renderer, {
				content: '[Any key] Return to Dashboard',
				fg: theme.textMuted,
			});
			this.container.add(hint);
		} else {
			const icon = new TextRenderable(this.renderer, {
				content: '✓',
				fg: theme.success,
			});
			this.container.add(icon);

			const title = new TextRenderable(this.renderer, {
				content: this.getSuccessTitle(type),
				fg: theme.success,
			});
			this.container.add(title);

			this.container.add(new TextRenderable(this.renderer, { content: '' }));

			// Context-specific details
			if (type === 'convert') {
				if (outputPath) {
					const pathText = new TextRenderable(this.renderer, {
						content: `Output: ${outputPath}`,
						fg: theme.textMuted,
					});
					this.container.add(pathText);
				}
				if (learnerCount !== undefined) {
					const countText = new TextRenderable(this.renderer, {
						content: `Learners: ${learnerCount}`,
						fg: theme.textMuted,
					});
					this.container.add(countText);
				}
				if (hasIssues) {
					const issuesText = new TextRenderable(this.renderer, {
						content: 'Validation warnings present (see details)',
						fg: theme.warning,
					});
					this.container.add(issuesText);
				}
			}

			if (duration !== undefined) {
				const durationText = new TextRenderable(this.renderer, {
					content: `Duration: ${duration}ms`,
					fg: theme.textMuted,
				});
				this.container.add(durationText);
			}

			this.container.add(new TextRenderable(this.renderer, { content: '' }));

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

			this.container.add(this.menu);

			// Hint text
			this.container.add(new TextRenderable(this.renderer, { content: '' }));
			this.container.add(
				new TextRenderable(this.renderer, {
					content: '[↑↓] Select  [Enter] Confirm',
					fg: theme.textMuted,
				})
			);
		}

		this.renderer.root.add(this.container);
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

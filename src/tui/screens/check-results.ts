/** ====== Check Results Screen ======
 * Displays cross-submission check results
 * Shows comparison between current and previous submissions
 */
import { BoxRenderable, TextRenderable, SelectRenderable } from '@opentui/core';
import type { RenderContext, Renderer } from '../types';
import { theme } from '../../../brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import type { CheckReport, CheckIssue } from '../../lib/types/workflowTypes';

const CONTAINER_ID = 'check-results-root';

export class CheckResultsScreen implements Screen {
	readonly name = 'check-results';
	private renderer: Renderer;
	private container?: BoxRenderable;
	private issueList?: SelectRenderable;
	private detailPanel?: BoxRenderable;

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		const report = data?.report as CheckReport;
		const hasIssues = data?.hasIssues as boolean;
		const duration = data?.duration as number;
		const returnTo = (data?.returnTo as string) || 'dashboard';

		if (!report) {
			return { action: 'replace', screen: returnTo };
		}

		this.buildUI(report, hasIssues, duration);

		// Wait for user interaction
		return new Promise((resolve) => {
			// Issue selection handler
			if (hasIssues && this.issueList) {
				this.issueList.on('selectionChanged', (index: number) => {
					this.updateDetailPanel(report.issues[index]);
				});

				this.issueList.focus();
			}

			// Keyboard handler
			const handler = (key: { name: string }) => {
				if (key.name === 'escape' || key.name === 'q') {
					this.renderer.keyInput.off('keypress', handler);
					resolve({ action: 'replace', screen: returnTo });
				}
			};
			this.renderer.keyInput.on('keypress', handler);
		});
	}

	cleanup(): void {
		this.renderer.root.remove(CONTAINER_ID);
	}

	private buildUI(report: CheckReport, hasIssues: boolean, duration?: number): void {
		this.container = new BoxRenderable(this.renderer, {
			id: CONTAINER_ID,
			flexDirection: 'column',
			width: '100%',
			height: '100%',
			backgroundColor: theme.background,
		});

		// Title
		const title = new TextRenderable(this.renderer, {
			content: 'Cross-Submission Check',
			fg: theme.primary,
		});
		this.container.add(title);

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Current submission
		this.container.add(
			new TextRenderable(this.renderer, {
				content: `Current: ${report.currentSubmission.filename}`,
				fg: theme.text,
			})
		);
		this.container.add(
			new TextRenderable(this.renderer, {
				content: `  Learners: ${report.currentSubmission.learnerCount}  Schema: ${report.currentSubmission.schema}`,
				fg: theme.textMuted,
			})
		);

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Previous submission
		if (report.previousSubmission) {
			this.container.add(
				new TextRenderable(this.renderer, {
					content: `Previous: ${report.previousSubmission.filename}`,
					fg: theme.text,
				})
			);
			this.container.add(
				new TextRenderable(this.renderer, {
					content: `  Learners: ${report.previousSubmission.learnerCount}  Schema: ${report.previousSubmission.schema}`,
					fg: theme.textMuted,
				})
			);
		} else {
			this.container.add(
				new TextRenderable(this.renderer, {
					content: 'Previous: None (first submission)',
					fg: theme.textMuted,
				})
			);
		}

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Summary
		const summary = new TextRenderable(this.renderer, {
			content: `${report.summary.errorCount} errors, ${report.summary.warningCount} warnings, ${report.summary.infoCount} info`,
			fg: theme.textMuted,
		});
		this.container.add(summary);

		if (duration !== undefined) {
			this.container.add(
				new TextRenderable(this.renderer, {
					content: `Duration: ${duration}ms`,
					fg: theme.textMuted,
				})
			);
		}

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Issues section
		if (hasIssues && report.issues.length > 0) {
			// Issue list
			const issueOptions = report.issues.map((issue, i) => {
				const icon = this.getSeverityIcon(issue.severity);
				return { name: `${icon} ${issue.message}`, description: '', value: String(i) };
			});

			this.issueList = new SelectRenderable(this.renderer, {
				options: issueOptions,
				showScrollIndicator: true,
				backgroundColor: theme.background,
				focusedBackgroundColor: theme.background,
				selectedBackgroundColor: theme.highlightFocused,
				selectedTextColor: theme.text,
				textColor: theme.textMuted,
			});
			this.container.add(this.issueList);

			this.container.add(new TextRenderable(this.renderer, { content: '' }));

			// Detail panel
			this.detailPanel = new BoxRenderable(this.renderer, {
				flexDirection: 'column',
			});
			this.container.add(this.detailPanel);

			// Initial detail display
			this.updateDetailPanel(report.issues[0]);
		} else {
			// No issues
			const successText = new TextRenderable(this.renderer, {
				content: '✓ No issues found',
				fg: theme.success,
			});
			this.container.add(successText);
		}

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Status bar
		const statusBar = new TextRenderable(this.renderer, {
			content: hasIssues
				? '[↑↓] Navigate issues  [ESC/q] Back to Dashboard'
				: '[Any key] Back to Dashboard',
			fg: theme.textMuted,
		});
		this.container.add(statusBar);

		this.renderer.root.add(this.container);
	}

	private updateDetailPanel(issue: CheckIssue): void {
		if (!this.detailPanel) return;

		// Clear existing children
		for (const child of this.detailPanel.getChildren()) {
			this.detailPanel.remove(child.id);
		}

		// Issue title
		this.detailPanel.add(
			new TextRenderable(this.renderer, {
				content: `${this.getSeverityIcon(issue.severity)} ${this.formatCategory(issue.category)}`,
				fg: this.getSeverityColor(issue.severity),
			})
		);

		this.detailPanel.add(new TextRenderable(this.renderer, { content: '' }));

		// Message
		this.detailPanel.add(
			new TextRenderable(this.renderer, {
				content: issue.message,
				fg: theme.text,
			})
		);

		// Details (if present)
		if (issue.details && Object.keys(issue.details).length > 0) {
			this.detailPanel.add(new TextRenderable(this.renderer, { content: '' }));

			for (const [key, value] of Object.entries(issue.details)) {
				const displayValue =
					Array.isArray(value) ? value.join(', ') : String(value);
				this.detailPanel.add(
					new TextRenderable(this.renderer, {
						content: `  ${key}: ${displayValue}`,
						fg: theme.textMuted,
					})
				);
			}
		}
	}

	private getSeverityIcon(severity: CheckIssue['severity']): string {
		switch (severity) {
			case 'error':
				return '✗';
			case 'warning':
				return '⚠';
			case 'info':
				return 'ℹ';
		}
	}

	private getSeverityColor(severity: CheckIssue['severity']): string {
		switch (severity) {
			case 'error':
				return theme.error;
			case 'warning':
				return theme.warning;
			case 'info':
				return theme.info;
		}
	}

	private formatCategory(category: CheckIssue['category']): string {
		return category
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
}

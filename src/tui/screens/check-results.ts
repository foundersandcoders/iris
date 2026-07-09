/** ====== Check Results Screen ======
 * Displays cross-submission check results
 * Shows comparison between current and previous submissions
 */
import { BoxRenderable, TextRenderable, SelectRenderable } from '@opentui/core';
import type { RenderContext, Renderer } from '../types';
import { theme, symbols } from '../../../assets/brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import type { CheckReport, CheckIssue } from '../../lib/types/workflowTypes';
import { appShell, panel, type AppShell, type Panel } from '../components';
import { Keymap } from '../utils/keymap';

const CONTAINER_ID = 'check-results-root';

export class CheckResultsScreen implements Screen {
	readonly name = 'check-results';
	private renderer: Renderer;
	private shell?: AppShell;
	private issuesPanel?: Panel;
	private detailPanel?: Panel;
	private detailContainer?: BoxRenderable;
	private keymap?: Keymap;
	private issueList?: SelectRenderable;
	private activePanel: 'issues' | 'detail' = 'issues';

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		const report = data?.report as CheckReport;
		const hasIssues = data?.hasIssues as boolean;
		const duration = data?.duration as number;

		if (!report) {
			return { action: 'pop' };
		}

		// Wait for user interaction
		return new Promise((resolve) => {
			const keymap = this.buildUI(report, hasIssues, resolve, duration);

			// Issue selection handler
			if (hasIssues && this.issueList) {
				this.issueList.on('selectionChanged', (index: number) => {
					this.updateDetailPanel(report.issues[index]);
				});

				this.issueList.focus();
				this.issuesPanel?.setFocused(true);
			}

			keymap.attach(this.renderer);
		});
	}

	cleanup(): void {
		this.keymap?.detach(this.renderer);
		this.renderer.root.remove(CONTAINER_ID);
	}

	/** Flip focus between the Issues and Detail panes (bound to Tab via the keymap). */
	private togglePanel(): void {
		if (!this.detailPanel) return; // no detail pane to switch to (no-issues mode)

		this.activePanel = this.activePanel === 'issues' ? 'detail' : 'issues';
		this.issuesPanel?.setFocused(this.activePanel === 'issues');
		this.detailPanel?.setFocused(this.activePanel === 'detail');

		if (this.activePanel === 'issues') {
			this.issueList?.focus();
		}
	}

	private buildUI(
		report: CheckReport,
		hasIssues: boolean,
		resolve: (result: ScreenResult) => void,
		duration?: number
	): Keymap {
		const finish = () => resolve({ action: 'replace', screen: 'dashboard' });
		const hasIssueList = hasIssues && report.issues.length > 0;

		this.keymap = new Keymap({
			bindings: hasIssueList
				? [
						// Nav hint — arrow keys handled by SelectRenderable; this is bar-only
						{
							keys: ['up', 'down', 'k', 'j'],
							hint: `${symbols.arrows.up}${symbols.arrows.down}`,
							label: 'Navigate',
							handler: () => {},
						},
						{ keys: ['tab'], label: 'Switch Pane', handler: () => this.togglePanel() },
					]
				: [],
			onBack: finish,
			onQuit: finish,
		});
		const keymap = this.keymap;

		this.shell = appShell(this.renderer, {
			id: CONTAINER_ID,
			breadcrumb: 'Cross-Submission Check',
			footer: keymap.toKeybar(),
		});

		// Current submission
		this.shell.content.add(
			new TextRenderable(this.renderer, {
				content: `Current: ${report.currentSubmission.filename}`,
				fg: theme.text,
			})
		);
		this.shell.content.add(
			new TextRenderable(this.renderer, {
				content: `  Learners: ${report.currentSubmission.learnerCount}  Schema: ${report.currentSubmission.schema}`,
				fg: theme.textMuted,
			})
		);

		// Previous submission
		if (report.previousSubmission) {
			this.shell.content.add(
				new TextRenderable(this.renderer, {
					content: `Previous: ${report.previousSubmission.filename}`,
					fg: theme.text,
				})
			);
			this.shell.content.add(
				new TextRenderable(this.renderer, {
					content: `  Learners: ${report.previousSubmission.learnerCount}  Schema: ${report.previousSubmission.schema}`,
					fg: theme.textMuted,
				})
			);
		} else {
			this.shell.content.add(
				new TextRenderable(this.renderer, {
					content: 'Previous: None (first submission)',
					fg: theme.textMuted,
				})
			);
		}

		// Summary
		const summary = new TextRenderable(this.renderer, {
			content: `${report.summary.errorCount} errors, ${report.summary.warningCount} warnings, ${report.summary.infoCount} info`,
			fg: theme.textMuted,
		});
		this.shell.content.add(summary);

		if (duration !== undefined) {
			this.shell.content.add(
				new TextRenderable(this.renderer, {
					content: `Duration: ${duration}ms`,
					fg: theme.textMuted,
				})
			);
		}

		this.shell.content.add(new TextRenderable(this.renderer, { content: '' }));

		// Issues section
		if (hasIssueList) {
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
				flexGrow: 1,
			});

			this.issuesPanel = panel(this.renderer, { title: 'Issues', flexGrow: 1, focused: true });
			this.issuesPanel.add(this.issueList);

			this.detailContainer = new BoxRenderable(this.renderer, { flexDirection: 'column' });
			this.detailPanel = panel(this.renderer, { title: 'Detail', flexGrow: 1 });
			this.detailPanel.add(this.detailContainer);

			const body = new BoxRenderable(this.renderer, { flexDirection: 'row', flexGrow: 1 });
			body.add(this.issuesPanel.box);
			body.add(this.detailPanel.box);
			this.shell.content.add(body);

			// Initial detail display
			this.updateDetailPanel(report.issues[0]);
		} else {
			// No issues
			const successText = new TextRenderable(this.renderer, {
				content: `${symbols.info.success} No issues found`,
				fg: theme.success,
			});
			this.shell.content.add(successText);
		}

		this.renderer.root.add(this.shell.root);

		return keymap;
	}

	private updateDetailPanel(issue: CheckIssue): void {
		if (!this.detailContainer) return;

		// Clear existing children
		for (const child of this.detailContainer.getChildren()) {
			this.detailContainer.remove(child.id);
		}

		// Issue title
		this.detailContainer.add(
			new TextRenderable(this.renderer, {
				content: `${this.getSeverityIcon(issue.severity)} ${this.formatCategory(issue.category)}`,
				fg: this.getSeverityColor(issue.severity),
			})
		);

		this.detailContainer.add(new TextRenderable(this.renderer, { content: '' }));

		// Message
		this.detailContainer.add(
			new TextRenderable(this.renderer, {
				content: issue.message,
				fg: theme.text,
			})
		);

		// Details (if present)
		if (issue.details && Object.keys(issue.details).length > 0) {
			this.detailContainer.add(new TextRenderable(this.renderer, { content: '' }));

			for (const [key, value] of Object.entries(issue.details)) {
				const displayValue =
					Array.isArray(value) ? value.join(', ') : String(value);
				this.detailContainer.add(
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
				return symbols.info.error;
			case 'warning':
				return symbols.info.warning;
			case 'info':
				return 'i';
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

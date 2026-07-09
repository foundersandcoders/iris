/** ====== Validation Explorer Screen ======
 * Interactive issue browser for validation results
 * Supports filtering by severity (Errors/Warnings/All)
 */
import { BoxRenderable, TextRenderable, SelectRenderable, TabSelectRenderable } from '@opentui/core';
import type { RenderContext, Renderer } from '../types';
import { theme, symbols } from '../../../assets/brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import type { ValidationIssue, ValidationResult } from '../../lib/utils/csv/csvValidator';
import type { SchemaValidationIssue } from '../../lib/types/schemaTypes';
import { appShell, panel, type AppShell, type Panel } from '../components';
import { Keymap } from '../utils/keymap';

const CONTAINER_ID = 'validation-explorer-root';

type TabFilter = 'errors' | 'warnings' | 'all';

// Normalised issue for display
interface DisplayIssue {
	severity: 'error' | 'warning' | 'info';
	field: string;
	row?: number;
	message: string;
	code: string;
	value?: unknown;
}

export class ValidationExplorerScreen implements Screen {
	readonly name = 'validation-explorer';
	private renderer: Renderer;
	private shell?: AppShell;
	private filterPanel?: Panel;
	private issuesPanel?: Panel;
	private detailPanel?: Panel;
	private detailContainer?: BoxRenderable;
	private keymap?: Keymap;
	private tabs?: TabSelectRenderable;
	private issueList?: SelectRenderable;
	private activePanel: 'issues' | 'detail' = 'issues';

	private allIssues: DisplayIssue[] = [];
	private currentFilter: TabFilter = 'all';

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(data?: ScreenData): Promise<ScreenResult> {
		const validation = data?.validation as
			| ValidationResult
			| { issues: SchemaValidationIssue[]; valid: boolean; errorCount: number; warningCount: number };
		const sourceType = (data?.sourceType as 'csv' | 'xml') || 'csv';

		if (!validation) {
			return { action: 'pop' };
		}

		// Normalise issues
		this.allIssues = this.normaliseIssues(validation, sourceType);

		// Wait for user interaction
		return new Promise((resolve) => {
			const keymap = this.buildUI(validation.errorCount, validation.warningCount, resolve);

			// Tab change handler
			this.tabs?.on('selectionChanged', (_index: number, option: { value?: string }) => {
				const tabValue = (option.value || 'all') as TabFilter;
				this.currentFilter = tabValue;
				this.updateIssueList();
				// Move focus back to the issues pane after selecting a filter
				this.activePanel = 'issues';
				this.issuesPanel?.setFocused(true);
				this.detailPanel?.setFocused(false);
				this.issueList?.focus();
			});

			// Issue selection handler
			this.issueList?.on('selectionChanged', (index: number) => {
				this.updateDetailPanel(index);
			});

			// Focus issue list initially
			this.issueList?.focus();
			this.issuesPanel?.setFocused(true);

			keymap.attach(this.renderer);
		});
	}

	cleanup(): void {
		this.keymap?.detach(this.renderer);
		this.renderer.root.remove(CONTAINER_ID);
	}

	/** Flip focus between the Issues and Detail panes (bound to Tab via the keymap). */
	private togglePanel(): void {
		if (!this.detailPanel) return;

		this.activePanel = this.activePanel === 'issues' ? 'detail' : 'issues';
		this.issuesPanel?.setFocused(this.activePanel === 'issues');
		this.detailPanel?.setFocused(this.activePanel === 'detail');

		if (this.activePanel === 'issues') {
			this.issueList?.focus();
		}
	}

	private normaliseIssues(
		validation:
			| ValidationResult
			| { issues: SchemaValidationIssue[]; valid: boolean; errorCount: number; warningCount: number },
		sourceType: 'csv' | 'xml'
	): DisplayIssue[] {
		// Check if this is ValidationResult or SchemaValidationResult
		if (this.isValidationResult(validation)) {
			// CSV validation issues
			return validation.issues.map((issue) => ({
				severity: issue.severity,
				field: issue.field || 'general',
				row: issue.row,
				message: issue.message,
				code: issue.code,
				value: issue.actualValue,
			}));
		} else {
			// XML schema validation issues
			return validation.issues.map((issue) => ({
				severity: issue.severity,
				field: issue.sourceField || issue.elementPath || 'general',
				row: issue.rowIndex,
				message: issue.message,
				code: issue.code,
				value: issue.actualValue,
			}));
		}
	}

	private isValidationResult(
		validation: ValidationResult | { issues: SchemaValidationIssue[] }
	): validation is ValidationResult {
		return (
			validation.issues.length === 0 ||
			('field' in validation.issues[0] && !('elementPath' in validation.issues[0]))
		);
	}

	private buildUI(
		errorCount: number,
		warningCount: number,
		resolve: (result: ScreenResult) => void
	): Keymap {
		const finish = () => resolve({ action: 'replace', screen: 'dashboard' });

		this.keymap = new Keymap({
			bindings: [
				// Nav hint — arrow keys handled by SelectRenderable; this is bar-only
				{
					keys: ['up', 'down', 'k', 'j'],
					hint: `${symbols.arrows.up}${symbols.arrows.down}`,
					label: 'Navigate',
					handler: () => {},
				},
				{ keys: ['tab'], label: 'Switch Pane', handler: () => this.togglePanel() },
				{
					keys: ['left', 'h'],
					hint: `${symbols.arrows.left}${symbols.arrows.right}`,
					label: 'Filter',
					handler: () => this.tabs?.moveLeft(),
				},
				{ keys: ['right', 'l'], label: 'Filter', hidden: true, handler: () => this.tabs?.moveRight() },
			],
			onBack: finish,
			onQuit: finish,
		});
		const keymap = this.keymap;

		this.shell = appShell(this.renderer, {
			id: CONTAINER_ID,
			breadcrumb: 'Validation Issues',
			footer: keymap.toKeybar(),
		});

		// Summary
		this.shell.content.add(
			new TextRenderable(this.renderer, {
				content: `${errorCount} errors, ${warningCount} warnings`,
				fg: theme.textMuted,
			})
		);

		this.shell.content.add(new TextRenderable(this.renderer, { content: '' }));

		// Filter bar
		this.tabs = new TabSelectRenderable(this.renderer, {
			options: [
				{ name: 'Errors', description: '', value: 'errors' },
				{ name: 'Warnings', description: '', value: 'warnings' },
				{ name: 'All', description: '', value: 'all' },
			],
		});
		this.filterPanel = panel(this.renderer, { title: 'Filter' });
		this.filterPanel.add(this.tabs);
		this.shell.content.add(this.filterPanel.box);

		this.shell.content.add(new TextRenderable(this.renderer, { content: '' }));

		// Issue list (initially empty, will be populated by updateIssueList)
		this.issueList = new SelectRenderable(this.renderer, {
			options: [],
			showScrollIndicator: true,
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

		this.renderer.root.add(this.shell.root);

		// Initial population
		this.updateIssueList();

		return keymap;
	}

	private updateIssueList(): void {
		if (!this.issueList) return;

		// Filter issues based on current tab
		const filtered = this.allIssues.filter((issue) => {
			if (this.currentFilter === 'errors') return issue.severity === 'error';
			if (this.currentFilter === 'warnings') return issue.severity === 'warning';
			return true; // 'all'
		});

		// Build options
		const options = filtered.map((issue, i) => {
			const rowDisplay = issue.row !== undefined ? ` (row ${issue.row + 1})` : '';
			const icon = issue.severity === 'error' ? symbols.info.error : symbols.info.warning;
			return { name: `${icon} ${issue.field}${rowDisplay}`, description: '', value: String(i) };
		});

		this.issueList.options = options;

		// Update detail panel for first issue
		if (filtered.length > 0) {
			this.updateDetailPanel(0);
		} else {
			this.clearDetailPanel();
		}
	}

	private updateDetailPanel(index: number): void {
		if (!this.detailContainer) return;

		// Clear existing content by removing all children
		const children = this.detailContainer.getChildren();
		for (const child of children) {
			this.detailContainer.remove(child.id);
		}

		// Filter issues based on current filter
		const filtered = this.allIssues.filter((issue) => {
			if (this.currentFilter === 'errors') return issue.severity === 'error';
			if (this.currentFilter === 'warnings') return issue.severity === 'warning';
			return true;
		});

		const issue = filtered[index];
		if (!issue) return;

		// Count occurrences of this error pattern
		const samePattern = filtered.filter((i) => i.code === issue.code && i.field === issue.field);
		if (samePattern.length > 1) {
			const position = samePattern.indexOf(issue) + 1;
			this.detailContainer.add(
				new TextRenderable(this.renderer, {
					content: `Occurrence ${position} of ${samePattern.length}`,
					fg: theme.textMuted,
				})
			);
			this.detailContainer.add(new TextRenderable(this.renderer, { content: '' }));
		}

		// Field
		const fieldLabel = new TextRenderable(this.renderer, {
			content: 'Field:',
			fg: theme.textMuted,
		});
		this.detailContainer.add(fieldLabel);

		const fieldValue = new TextRenderable(this.renderer, {
			content: issue.field,
			fg: theme.text,
		});
		this.detailContainer.add(fieldValue);

		this.detailContainer.add(new TextRenderable(this.renderer, { content: '' }));

		// Row
		if (issue.row !== undefined) {
			const rowLabel = new TextRenderable(this.renderer, {
				content: 'Row:',
				fg: theme.textMuted,
			});
			this.detailContainer.add(rowLabel);

			const rowValue = new TextRenderable(this.renderer, {
				content: String(issue.row + 1), // Display as 1-indexed for non-dev users
				fg: theme.text,
			});
			this.detailContainer.add(rowValue);

			this.detailContainer.add(new TextRenderable(this.renderer, { content: '' }));
		}

		// Code
		const codeLabel = new TextRenderable(this.renderer, {
			content: 'Code:',
			fg: theme.textMuted,
		});
		this.detailContainer.add(codeLabel);

		const codeValue = new TextRenderable(this.renderer, {
			content: issue.code,
			fg: theme.text,
		});
		this.detailContainer.add(codeValue);

		this.detailContainer.add(new TextRenderable(this.renderer, { content: '' }));

		// Message
		const messageLabel = new TextRenderable(this.renderer, {
			content: 'Message:',
			fg: theme.textMuted,
		});
		this.detailContainer.add(messageLabel);

		const messageValue = new TextRenderable(this.renderer, {
			content: issue.message,
			fg: issue.severity === 'error' ? theme.error : theme.warning,
		});
		this.detailContainer.add(messageValue);

		// Value (if present)
		if (issue.value !== undefined) {
			this.detailContainer.add(new TextRenderable(this.renderer, { content: '' }));

			const valueLabel = new TextRenderable(this.renderer, {
				content: 'Value:',
				fg: theme.textMuted,
			});
			this.detailContainer.add(valueLabel);

			const valueStr = JSON.stringify(issue.value);
			const valueValue = new TextRenderable(this.renderer, {
				content: valueStr,
				fg: theme.text,
			});
			this.detailContainer.add(valueValue);
		}
	}

	private clearDetailPanel(): void {
		if (!this.detailContainer) return;

		// Clear existing content by removing all children
		const children = this.detailContainer.getChildren();
		for (const child of children) {
			this.detailContainer.remove(child.id);
		}

		const emptyText = new TextRenderable(this.renderer, {
			content: 'No issues to display',
			fg: theme.textMuted,
		});
		this.detailContainer.add(emptyText);
	}
}

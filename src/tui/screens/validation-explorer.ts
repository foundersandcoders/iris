/** ====== Validation Explorer Screen ======
 * Interactive issue browser for validation results
 * Supports filtering by severity (Errors/Warnings/All)
 */
import {
	BoxRenderable,
	TextRenderable,
	SelectRenderable,
	TabSelectRenderable,
} from '@opentui/core';
import type { RenderContext, Renderer } from '../types';
import { theme } from '../../../brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import type { ValidationIssue, ValidationResult } from '../../lib/utils/csv/csvValidator';
import type { SchemaValidationIssue } from '../../lib/types/schemaTypes';

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
	private container?: BoxRenderable;
	private tabs?: TabSelectRenderable;
	private issueList?: SelectRenderable;
	private detailPanel?: BoxRenderable;

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
			return { action: 'replace', screen: 'dashboard' };
		}

		// Normalise issues
		this.allIssues = this.normaliseIssues(validation, sourceType);

		this.buildUI(validation.errorCount, validation.warningCount);

		// Wait for user interaction
		return new Promise((resolve) => {
			// Tab change handler
			this.tabs?.on('selectionChanged', (_index: number, option: { value?: string }) => {
				const tabValue = (option.value || 'all') as TabFilter;
				this.currentFilter = tabValue;
				this.updateIssueList();
			});

			// Issue selection handler
			this.issueList?.on('selectionChanged', (index: number) => {
				this.updateDetailPanel(index);
			});

			// Keyboard handlers
			const handler = (key: { name: string }) => {
				if (key.name === 'escape' || key.name === 'q') {
					this.renderer.keyInput.off('keypress', handler);
					resolve({ action: 'replace', screen: 'dashboard' });
				}
			};
			this.renderer.keyInput.on('keypress', handler);

			// Focus tabs initially
			this.tabs?.focus();
		});
	}

	cleanup(): void {
		this.renderer.root.remove(CONTAINER_ID);
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

	private buildUI(errorCount: number, warningCount: number): void {
		this.container = new BoxRenderable(this.renderer, {
			id: CONTAINER_ID,
			flexDirection: 'column',
			width: '100%',
			height: '100%',
			backgroundColor: theme.background,
		});

		// Title
		const title = new TextRenderable(this.renderer, {
			content: 'Validation Issues',
			fg: theme.primary,
		});
		this.container.add(title);

		// Summary
		const summary = new TextRenderable(this.renderer, {
			content: `${errorCount} errors, ${warningCount} warnings`,
			fg: theme.textMuted,
		});
		this.container.add(summary);

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Tabs
		this.tabs = new TabSelectRenderable(this.renderer, {
			options: [
				{ name: 'Errors', description: '', value: 'errors' },
				{ name: 'Warnings', description: '', value: 'warnings' },
				{ name: 'All', description: '', value: 'all' },
			],
		});
		this.container.add(this.tabs);

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Issue list (initially empty, will be populated by updateIssueList)
		this.issueList = new SelectRenderable(this.renderer, {
			options: [],
			showScrollIndicator: true,
		});
		this.container.add(this.issueList);

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Detail panel
		this.detailPanel = new BoxRenderable(this.renderer, {
			flexDirection: 'column',
			border: { type: 'single', fg: theme.border },
			padding: { left: 1, right: 1 },
		});
		this.container.add(this.detailPanel);

		this.container.add(new TextRenderable(this.renderer, { content: '' }));

		// Status bar
		const statusBar = new TextRenderable(this.renderer, {
			content: '[↑↓] Navigate  [Tab] Switch filter  [ESC/q] Back',
			fg: theme.textMuted,
		});
		this.container.add(statusBar);

		this.renderer.root.add(this.container);

		// Initial population
		this.updateIssueList();
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
			const rowDisplay = issue.row !== undefined ? ` (row ${issue.row})` : '';
			const icon = issue.severity === 'error' ? '✗' : '⚠';
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
		if (!this.detailPanel) return;

		// Clear existing content
		this.detailPanel.clear?.() || this.detailPanel.children?.splice(0);

		// Filter issues based on current filter
		const filtered = this.allIssues.filter((issue) => {
			if (this.currentFilter === 'errors') return issue.severity === 'error';
			if (this.currentFilter === 'warnings') return issue.severity === 'warning';
			return true;
		});

		const issue = filtered[index];
		if (!issue) return;

		// Field
		const fieldLabel = new TextRenderable(this.renderer, {
			content: 'Field:',
			fg: theme.textMuted,
		});
		this.detailPanel.add(fieldLabel);

		const fieldValue = new TextRenderable(this.renderer, {
			content: issue.field,
			fg: theme.text,
		});
		this.detailPanel.add(fieldValue);

		this.detailPanel.add(new TextRenderable(this.renderer, { content: '' }));

		// Row
		if (issue.row !== undefined) {
			const rowLabel = new TextRenderable(this.renderer, {
				content: 'Row:',
				fg: theme.textMuted,
			});
			this.detailPanel.add(rowLabel);

			const rowValue = new TextRenderable(this.renderer, {
				content: String(issue.row),
				fg: theme.text,
			});
			this.detailPanel.add(rowValue);

			this.detailPanel.add(new TextRenderable(this.renderer, { content: '' }));
		}

		// Code
		const codeLabel = new TextRenderable(this.renderer, {
			content: 'Code:',
			fg: theme.textMuted,
		});
		this.detailPanel.add(codeLabel);

		const codeValue = new TextRenderable(this.renderer, {
			content: issue.code,
			fg: theme.text,
		});
		this.detailPanel.add(codeValue);

		this.detailPanel.add(new TextRenderable(this.renderer, { content: '' }));

		// Message
		const messageLabel = new TextRenderable(this.renderer, {
			content: 'Message:',
			fg: theme.textMuted,
		});
		this.detailPanel.add(messageLabel);

		const messageValue = new TextRenderable(this.renderer, {
			content: issue.message,
			fg: issue.severity === 'error' ? theme.error : theme.warning,
		});
		this.detailPanel.add(messageValue);

		// Value (if present)
		if (issue.value !== undefined) {
			this.detailPanel.add(new TextRenderable(this.renderer, { content: '' }));

			const valueLabel = new TextRenderable(this.renderer, {
				content: 'Value:',
				fg: theme.textMuted,
			});
			this.detailPanel.add(valueLabel);

			const valueStr = JSON.stringify(issue.value);
			const valueValue = new TextRenderable(this.renderer, {
				content: valueStr,
				fg: theme.text,
			});
			this.detailPanel.add(valueValue);
		}
	}

	private clearDetailPanel(): void {
		if (!this.detailPanel) return;
		this.detailPanel.clear?.() || this.detailPanel.children?.splice(0);

		const emptyText = new TextRenderable(this.renderer, {
			content: 'No issues to display',
			fg: theme.textMuted,
		});
		this.detailPanel.add(emptyText);
	}
}

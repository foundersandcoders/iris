import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationExplorerScreen } from '../../../src/tui/screens/validation-explorer';
import * as tuiFixtures from '../../fixtures/tui/tui';
import type { ValidationResult } from '../../../src/lib/utils/csv/csvValidator';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

const validationWithIssues: ValidationResult = {
	valid: false,
	errorCount: 1,
	warningCount: 1,
	issues: [
		{
			severity: 'error',
			field: 'learner_ref',
			row: 2,
			message: 'Learner reference is required',
			code: 'REQUIRED_FIELD',
			actualValue: '',
		},
		{
			severity: 'warning',
			field: 'postcode',
			row: 5,
			message: 'Postcode format looks unusual',
			code: 'FORMAT_WARNING',
			actualValue: 'XX1',
		},
	],
};

const validationWithoutIssues: ValidationResult = {
	valid: true,
	errorCount: 0,
	warningCount: 0,
	issues: [],
};

describe('ValidationExplorerScreen', () => {
	let mockContext: ReturnType<typeof tuiFixtures.createMockContext>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = tuiFixtures.createMockContext();
	});

	it('can be instantiated', () => {
		const screen = new ValidationExplorerScreen(mockContext);
		expect(screen).toBeInstanceOf(ValidationExplorerScreen);
		expect(screen.name).toBe('validation-explorer');
	});

	it('pops immediately when no validation is provided', async () => {
		const screen = new ValidationExplorerScreen(mockContext);
		const result = await screen.render({});
		expect(result).toEqual({ action: 'pop' });
	});

	describe('with issues', () => {
		it('mounts the app shell to the renderer root', async () => {
			const screen = new ValidationExplorerScreen(mockContext);
			screen.render({ validation: validationWithIssues, sourceType: 'csv' });

			await new Promise((resolve) => setTimeout(resolve, 10));

			// One call for the screen shell, one for the auto-mounted help overlay (TR.C1),
			// one for the auto-mounted confirm overlay (TR.C2).
			expect(mockContext.renderer.root.add).toHaveBeenCalledTimes(3);
			const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
			expect(shellRoot.constructor.name).toBe('BoxRenderable');

			screen.cleanup();
		});

		it('shows a breadcrumb for Validation Issues', async () => {
			const screen = new ValidationExplorerScreen(mockContext);
			screen.render({ validation: validationWithIssues, sourceType: 'csv' });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
			const header = shellRoot.getChildren()[0];
			expect(header.content.chunks[0].text).toContain('Validation Issues');

			screen.cleanup();
		});

		it('renders a footer keybar containing "Switch Pane" and "Filter"', async () => {
			const screen = new ValidationExplorerScreen(mockContext);
			screen.render({ validation: validationWithIssues, sourceType: 'csv' });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
			const children = shellRoot.getChildren();
			const footer = children[children.length - 1];
			expect(footer.constructor.name).toBe('TextRenderable');
			expect(footer.content.chunks[0].text).toContain('Switch Pane');
			expect(footer.content.chunks[0].text).toContain('Filter');

			screen.cleanup();
		});

		it('wraps the filter bar, issue list, and detail view in titled panels', async () => {
			const screen = new ValidationExplorerScreen(mockContext);
			screen.render({ validation: validationWithIssues, sourceType: 'csv' });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const filterPanel = (screen as any).filterPanel;
			const issuesPanel = (screen as any).issuesPanel;
			const detailPanel = (screen as any).detailPanel;
			expect(filterPanel.box.title).toBe('Filter');
			expect(issuesPanel.box.title).toBe('Issues');
			expect(detailPanel.box.title).toBe('Detail');

			screen.cleanup();
		});

		it('updates the detail panel when a different issue is selected', async () => {
			const screen = new ValidationExplorerScreen(mockContext);
			screen.render({ validation: validationWithIssues, sourceType: 'csv' });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const issueList = (screen as any).issueList;
			const handler = (issueList.on as any).mock.calls.find(
				(call: any[]) => call[0] === 'selectionChanged'
			)[1];
			handler(1);

			const detailContainer = (screen as any).detailContainer;
			const rendered = detailContainer
				.getChildren()
				.map((c: any) => c.content?.chunks?.[0]?.text ?? '')
				.join(' ');
			expect(rendered).toContain('Postcode format looks unusual');

			screen.cleanup();
		});

		it('aligns the tab bar selection with currentFilter (all) on mount', async () => {
			const screen = new ValidationExplorerScreen(mockContext);
			screen.render({ validation: validationWithIssues, sourceType: 'csv' });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const tabs = (screen as any).tabs;
			expect(tabs.setSelectedIndex).toHaveBeenCalledWith(2);
			expect(tabs.selectedIndex).toBe(2);

			screen.cleanup();
		});

		it('rebuilds the issue list when the filter tab changes', async () => {
			const screen = new ValidationExplorerScreen(mockContext);
			screen.render({ validation: validationWithIssues, sourceType: 'csv' });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const tabs = (screen as any).tabs;
			const issueList = (screen as any).issueList;
			const handler = (tabs.on as any).mock.calls.find(
				(call: any[]) => call[0] === 'selectionChanged'
			)[1];

			handler(0, { value: 'errors' });

			expect(issueList.options).toHaveLength(1);
			expect(issueList.options[0].name).toContain('learner_ref');

			screen.cleanup();
		});

		it('flips the focused panel border when Tab is pressed', async () => {
			const screen = new ValidationExplorerScreen(mockContext);
			screen.render({ validation: validationWithIssues, sourceType: 'csv' });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const issuesPanel = (screen as any).issuesPanel;
			const detailPanel = (screen as any).detailPanel;

			// Issues panel starts focused, detail panel unfocused.
			expect(issuesPanel.box.borderColor).not.toEqual(detailPanel.box.borderColor);
			const focusedColor = issuesPanel.box.borderColor;
			const unfocusedColor = detailPanel.box.borderColor;

			const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
			handler({ name: 'tab' });

			// After Tab, the colours swap: detail is now focused, issues is not.
			expect(issuesPanel.box.borderColor).toEqual(unfocusedColor);
			expect(detailPanel.box.borderColor).toEqual(focusedColor);

			// Pressing Tab again swaps back to the original focused/unfocused state.
			handler({ name: 'tab' });
			expect(issuesPanel.box.borderColor).toEqual(focusedColor);
			expect(detailPanel.box.borderColor).toEqual(unfocusedColor);

			screen.cleanup();
		});

		it('moves keyboard focus off the issue list when the Detail pane is active', async () => {
			const screen = new ValidationExplorerScreen(mockContext);
			screen.render({ validation: validationWithIssues, sourceType: 'csv' });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const issueList = (screen as any).issueList;
			const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];

			expect(issueList.focus).toHaveBeenCalledTimes(1);
			expect(issueList.blur).not.toHaveBeenCalled();

			// Tab to Detail: the list must give up keyboard focus so arrow keys stop reaching it.
			handler({ name: 'tab' });
			expect(issueList.blur).toHaveBeenCalledTimes(1);
			expect(issueList.focus).toHaveBeenCalledTimes(1);

			// Tab back to Issues: focus returns to the list.
			handler({ name: 'tab' });
			expect(issueList.focus).toHaveBeenCalledTimes(2);
			expect(issueList.blur).toHaveBeenCalledTimes(1);

			screen.cleanup();
		});

		it('resolves to the dashboard on ESC/q via the keymap', async () => {
			const screen = new ValidationExplorerScreen(mockContext);
			const resultPromise = screen.render({ validation: validationWithIssues, sourceType: 'csv' });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
			handler({ name: 'escape' });

			const result = await resultPromise;
			expect(result).toEqual({ action: 'replace', screen: 'dashboard' });

			screen.cleanup();
		});

		it('resolves to the dashboard on q via the keymap', async () => {
			const screen = new ValidationExplorerScreen(mockContext);
			const resultPromise = screen.render({ validation: validationWithIssues, sourceType: 'csv' });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
			handler({ name: 'q' });

			const result = await resultPromise;
			expect(result).toEqual({ action: 'replace', screen: 'dashboard' });

			screen.cleanup();
		});
	});

	describe('without issues', () => {
		it('shows "No issues to display" in the detail panel', async () => {
			const screen = new ValidationExplorerScreen(mockContext);
			screen.render({ validation: validationWithoutIssues, sourceType: 'csv' });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const detailContainer = (screen as any).detailContainer;
			const rendered = detailContainer
				.getChildren()
				.map((c: any) => c.content?.chunks?.[0]?.text ?? '')
				.join(' ');
			expect(rendered).toContain('No issues to display');

			screen.cleanup();
		});
	});

	it('cleanup detaches the keymap and removes the shell from the renderer root', async () => {
		const screen = new ValidationExplorerScreen(mockContext);
		screen.render({ validation: validationWithIssues, sourceType: 'csv' });

		await new Promise((resolve) => setTimeout(resolve, 10));

		screen.cleanup();

		expect(mockContext.renderer.keyInput.off).toHaveBeenCalledWith('keypress', expect.any(Function));
		// One removal for the screen shell, one for the help overlay (TR.C1),
		// one for the confirm overlay (TR.C2).
		expect(mockContext.renderer.root.remove).toHaveBeenCalledTimes(3);
	});
});

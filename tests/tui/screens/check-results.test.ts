import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckResultsScreen } from '../../../src/tui/screens/check-results';
import * as tuiFixtures from '../../fixtures/tui/tui';
import type { CheckReport } from '../../../src/lib/types/workflowTypes';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

const reportWithIssues: CheckReport = {
	currentSubmission: {
		filename: 'ILR-current.xml',
		learnerCount: 10,
		schema: 'ILR2526',
		learnerRefs: ['L1', 'L2'],
	},
	previousSubmission: {
		filename: 'ILR-previous.xml',
		learnerCount: 8,
		schema: 'ILR2526',
		timestamp: '2026-06-01T00:00:00.000Z',
	},
	issues: [
		{
			severity: 'error',
			category: 'learner_count',
			message: 'Learner count dropped unexpectedly',
			details: { previous: 8, current: 10 },
		},
		{
			severity: 'warning',
			category: 'schema_version',
			message: 'Schema version changed',
		},
	],
	summary: { totalIssues: 2, errorCount: 1, warningCount: 1, infoCount: 0 },
};

const reportWithoutIssues: CheckReport = {
	currentSubmission: {
		filename: 'ILR-current.xml',
		learnerCount: 10,
		schema: 'ILR2526',
		learnerRefs: ['L1', 'L2'],
	},
	issues: [],
	summary: { totalIssues: 0, errorCount: 0, warningCount: 0, infoCount: 0 },
};

describe('CheckResultsScreen', () => {
	let mockContext: ReturnType<typeof tuiFixtures.createMockContext>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = tuiFixtures.createMockContext();
	});

	it('can be instantiated', () => {
		const screen = new CheckResultsScreen(mockContext);
		expect(screen).toBeInstanceOf(CheckResultsScreen);
		expect(screen.name).toBe('check-results');
	});

	it('pops immediately when no report is provided', async () => {
		const screen = new CheckResultsScreen(mockContext);
		const result = await screen.render({});
		expect(result).toEqual({ action: 'pop' });
	});

	describe('with issues', () => {
		it('mounts the app shell to the renderer root', async () => {
			const screen = new CheckResultsScreen(mockContext);
			screen.render({ report: reportWithIssues, hasIssues: true, duration: 42 });

			await new Promise((resolve) => setTimeout(resolve, 10));

			// One call for the screen shell, one for the auto-mounted help overlay (TR.C1),
			// one for the auto-mounted confirm overlay (TR.C2).
			expect(mockContext.renderer.root.add).toHaveBeenCalledTimes(3);
			const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
			expect(shellRoot.constructor.name).toBe('BoxRenderable');

			screen.cleanup();
		});

		it('shows a breadcrumb for Cross-Submission Check', async () => {
			const screen = new CheckResultsScreen(mockContext);
			screen.render({ report: reportWithIssues, hasIssues: true });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
			const header = shellRoot.getChildren()[0];
			expect(header.content.chunks[0].text).toContain('Cross-Submission Check');

			screen.cleanup();
		});

		it('renders a footer keybar containing "Switch Pane"', async () => {
			const screen = new CheckResultsScreen(mockContext);
			screen.render({ report: reportWithIssues, hasIssues: true });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
			const children = shellRoot.getChildren();
			const footer = children[children.length - 1];
			expect(footer.constructor.name).toBe('TextRenderable');
			expect(footer.content.chunks[0].text).toContain('Switch Pane');

			screen.cleanup();
		});

		it('wraps the issue list and detail view in titled panels', async () => {
			const screen = new CheckResultsScreen(mockContext);
			screen.render({ report: reportWithIssues, hasIssues: true });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const issuesPanel = (screen as any).issuesPanel;
			const detailPanel = (screen as any).detailPanel;
			expect(issuesPanel.box.title).toBe('Issues');
			expect(detailPanel.box.title).toBe('Detail');

			screen.cleanup();
		});

		it('updates the detail panel when a different issue is selected', async () => {
			const screen = new CheckResultsScreen(mockContext);
			screen.render({ report: reportWithIssues, hasIssues: true });

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
			expect(rendered).toContain('Schema version changed');

			screen.cleanup();
		});

		it('flips the focused panel border when Tab is pressed', async () => {
			const screen = new CheckResultsScreen(mockContext);
			screen.render({ report: reportWithIssues, hasIssues: true });

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

			screen.cleanup();
		});

		it('resolves to the dashboard on ESC/q via the keymap', async () => {
			const screen = new CheckResultsScreen(mockContext);
			const resultPromise = screen.render({ report: reportWithIssues, hasIssues: true });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
			handler({ name: 'escape' });

			const result = await resultPromise;
			expect(result).toEqual({ action: 'replace', screen: 'dashboard' });

			screen.cleanup();
		});
	});

	describe('without issues', () => {
		it('does not build issue/detail panels', async () => {
			const screen = new CheckResultsScreen(mockContext);
			screen.render({ report: reportWithoutIssues, hasIssues: false });

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect((screen as any).issuesPanel).toBeUndefined();
			expect((screen as any).detailPanel).toBeUndefined();

			screen.cleanup();
		});

		it('resolves to the dashboard on ESC/q via the keymap', async () => {
			const screen = new CheckResultsScreen(mockContext);
			const resultPromise = screen.render({ report: reportWithoutIssues, hasIssues: false });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
			handler({ name: 'q' });

			const result = await resultPromise;
			expect(result).toEqual({ action: 'replace', screen: 'dashboard' });

			screen.cleanup();
		});
	});

	it('cleanup detaches the keymap and removes the shell from the renderer root', async () => {
		const screen = new CheckResultsScreen(mockContext);
		screen.render({ report: reportWithIssues, hasIssues: true });

		await new Promise((resolve) => setTimeout(resolve, 10));

		screen.cleanup();

		expect(mockContext.renderer.keyInput.off).toHaveBeenCalledWith('keypress', expect.any(Function));
		// One removal for the screen shell, one for the help overlay (TR.C1),
		// one for the confirm overlay (TR.C2).
		expect(mockContext.renderer.root.remove).toHaveBeenCalledTimes(3);
	});
});

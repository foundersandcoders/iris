import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SuccessScreen } from '../../../src/tui/screens/success';
import * as tuiFixtures from '../../fixtures/tui/tui';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

describe('SuccessScreen', () => {
	let mockContext: ReturnType<typeof tuiFixtures.createMockContext>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = tuiFixtures.createMockContext();
	});

	it('can be instantiated', () => {
		const screen = new SuccessScreen(mockContext);
		expect(screen).toBeInstanceOf(SuccessScreen);
		expect(screen.name).toBe('success');
	});

	describe('success mode', () => {
		it('mounts the app shell to the renderer root', async () => {
			const screen = new SuccessScreen(mockContext);
			screen.render({ type: 'convert', duration: 100, outputPath: '/out.xml', learnerCount: 5 });

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mockContext.renderer.root.add).toHaveBeenCalledTimes(1);
			const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
			expect(shellRoot.constructor.name).toBe('BoxRenderable');

			screen.cleanup();
		});

		it('shows a breadcrumb matching the success title in the header', async () => {
			const screen = new SuccessScreen(mockContext);
			screen.render({ type: 'convert', duration: 100 });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
			const header = shellRoot.getChildren()[0];
			expect(header.content.chunks[0].text).toContain('Conversion Complete');

			screen.cleanup();
		});

		it('renders a footer keybar containing "Confirm" driven by the keymap', async () => {
			const screen = new SuccessScreen(mockContext);
			screen.render({ type: 'convert', duration: 100 });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
			const children = shellRoot.getChildren();
			const footer = children[children.length - 1];
			expect(footer.constructor.name).toBe('TextRenderable');
			expect(footer.content.chunks[0].text).toContain('Confirm');

			screen.cleanup();
		});

		it('wraps the result in a titled panel', async () => {
			const screen = new SuccessScreen(mockContext);
			screen.render({ type: 'convert', duration: 100 });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const resultPanel = (screen as any).resultPanel;
			expect(resultPanel).toBeDefined();
			expect(resultPanel.box.title).toBe('Result');

			screen.cleanup();
		});

		it('resolves to the dashboard when "Return to Dashboard" is selected', async () => {
			const screen = new SuccessScreen(mockContext);
			const resultPromise = screen.render({ type: 'convert', duration: 100 });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const menu = (screen as any).menu;
			const handler = (menu.on as any).mock.calls.find(
				(call: any[]) => call[0] === 'itemSelected'
			)[1];
			handler(0, { value: 'dashboard' });

			const result = await resultPromise;
			expect(result).toEqual({ action: 'replace', screen: 'dashboard' });

			screen.cleanup();
		});

		it('does not offer "View Issues" when there are no issues', async () => {
			const screen = new SuccessScreen(mockContext);
			screen.render({ type: 'convert', duration: 100, hasIssues: false });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const menu = (screen as any).menu;
			expect(menu.options).toHaveLength(1);

			screen.cleanup();
		});

		it('offers "View Issues" and routes to validation-explorer when issues exist on a convert result', async () => {
			const validation = { valid: false, errorCount: 1, warningCount: 0, issues: [] };
			const screen = new SuccessScreen(mockContext);
			const resultPromise = screen.render({
				type: 'convert',
				duration: 100,
				hasIssues: true,
				validation,
			});

			await new Promise((resolve) => setTimeout(resolve, 10));

			const menu = (screen as any).menu;
			expect(menu.options).toHaveLength(2);
			expect(menu.options[1].value).toBe('view-issues');

			const handler = (menu.on as any).mock.calls.find(
				(call: any[]) => call[0] === 'itemSelected'
			)[1];
			handler(1, { value: 'view-issues' });

			const result = await resultPromise;
			expect(result).toEqual({
				action: 'replace',
				screen: 'validation-explorer',
				data: { validation, sourceType: 'csv' },
			});

			screen.cleanup();
		});
	});

	describe('failure mode', () => {
		it('shows a breadcrumb matching the failure title in the header', async () => {
			const screen = new SuccessScreen(mockContext);
			screen.render({ type: 'validate', failed: true, error: new Error('boom') });

			await new Promise((resolve) => setTimeout(resolve, 10));

			const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
			const header = shellRoot.getChildren()[0];
			expect(header.content.chunks[0].text).toContain('Validation Failed');

			screen.cleanup();
		});

		it('attaches the keymap and resolves to the dashboard on Enter', async () => {
			const screen = new SuccessScreen(mockContext);
			const resultPromise = screen.render({
				type: 'validate',
				failed: true,
				error: new Error('boom'),
			});

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mockContext.renderer.keyInput.on).toHaveBeenCalledWith('keypress', expect.any(Function));

			const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
			const children = shellRoot.getChildren();
			const footer = children[children.length - 1];
			expect(footer.content.chunks[0].text).toContain('Continue');

			const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
			handler({ name: 'enter' });

			const result = await resultPromise;
			expect(result).toEqual({ action: 'replace', screen: 'dashboard' });

			screen.cleanup();
		});
	});

	it('cleanup detaches the keymap and removes the shell from the renderer root', async () => {
		const screen = new SuccessScreen(mockContext);
		screen.render({ type: 'validate', failed: true, error: new Error('boom') });

		await new Promise((resolve) => setTimeout(resolve, 10));

		screen.cleanup();

		expect(mockContext.renderer.keyInput.off).toHaveBeenCalledWith('keypress', expect.any(Function));
		expect(mockContext.renderer.root.remove).toHaveBeenCalledTimes(1);
	});
});

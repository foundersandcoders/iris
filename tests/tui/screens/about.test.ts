import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AboutScreen } from '../../../src/tui/screens/about';
import * as tuiFixtures from '../../fixtures/tui/tui';
import packageJson from '../../../package.json';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

describe('AboutScreen', () => {
	let mockContext: ReturnType<typeof tuiFixtures.createMockContext>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = tuiFixtures.createMockContext();
	});

	it('can be instantiated', () => {
		const screen = new AboutScreen(mockContext);
		expect(screen).toBeInstanceOf(AboutScreen);
		expect(screen.name).toBe('about');
	});

	it('mounts the app shell to the renderer root', async () => {
		const screen = new AboutScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 10));

		// One call for the screen shell, one for the auto-mounted help overlay (TR.C1).
		expect(mockContext.renderer.root.add).toHaveBeenCalledTimes(2);
		const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
		expect(shellRoot.constructor.name).toBe('BoxRenderable');

		screen.cleanup();
	});

	it('shows an "About" breadcrumb in the header', async () => {
		const screen = new AboutScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 10));

		const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
		const header = shellRoot.getChildren()[0];
		expect(header.content.chunks[0].text).toContain('About');

		screen.cleanup();
	});

	it('renders a footer keybar with Back and Quit driven by the keymap', async () => {
		const screen = new AboutScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 10));

		const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
		const children = shellRoot.getChildren();
		const footer = children[children.length - 1];
		expect(footer.constructor.name).toBe('TextRenderable');
		expect(footer.content.chunks[0].text).toContain('Back');
		expect(footer.content.chunks[0].text).toContain('Quit');

		screen.cleanup();
	});

	it('wraps the info in a panel titled "About Iris"', async () => {
		const screen = new AboutScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 10));

		const infoPanel = (screen as any).infoPanel;
		expect(infoPanel).toBeDefined();
		expect(infoPanel.box.title).toBe('About Iris');

		screen.cleanup();
	});

	it('shows the package version in a labelled field row', async () => {
		const screen = new AboutScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 10));

		const infoPanel = (screen as any).infoPanel;
		const rows = infoPanel.box.getChildren().map((child: any) => child.content.chunks[0].text);
		expect(rows.some((text: string) => text.includes('Version') && text.includes(packageJson.version))).toBe(
			true
		);

		screen.cleanup();
	});

	it('resolves with a pop action on escape', async () => {
		const screen = new AboutScreen(mockContext);
		const resultPromise = screen.render();

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(mockContext.renderer.keyInput.on).toHaveBeenCalledWith('keypress', expect.any(Function));
		const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
		handler({ name: 'escape' });

		const result = await resultPromise;
		expect(result).toEqual({ action: 'pop' });

		screen.cleanup();
	});

	it('resolves with a pop action on q', async () => {
		const screen = new AboutScreen(mockContext);
		const resultPromise = screen.render();

		await new Promise((resolve) => setTimeout(resolve, 10));

		const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
		handler({ name: 'q' });

		const result = await resultPromise;
		expect(result).toEqual({ action: 'pop' });

		screen.cleanup();
	});

	it('cleanup detaches the keymap and removes the shell from the renderer root', async () => {
		const screen = new AboutScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 10));

		screen.cleanup();

		expect(mockContext.renderer.keyInput.off).toHaveBeenCalledWith('keypress', expect.any(Function));
		// One removal for the screen shell, one for the help overlay (TR.C1).
		expect(mockContext.renderer.root.remove).toHaveBeenCalledTimes(2);
	});
});

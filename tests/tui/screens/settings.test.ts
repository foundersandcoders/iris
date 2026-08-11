/** ====== Settings Screen Tests ====== */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SettingsScreen } from '../../../src/tui/screens/settings';
import * as fixtures from '../../fixtures/tui/tui';
import { applyTheme, activeTheme } from '../../../assets/brand/theme';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

const VALID_CONFIG = {
	configVersion: 1,
	provider: { ukprn: 10000000, name: 'Founders and Coders' },
	submission: { softwareSupplier: 'Founders and Coders', softwarePackage: 'Iris' },
	activeSchema: 'schemafile25.xsd',
	activeMapping: 'fac-airtable-2025',
	collection: 'ILR',
	serialNo: '01',
};

let loadConfigMock = vi.fn();
let saveConfigMock = vi.fn();
let listSchemasMock = vi.fn();
let listMappingsMock = vi.fn();

// Mock createStorage: include ALL methods to avoid leaking incomplete mocks
vi.mock('../../../src/lib/storage', () => ({
	createStorage: () => ({
		init: vi.fn().mockResolvedValue({ success: true, data: undefined }),
		loadConfig: loadConfigMock,
		saveConfig: saveConfigMock,
		loadMapping: vi.fn().mockResolvedValue({ success: false, error: { message: 'not found' } }),
		saveMapping: vi.fn().mockResolvedValue({ success: true, data: undefined }),
		deleteMapping: vi.fn().mockResolvedValue({ success: true, data: undefined }),
		listMappings: listMappingsMock,
		loadSchema: vi.fn().mockResolvedValue({ success: false, error: { message: 'not found' } }),
		listSchemas: listSchemasMock,
		saveSubmission: vi.fn().mockResolvedValue({ success: true, data: '/tmp/test.xml' }),
		listSubmissions: vi.fn().mockResolvedValue({ success: true, data: [] }),
		loadHistory: vi.fn().mockResolvedValue({ success: true, data: { formatVersion: 1, submissions: [] } }),
		appendHistory: vi.fn().mockResolvedValue({ success: true, data: undefined }),
	}),
}));

describe('SettingsScreen', () => {
	let mockContext: ReturnType<typeof fixtures.createMockContext>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = fixtures.createMockContext();
		loadConfigMock = vi.fn().mockResolvedValue({ success: true, data: { ...VALID_CONFIG } });
		saveConfigMock = vi.fn().mockResolvedValue({ success: true, data: undefined });
		listSchemasMock = vi.fn().mockResolvedValue({ success: true, data: ['schemafile25.xsd'] });
		listMappingsMock = vi.fn().mockResolvedValue({ success: true, data: ['fac-airtable-2025'] });
	});

	afterEach(() => {
		// applyTheme mutates shared module state; reset so a switch in one
		// test can't leak into the next.
		applyTheme('light');
	});

	it('can be instantiated with a render context', () => {
		const screen = new SettingsScreen(mockContext);
		expect(screen).toBeInstanceOf(SettingsScreen);
		expect(screen.name).toBe('settings');
	});

	it('has a render method that returns a Promise', () => {
		const screen = new SettingsScreen(mockContext);
		const result = screen.render();
		expect(result).toBeInstanceOf(Promise);
	});

	it('mounts the app shell to the renderer root', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		// One call for the screen shell, one for the auto-mounted help overlay (TR.C1),
		// one for the auto-mounted confirm overlay (TR.C2), one for the
		// auto-mounted command palette overlay (TR.D1).
		expect(mockContext.renderer.root.add).toHaveBeenCalledTimes(4);
		const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
		expect(shellRoot.constructor.name).toBe('BoxRenderable');
	});

	it('shows a "Settings" breadcrumb in the header', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
		const header = shellRoot.getChildren()[0];
		expect(header.content.chunks[0].text).toContain('Settings');
	});

	it('renders a footer keybar with Save, Reset All, and Back', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
		const children = shellRoot.getChildren();
		const footer = children[children.length - 1];
		expect(footer.constructor.name).toBe('TextRenderable');
		expect(footer.content.chunks[0].text).toContain('Save');
		expect(footer.content.chunks[0].text).toContain('Reset All');
		expect(footer.content.chunks[0].text).toContain('Back');
	});

	it('wraps the field list in a panel titled "Settings"', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const fieldPanel = (screen as any).fieldPanel;
		expect(fieldPanel).toBeDefined();
		expect(fieldPanel.box.title).toBe('Settings');
	});

	it('shows the UKPRN value in a field row', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const fieldList = (screen as any).fieldList;
		const rowText = fieldList.options.map((o: any) => o.name).join('\n');
		expect(rowText).toContain('UKPRN');
		expect(rowText).toContain(String(VALID_CONFIG.provider.ukprn));
	});

	it('registers keypress handler via the keymap', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(mockContext.renderer.keyInput.on).toHaveBeenCalledWith('keypress', expect.any(Function));
	});

	it('resolves with a pop action on escape', async () => {
		const screen = new SettingsScreen(mockContext);
		const resultPromise = screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
		handler({ name: 'escape' });

		const result = await resultPromise;
		expect(result).toEqual({ action: 'pop' });
	});

	it('resolves with a pop action on q', async () => {
		const screen = new SettingsScreen(mockContext);
		const resultPromise = screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
		handler({ name: 'q' });

		const result = await resultPromise;
		expect(result).toEqual({ action: 'pop' });
	});

	it('pushes the file-picker when Enter is pressed on a directory field', async () => {
		const screen = new SettingsScreen(mockContext);
		const resultPromise = screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const fieldList = (screen as any).fieldList;
		const listIndex = fieldList.options.findIndex((o: any) => o.value === 'outputDir');
		const itemSelectedHandler = (fieldList.on as any).mock.calls.find(
			(call: any[]) => call[0] === 'itemSelected'
		)[1];
		itemSelectedHandler(listIndex);

		const result = await resultPromise;
		expect(result).toMatchObject({
			action: 'push',
			screen: 'file-picker',
			data: expect.objectContaining({ fieldKey: 'outputDir' }),
		});
	});

	it('lists Reduce Motion under an Interface section', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const fieldList = (screen as any).fieldList;
		const rowText = fieldList.options.map((o: any) => o.name).join('\n');
		expect(rowText).toContain('Interface');
		expect(rowText).toContain('Reduce Motion');
	});

	it('toggles Reduce Motion in place on Enter, without an editor renderable', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const fieldList = (screen as any).fieldList;
		const listIndex = fieldList.options.findIndex((o: any) => o.value === 'reduceMotion');
		const itemSelectedHandler = (fieldList.on as any).mock.calls.find(
			(call: any[]) => call[0] === 'itemSelected'
		)[1];

		expect((screen as any).config.reduceMotion).toBeFalsy();
		itemSelectedHandler(listIndex);

		expect((screen as any).config.reduceMotion).toBe(true);
		expect((screen as any).editInput).toBeUndefined();
		expect((screen as any).editDropdown).toBeUndefined();
		expect((screen as any).editing).toBe(false); // toggled and finished immediately
	});

	it('toggling Reduce Motion updates the displayed value', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const fieldList = (screen as any).fieldList;
		const listIndex = fieldList.options.findIndex((o: any) => o.value === 'reduceMotion');
		const itemSelectedHandler = (fieldList.on as any).mock.calls.find(
			(call: any[]) => call[0] === 'itemSelected'
		)[1];

		itemSelectedHandler(listIndex);

		const rowText = fieldList.options.map((o: any) => o.name).join('\n');
		expect(rowText).toContain('On');
	});

	it('persists reduceMotion through saveConfig', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const fieldList = (screen as any).fieldList;
		const listIndex = fieldList.options.findIndex((o: any) => o.value === 'reduceMotion');
		const itemSelectedHandler = (fieldList.on as any).mock.calls.find(
			(call: any[]) => call[0] === 'itemSelected'
		)[1];
		itemSelectedHandler(listIndex);

		const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
		handler({ name: 's' });

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(saveConfigMock).toHaveBeenCalledWith(expect.objectContaining({ reduceMotion: true }));

		screen.cleanup();
	});

	it('lists Theme under the Interface section', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const fieldList = (screen as any).fieldList;
		const rowText = fieldList.options.map((o: any) => o.name).join('\n');
		expect(rowText).toContain('Theme');
	});

	it('toggles Theme in place on Enter, without an editor renderable', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const fieldList = (screen as any).fieldList;
		const listIndex = fieldList.options.findIndex((o: any) => o.value === 'theme');
		const itemSelectedHandler = (fieldList.on as any).mock.calls.find(
			(call: any[]) => call[0] === 'itemSelected'
		)[1];

		expect((screen as any).config.theme).not.toBe('dark');
		itemSelectedHandler(listIndex);

		expect((screen as any).config.theme).toBe('dark');
		expect((screen as any).editInput).toBeUndefined();
		expect((screen as any).editDropdown).toBeUndefined();
		expect((screen as any).editing).toBe(false);
	});

	it('toggling Theme updates the displayed value', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const fieldList = (screen as any).fieldList;
		const listIndex = fieldList.options.findIndex((o: any) => o.value === 'theme');
		const itemSelectedHandler = (fieldList.on as any).mock.calls.find(
			(call: any[]) => call[0] === 'itemSelected'
		)[1];

		itemSelectedHandler(listIndex);

		const rowText = fieldList.options.map((o: any) => o.name).join('\n');
		expect(rowText).toContain('Dark');
	});

	it('persists theme through saveConfig', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const fieldList = (screen as any).fieldList;
		const listIndex = fieldList.options.findIndex((o: any) => o.value === 'theme');
		const itemSelectedHandler = (fieldList.on as any).mock.calls.find(
			(call: any[]) => call[0] === 'itemSelected'
		)[1];
		itemSelectedHandler(listIndex);

		const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
		handler({ name: 's' });

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(saveConfigMock).toHaveBeenCalledWith(expect.objectContaining({ theme: 'dark' }));

		screen.cleanup();
	});

	it('applies the new theme and rebuilds the screen when the theme changed on save', async () => {
		const screen = new SettingsScreen(mockContext);
		const resultPromise = screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const fieldList = (screen as any).fieldList;
		const listIndex = fieldList.options.findIndex((o: any) => o.value === 'theme');
		const itemSelectedHandler = (fieldList.on as any).mock.calls.find(
			(call: any[]) => call[0] === 'itemSelected'
		)[1];
		itemSelectedHandler(listIndex);

		const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
		handler({ name: 's' });

		const result = await resultPromise;

		expect(activeTheme()).toBe('dark');
		expect(mockContext.renderer.setBackgroundColor).toHaveBeenCalled();
		expect(result).toEqual({ action: 'replace', screen: 'settings' });
	});

	it('does not rebuild the screen when the theme was not changed on save', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
		handler({ name: 's' });

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(mockContext.renderer.setBackgroundColor).not.toHaveBeenCalled();

		screen.cleanup();
	});

	it('saves the config via storage when the Save binding fires on a valid config', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
		handler({ name: 's' });

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(saveConfigMock).toHaveBeenCalledTimes(1);

		screen.cleanup();
	});

	it('does not open the palette while inline-editing a field', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const fieldList = (screen as any).fieldList;
		const listIndex = fieldList.options.findIndex((o: any) => o.value === 'provider.ukprn');
		const itemSelectedHandler = (fieldList.on as any).mock.calls.find(
			(call: any[]) => call[0] === 'itemSelected'
		)[1];
		itemSelectedHandler(listIndex);

		expect((screen as any).editing).toBe(true);

		const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
		handler({ name: 'p', ctrl: true });

		expect((screen as any).keymap.paletteOpen).toBe(false);

		screen.cleanup();
	});

	describe('inline edit key handling (Keymap textInputActive guard)', () => {
		function startTextEdit(screen: any) {
			const fieldList = screen.fieldList;
			const listIndex = fieldList.options.findIndex((o: any) => o.value === 'provider.ukprn');
			const itemSelectedHandler = (fieldList.on as any).mock.calls.find(
				(call: any[]) => call[0] === 'itemSelected'
			)[1];
			itemSelectedHandler(listIndex);
		}

		it('"?" typed into an inline field editor does not open the help overlay', async () => {
			const screen = new SettingsScreen(mockContext);
			screen.render();
			await new Promise((resolve) => setTimeout(resolve, 50));

			startTextEdit(screen);
			expect((screen as any).editing).toBe(true);
			const editInput = (screen as any).editInput;

			const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
			const result = handler({ name: '?', sequence: '?' });
			expect(result).toBeNull();
			editInput.pressKey({ sequence: '?' });

			expect((screen as any).keymap.helpOpen).toBe(false);

			screen.cleanup();
		});

		it('Escape still cancels an inline edit', async () => {
			const screen = new SettingsScreen(mockContext);
			screen.render();
			await new Promise((resolve) => setTimeout(resolve, 50));

			startTextEdit(screen);
			expect((screen as any).editing).toBe(true);

			const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
			handler({ name: 'escape' });

			expect((screen as any).editing).toBe(false);

			screen.cleanup();
		});
	});

	it('applies the new theme before firing the success toast, so the toast paints in the new theme', async () => {
		const toasts = fixtures.createMockToasts();
		const ctx = fixtures.createMockContext(mockContext.renderer, toasts);
		let themeAtToastTime: string | undefined;
		(toasts.success as any).mockImplementation(() => {
			themeAtToastTime = activeTheme();
		});

		const screen = new SettingsScreen(ctx);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const fieldList = (screen as any).fieldList;
		const listIndex = fieldList.options.findIndex((o: any) => o.value === 'theme');
		const itemSelectedHandler = (fieldList.on as any).mock.calls.find(
			(call: any[]) => call[0] === 'itemSelected'
		)[1];
		itemSelectedHandler(listIndex);

		const handler = (ctx.renderer.keyInput.on as any).mock.calls[0][1];
		handler({ name: 's' });

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(themeAtToastTime).toBe('dark');

		screen.cleanup();
	});

	it('fires an error toast and leaves the config unsaved when storage.saveConfig fails', async () => {
		saveConfigMock = vi.fn().mockResolvedValue({ success: false, error: { message: 'disk full' } });
		const toasts = fixtures.createMockToasts();
		const ctx = fixtures.createMockContext(mockContext.renderer, toasts);
		const screen = new SettingsScreen(ctx);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const handler = (ctx.renderer.keyInput.on as any).mock.calls[0][1];
		handler({ name: 's' });

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(toasts.error).toHaveBeenCalledWith('Failed to save settings');
		expect(toasts.success).not.toHaveBeenCalled();

		screen.cleanup();
	});

	it('catches a rejected save and reports it as an error toast', async () => {
		saveConfigMock = vi.fn().mockRejectedValue(new Error('permission denied'));
		const toasts = fixtures.createMockToasts();
		const ctx = fixtures.createMockContext(mockContext.renderer, toasts);
		const screen = new SettingsScreen(ctx);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const handler = (ctx.renderer.keyInput.on as any).mock.calls[0][1];
		handler({ name: 's' });

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(toasts.error).toHaveBeenCalledWith('Save failed: permission denied');

		screen.cleanup();
	});

	it('fires a success toast on save, without scheduling a footer timeout', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		const toasts = fixtures.createMockToasts();
		const ctx = fixtures.createMockContext(mockContext.renderer, toasts);
		const screen = new SettingsScreen(ctx);
		screen.render();

		await vi.advanceTimersByTimeAsync(50);

		const handler = (ctx.renderer.keyInput.on as any).mock.calls[0][1];
		handler({ name: 's' });

		await vi.advanceTimersByTimeAsync(10);

		expect(toasts.success).toHaveBeenCalledWith('Settings saved');
		expect(vi.getTimerCount()).toBe(0);

		screen.cleanup();
		vi.useRealTimers();
	});

	it('cleanup detaches the keymap and removes the shell from the renderer root', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		screen.cleanup();

		expect(mockContext.renderer.root.remove).toHaveBeenCalledWith('settings-root');
		expect(mockContext.renderer.keyInput.off).toHaveBeenCalledWith('keypress', expect.any(Function));
	});
});

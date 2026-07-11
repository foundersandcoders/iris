/** ====== Settings Screen Tests ====== */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsScreen } from '../../../src/tui/screens/settings';
import * as fixtures from '../../fixtures/tui/tui';

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

// Mock createStorage — include ALL methods to avoid leaking incomplete mocks
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
		// one for the auto-mounted confirm overlay (TR.C2).
		expect(mockContext.renderer.root.add).toHaveBeenCalledTimes(3);
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

	it('cleanup detaches the keymap and removes the shell from the renderer root', async () => {
		const screen = new SettingsScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		screen.cleanup();

		expect(mockContext.renderer.root.remove).toHaveBeenCalledWith('settings-root');
		expect(mockContext.renderer.keyInput.off).toHaveBeenCalledWith('keypress', expect.any(Function));
	});
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowScreen } from '../../../src/tui/screens/workflow';
import * as tuiFixtures from '../../fixtures/tui/tui';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double. opentui-spinner is inlined in
// vite.config.ts, so its internal `@opentui/core` import resolves to this
// mock too.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

const loadSchemaMock = vi.fn();
vi.mock('../../../src/lib/storage', () => ({
	createStorage: () => ({
		loadSchema: loadSchemaMock,
	}),
}));

vi.mock('../../../src/lib/schema/registryBuilder', () => ({
	buildSchemaRegistry: vi.fn().mockReturnValue({}),
}));

// Stub generators — each yields nothing and resolves immediately with a
// minimal but shape-correct result, so tests exercise shell/panel/keymap
// wiring without touching the real CSV/XML pipeline or throwing inside
// routeToResultScreen()'s per-type data access.
const validResult = { valid: true, errorCount: 0, warningCount: 0, issues: [] };

async function* convertGenerator() {
	return {
		success: true,
		steps: [],
		duration: 1,
		data: { xml: '', outputPath: 'out.xml', csvData: { rows: [] }, validation: validResult },
	};
}
async function* validateGenerator() {
	return {
		success: true,
		steps: [],
		duration: 1,
		data: { validation: validResult, sourceData: { rows: [] } },
	};
}
async function* checkGenerator() {
	return {
		success: true,
		steps: [],
		duration: 1,
		data: { report: {}, hasIssues: false },
	};
}

vi.mock('../../../src/lib/workflows/csvConvert', () => ({
	convertWorkflow: vi.fn(() => convertGenerator()),
}));
vi.mock('../../../src/lib/workflows/csvValidate', () => ({
	validateWorkflow: vi.fn(() => validateGenerator()),
}));
vi.mock('../../../src/lib/workflows/xmlValidate', () => ({
	xmlValidateWorkflow: vi.fn(() => validateGenerator()),
}));
vi.mock('../../../src/lib/workflows/crossCheck', () => ({
	checkWorkflow: vi.fn(() => checkGenerator()),
}));

describe('WorkflowScreen', () => {
	let mockContext: ReturnType<typeof tuiFixtures.createMockContext>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = tuiFixtures.createMockContext();
		loadSchemaMock.mockResolvedValue({ success: true, data: '<xsd />' });
	});

	it('can be instantiated', () => {
		const screen = new WorkflowScreen(mockContext);
		expect(screen).toBeInstanceOf(WorkflowScreen);
		expect(screen.name).toBe('workflow');
	});

	it('pops immediately when no filePath is provided', async () => {
		const screen = new WorkflowScreen(mockContext);
		const result = await screen.render({});
		expect(result).toEqual({ action: 'pop' });
	});

	it('mounts the app shell to the renderer root', async () => {
		const screen = new WorkflowScreen(mockContext);
		await screen.render({ filePath: 'data.csv', workflowType: 'convert' });

		// The success path runs straight through to routeToResultScreen() without
		// ever constructing a Keymap (that only happens in waitForKeyThenReplace()
		// on failure), so no help overlay is mounted here — just the screen shell.
		expect(mockContext.renderer.root.add).toHaveBeenCalledTimes(1);
		const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
		expect(shellRoot.constructor.name).toBe('BoxRenderable');

		screen.cleanup();
	});

	it('wraps the step list in a titled panel matching the workflow title', async () => {
		const screen = new WorkflowScreen(mockContext);
		await screen.render({ filePath: 'data.csv', workflowType: 'convert' });

		const stepsPanel = (screen as any).stepsPanel;
		expect(stepsPanel).toBeDefined();
		expect(stepsPanel.box.title).toBe('Converting');

		screen.cleanup();
	});

	it('sets the footer to "Processing..." while the workflow runs', async () => {
		const screen = new WorkflowScreen(mockContext);
		await screen.render({ filePath: 'data.csv', workflowType: 'validate' });

		const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
		const children = shellRoot.getChildren();
		const footer = children[children.length - 1];
		expect(footer.constructor.name).toBe('TextRenderable');
		expect(footer.content.chunks[0].text).toBe('Processing...');

		screen.cleanup();
	});

	it('shows a breadcrumb matching the workflow title in the header', async () => {
		const screen = new WorkflowScreen(mockContext);
		await screen.render({ filePath: 'data.xml', workflowType: 'check' });

		const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
		const header = shellRoot.getChildren()[0];
		expect(header.content.chunks[0].text).toContain('Checking');

		screen.cleanup();
	});

	it('routes to the dashboard via the keymap when the schema fails to load', async () => {
		loadSchemaMock.mockResolvedValue({
			success: false,
			error: { message: 'schema missing' },
		});

		const screen = new WorkflowScreen(mockContext);
		const resultPromise = screen.render({ filePath: 'data.csv', workflowType: 'convert' });

		// Let the schema-load rejection path build the UI and attach the keymap.
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(mockContext.renderer.keyInput.on).toHaveBeenCalledWith('keypress', expect.any(Function));

		const shellRoot = (mockContext.renderer.root.add as any).mock.calls[0][0];
		const children = shellRoot.getChildren();
		const footer = children[children.length - 1];
		expect(footer.content.chunks[0].text).toContain('Continue');

		// Simulate the bound key firing (Enter) via the registered handler.
		const handler = (mockContext.renderer.keyInput.on as any).mock.calls[0][1];
		handler({ name: 'enter' });

		const result = await resultPromise;
		expect(result).toEqual({ action: 'replace', screen: 'dashboard' });

		screen.cleanup();
	});

	it('cleanup detaches the keymap and removes the shell from the renderer root', async () => {
		loadSchemaMock.mockResolvedValue({
			success: false,
			error: { message: 'schema missing' },
		});

		const screen = new WorkflowScreen(mockContext);
		screen.render({ filePath: 'data.csv', workflowType: 'convert' }); // don't await — never resolves without a keypress
		await new Promise((resolve) => setTimeout(resolve, 10));

		screen.cleanup();

		expect(mockContext.renderer.keyInput.off).toHaveBeenCalledWith('keypress', expect.any(Function));
		// One removal for the screen shell, one for the help overlay (TR.C1).
		expect(mockContext.renderer.root.remove).toHaveBeenCalledTimes(2);
	});
});

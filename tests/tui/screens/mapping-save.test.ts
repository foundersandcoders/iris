import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MappingSaveScreen } from '../../../src/tui/screens/mapping-save';
import * as fixtures from '../../fixtures/tui/tui';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

// Mock createStorage — include ALL methods to avoid leaking incomplete mocks
vi.mock('../../../src/lib/storage', () => ({
	createStorage: () => ({
		init: vi.fn().mockResolvedValue({ success: true, data: undefined }),
		loadConfig: vi.fn().mockResolvedValue({
			success: true,
			data: {
				configVersion: 1,
				provider: { ukprn: 10000000, name: 'Test' },
				submission: {},
				activeSchema: 'schemafile25.xsd',
				activeMapping: 'fac-airtable-2025',
			},
		}),
		saveConfig: vi.fn().mockResolvedValue({ success: true, data: undefined }),
		loadMapping: vi.fn().mockResolvedValue({ success: false, error: { message: 'not found' } }),
		saveMapping: vi.fn().mockResolvedValue({ success: true, data: undefined }),
		deleteMapping: vi.fn().mockResolvedValue({ success: true, data: undefined }),
		listMappings: vi.fn().mockResolvedValue({
			success: true,
			data: ['fac-airtable-2025', 'existing-mapping'],
		}),
		loadSchema: vi.fn().mockResolvedValue({ success: false, error: { message: 'not found' } }),
		listSchemas: vi.fn().mockResolvedValue({ success: true, data: ['schemafile25.xsd'] }),
		saveSubmission: vi.fn().mockResolvedValue({ success: true, data: '/tmp/test.xml' }),
		listSubmissions: vi.fn().mockResolvedValue({ success: true, data: [] }),
		loadHistory: vi.fn().mockResolvedValue({ success: true, data: { formatVersion: 1, submissions: [] } }),
		appendHistory: vi.fn().mockResolvedValue({ success: true, data: undefined }),
	}),
}));

/** Find the first descendant (recursively) whose content/title matches a predicate. */
function findText(root: any, predicate: (text: string) => boolean): any {
	for (const child of root.getChildren?.() ?? []) {
		const text = child.content?.chunks?.map((c: { text: string }) => c.text).join('') ?? '';
		if (predicate(text)) return child;
		const found = findText(child, predicate);
		if (found) return found;
	}
	return null;
}

function findPanel(root: any, title: string): any {
	for (const child of root.getChildren?.() ?? []) {
		if (child.title === title) return child;
		const found = findPanel(child, title);
		if (found) return found;
	}
	return null;
}

describe('MappingSaveScreen', () => {
	let mockContext: ReturnType<typeof fixtures.createMockContext>;

	const sampleMapping = {
		id: 'test-mapping',
		name: 'Test Mapping',
		mappingVersion: '1.0.0',
		targetSchema: { namespace: 'ESFA/ILR/2025-26', version: '1.0' },
		mappings: [{ csvColumn: 'ULN', xsdPath: 'Message.Learner.ULN' }],
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = fixtures.createMockContext();
	});

	it('can be instantiated with a render context', () => {
		const screen = new MappingSaveScreen(mockContext);
		expect(screen).toBeInstanceOf(MappingSaveScreen);
		expect(screen.name).toBe('mapping-save');
	});

	it('pops with saved:false when no mapping data provided', async () => {
		const screen = new MappingSaveScreen(mockContext);
		const result = await screen.render();
		expect(result).toEqual({ action: 'pop', data: { saved: false } });
	});

	it('adds renderable tree to renderer root when mapping provided', async () => {
		const screen = new MappingSaveScreen(mockContext);
		screen.render({ mapping: sampleMapping });

		await new Promise((resolve) => setTimeout(resolve, 50));

		// One call for the screen shell, one for the auto-mounted help overlay (TR.C1),
		// one for the auto-mounted confirm overlay (TR.C2).
		expect(mockContext.renderer.root.add).toHaveBeenCalledTimes(3);
		const addedRenderable = (mockContext.renderer.root.add as any).mock.calls[0][0];
		expect(addedRenderable).toBeDefined();
		expect(addedRenderable.constructor.name).toBe('BoxRenderable');
	});

	it('registers keypress handler on renderer', async () => {
		const screen = new MappingSaveScreen(mockContext);
		screen.render({ mapping: sampleMapping });

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(mockContext.renderer.keyInput.on).toHaveBeenCalledWith(
			'keypress',
			expect.any(Function)
		);
	});

	it('cleanup removes keypress handler and container', async () => {
		const screen = new MappingSaveScreen(mockContext);
		screen.render({ mapping: sampleMapping });

		await new Promise((resolve) => setTimeout(resolve, 50));

		screen.cleanup();

		expect(mockContext.renderer.keyInput.off).toHaveBeenCalledWith(
			'keypress',
			expect.any(Function)
		);
		expect(mockContext.renderer.root.remove).toHaveBeenCalledWith('mapping-save-root');
	});

	it('renders a footer keybar with the Tab/Confirm/Back bindings', async () => {
		const screen = new MappingSaveScreen(mockContext);
		screen.render({ mapping: sampleMapping });

		await new Promise((resolve) => setTimeout(resolve, 50));

		const root = (mockContext.renderer.root.add as any).mock.calls[0][0];
		const footer = findText(root, (t) => t.includes('Next Field'));
		expect(footer).toBeDefined();
		const footerText = footer.content.chunks.map((c: { text: string }) => c.text).join('');
		expect(footerText).toContain('Next Field');
		expect(footerText).toContain('Back');
	});

	it('wraps the form in a titled panel', async () => {
		const screen = new MappingSaveScreen(mockContext);
		screen.render({ mapping: sampleMapping });

		await new Promise((resolve) => setTimeout(resolve, 50));

		const root = (mockContext.renderer.root.add as any).mock.calls[0][0];
		const formPanel = findPanel(root, 'Details');
		expect(formPanel).toBeDefined();
	});
});

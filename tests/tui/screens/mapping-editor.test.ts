import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MappingEditorScreen } from '../../../src/tui/screens/mapping-editor';
import * as fixtures from '../../fixtures/tui/tui';

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
		loadMapping: vi.fn().mockResolvedValue({
			success: true,
			data: {
				id: 'test-mapping',
				name: 'Test Mapping',
				mappingVersion: '1.0.0',
				targetSchema: { namespace: 'ESFA/ILR/2025-26', version: '1.0', displayName: 'ILR 2025-26' },
				mappings: [
					{ csvColumn: 'ULN', xsdPath: 'Message.Learner.ULN', transform: 'stringToInt' },
					{ csvColumn: 'Sex', xsdPath: 'Message.Learner.Sex', transform: 'uppercase' },
				],
			},
		}),
		saveMapping: vi.fn().mockResolvedValue({ success: true, data: undefined }),
		deleteMapping: vi.fn().mockResolvedValue({ success: true, data: undefined }),
		listMappings: vi.fn().mockResolvedValue({ success: true, data: ['fac-airtable-2025'] }),
		loadSchema: vi.fn().mockResolvedValue({ success: false, error: { message: 'not found' } }),
		listSchemas: vi.fn().mockResolvedValue({ success: true, data: ['schemafile25.xsd'] }),
		saveSubmission: vi.fn().mockResolvedValue({ success: true, data: '/tmp/test.xml' }),
		listSubmissions: vi.fn().mockResolvedValue({ success: true, data: [] }),
		loadHistory: vi.fn().mockResolvedValue({ success: true, data: { formatVersion: 1, submissions: [] } }),
		appendHistory: vi.fn().mockResolvedValue({ success: true, data: undefined }),
	}),
}));

// Mock buildSchemaRegistry (won't be called since loadSchema fails)
vi.mock('../../../src/lib/schema/registryBuilder', () => ({
	buildSchemaRegistry: vi.fn(),
}));

describe('MappingEditorScreen', () => {
	let mockContext: ReturnType<typeof fixtures.createMockContext>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = fixtures.createMockContext();
	});

	it('can be instantiated with a render context', () => {
		const screen = new MappingEditorScreen(mockContext);
		expect(screen).toBeInstanceOf(MappingEditorScreen);
		expect(screen.name).toBe('mapping-editor');
	});

	it('has a render method that returns a Promise', () => {
		const screen = new MappingEditorScreen(mockContext);
		const result = screen.render({ mode: 'create' });
		expect(result).toBeInstanceOf(Promise);
	});

	it('adds renderable tree to renderer root on render', async () => {
		const screen = new MappingEditorScreen(mockContext);
		screen.render({ mode: 'create' });

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(mockContext.renderer.root.add).toHaveBeenCalledTimes(1);
		const addedRenderable = (mockContext.renderer.root.add as any).mock.calls[0][0];
		expect(addedRenderable).toBeDefined();
		expect(addedRenderable.constructor.name).toBe('BoxRenderable');
	});

	it('loads existing mapping when mode is edit', async () => {
		const screen = new MappingEditorScreen(mockContext);
		screen.render({ mode: 'edit', mappingId: 'test-mapping' });

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(mockContext.renderer.root.add).toHaveBeenCalled();
	});

	it('cleanup removes keypress handler and container', async () => {
		const screen = new MappingEditorScreen(mockContext);
		screen.render({ mode: 'create' });

		await new Promise((resolve) => setTimeout(resolve, 50));

		screen.cleanup();

		expect(mockContext.renderer.keyInput.off).toHaveBeenCalledWith(
			'keypress',
			expect.any(Function)
		);
		expect(mockContext.renderer.root.remove).toHaveBeenCalledWith('mapping-editor-root');
	});
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MappingBuilderScreen } from '../../../src/tui/screens/mapping-builder';
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
		loadMapping: vi.fn().mockImplementation((id: string) => {
			if (id === 'fac-airtable-2025') {
				return Promise.resolve({
					success: true,
					data: {
						id: 'fac-airtable-2025',
						name: 'Founders and Coders Airtable Export (2025-26)',
						mappingVersion: '2.0.0',
						targetSchema: { namespace: 'ESFA/ILR/2025-26', displayName: 'ILR 2025-26' },
						mappings: [{ csvColumn: 'ULN', xsdPath: 'Message.Learner.ULN' }],
					},
				});
			}
			return Promise.resolve({
				success: true,
				data: {
					id: 'my-custom-mapping',
					name: 'My Custom Mapping',
					mappingVersion: '1.0.0',
					targetSchema: { namespace: 'ESFA/ILR/2025-26', displayName: 'ILR 2025-26' },
					mappings: [{ csvColumn: 'Name', xsdPath: 'Message.Learner.FamilyName' }],
				},
			});
		}),
		saveMapping: vi.fn().mockResolvedValue({ success: true, data: undefined }),
		deleteMapping: vi.fn().mockResolvedValue({ success: true, data: undefined }),
		listMappings: vi.fn().mockResolvedValue({
			success: true,
			data: ['fac-airtable-2025', 'my-custom-mapping'],
		}),
		loadSchema: vi.fn().mockResolvedValue({ success: false, error: { message: 'not found' } }),
		listSchemas: vi.fn().mockResolvedValue({ success: true, data: ['schemafile25.xsd'] }),
		saveSubmission: vi.fn().mockResolvedValue({ success: true, data: '/tmp/test.xml' }),
		listSubmissions: vi.fn().mockResolvedValue({ success: true, data: [] }),
		loadHistory: vi.fn().mockResolvedValue({ success: true, data: { formatVersion: 1, submissions: [] } }),
		appendHistory: vi.fn().mockResolvedValue({ success: true, data: undefined }),
	}),
}));

describe('MappingBuilderScreen', () => {
	let mockContext: ReturnType<typeof fixtures.createMockContext>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = fixtures.createMockContext();
	});

	it('can be instantiated with a render context', () => {
		const screen = new MappingBuilderScreen(mockContext);
		expect(screen).toBeInstanceOf(MappingBuilderScreen);
		expect(screen.name).toBe('mapping-builder');
	});

	it('has a render method that returns a Promise', () => {
		const screen = new MappingBuilderScreen(mockContext);
		const result = screen.render();
		expect(result).toBeInstanceOf(Promise);
	});

	it('adds renderable tree to renderer root on render', async () => {
		const screen = new MappingBuilderScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(mockContext.renderer.root.add).toHaveBeenCalledTimes(1);
		const addedRenderable = (mockContext.renderer.root.add as any).mock.calls[0][0];
		expect(addedRenderable).toBeDefined();
		expect(addedRenderable.constructor.name).toBe('BoxRenderable');
	});

	it('registers keypress handler on renderer', async () => {
		const screen = new MappingBuilderScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(mockContext.renderer.keyInput.on).toHaveBeenCalledWith(
			'keypress',
			expect.any(Function)
		);
	});

	it('cleanup removes keypress handler and container', async () => {
		const screen = new MappingBuilderScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		screen.cleanup();

		expect(mockContext.renderer.keyInput.off).toHaveBeenCalledWith(
			'keypress',
			expect.any(Function)
		);
		expect(mockContext.renderer.root.remove).toHaveBeenCalledWith('mapping-builder-root');
	});
});

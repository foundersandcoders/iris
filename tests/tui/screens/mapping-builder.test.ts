import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MappingBuilderScreen } from '../../../src/tui/screens/mapping-builder';
import * as fixtures from '../../fixtures/tui/tui';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

// Hoisted so tests can assert on the same spy instance createStorage() returns
// (the factory below builds a fresh object with fresh vi.fn()s per call).
let deleteMappingMock = vi.fn().mockResolvedValue({ success: true, data: undefined });

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
		deleteMapping: deleteMappingMock,
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

/** Find the first descendant (recursively) whose text content matches a predicate. */
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

		// One call for the screen shell, one for the auto-mounted help overlay (TR.C1),
		// one for the auto-mounted confirm overlay (TR.C2).
		expect(mockContext.renderer.root.add).toHaveBeenCalledTimes(3);
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

	it('renders a footer keybar with the New/Delete bindings', async () => {
		const screen = new MappingBuilderScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const root = (mockContext.renderer.root.add as any).mock.calls[0][0];
		const footer = findText(root, (t) => t.includes('New'));
		expect(footer).toBeDefined();
		const footerText = footer.content.chunks.map((c: { text: string }) => c.text).join('');
		expect(footerText).toContain('New');
		expect(footerText).toContain('Delete');
	});

	it('wraps the mapping list in a titled panel', async () => {
		const screen = new MappingBuilderScreen(mockContext);
		screen.render();

		await new Promise((resolve) => setTimeout(resolve, 50));

		const root = (mockContext.renderer.root.add as any).mock.calls[0][0];
		const listPanel = findPanel(root, 'Mappings');
		expect(listPanel).toBeDefined();
	});

	describe('handleDelete()', () => {
		// listSelect index 0 is the synthetic "+ Create New Mapping" row, so
		// index 1 is the first real entry: 'fac-airtable-2025' (bundled) per the
		// listMappings() mock above.
		async function renderAndSelect(index: number) {
			const screen = new MappingBuilderScreen(mockContext);
			const resultPromise = screen.render();
			await new Promise((resolve) => setTimeout(resolve, 50));
			(screen as any).listSelect.selectedIndex = index;
			return { screen, resultPromise };
		}

		it('deletes via keymap.confirm() when the user confirms', async () => {
			const { screen } = await renderAndSelect(2); // 'my-custom-mapping' — not bundled
			const resolve = vi.fn();
			(screen as any).keymap.confirm = vi.fn().mockResolvedValue(true);

			await (screen as any).handleDelete(resolve);

			expect(deleteMappingMock).toHaveBeenCalledWith('my-custom-mapping');
		});

		it('does not delete when the user cancels via keymap.confirm()', async () => {
			const { screen } = await renderAndSelect(2);
			const resolve = vi.fn();
			(screen as any).keymap.confirm = vi.fn().mockResolvedValue(false);

			await (screen as any).handleDelete(resolve);

			expect(deleteMappingMock).not.toHaveBeenCalled();
		});

		it('blocks deletion of a bundled mapping before confirm() is ever called', async () => {
			const { screen } = await renderAndSelect(1); // 'fac-airtable-2025' — bundled
			const resolve = vi.fn();
			const confirmMock = vi.fn().mockResolvedValue(true);
			(screen as any).keymap.confirm = confirmMock;

			await (screen as any).handleDelete(resolve);

			expect(confirmMock).not.toHaveBeenCalled();
			expect(deleteMappingMock).not.toHaveBeenCalled();
		});
	});
});

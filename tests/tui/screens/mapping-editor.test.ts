import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MappingEditorScreen } from '../../../src/tui/screens/mapping-editor';
import { theme } from '../../../assets/brand/theme';
import * as fixtures from '../../fixtures/tui/tui';
import { buildTestRegistry } from '../../fixtures/tui/schemaRegistry';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

// RGBA import resolves to the mock above, same idiom as panel.test.ts / theme.test.ts.
import { RGBA } from '@opentui/core';
const accentColour = RGBA.fromHex(theme.accent);
const borderColour = RGBA.fromHex(theme.border);

// loadSchema is hoisted so the grouped-display describe block below can
// override it to succeed; every other test keeps the default failure so
// this.registry stays undefined and the right panel stays a no-op.
const loadSchemaMock = vi.fn().mockResolvedValue({ success: false, error: { message: 'not found' } });

// Mock createStorage: include ALL methods to avoid leaking incomplete mocks
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
		loadSchema: loadSchemaMock,
		listSchemas: vi.fn().mockResolvedValue({ success: true, data: ['schemafile25.xsd'] }),
		saveSubmission: vi.fn().mockResolvedValue({ success: true, data: '/tmp/test.xml' }),
		listSubmissions: vi.fn().mockResolvedValue({ success: true, data: [] }),
		loadHistory: vi.fn().mockResolvedValue({ success: true, data: { formatVersion: 1, submissions: [] } }),
		appendHistory: vi.fn().mockResolvedValue({ success: true, data: undefined }),
	}),
}));

// buildSchemaRegistry is hoisted the same way as loadSchemaMock: most tests
// never reach it (loadSchema fails by default), but the grouped-display
// block below points it at a real, hand-built SchemaRegistry fixture.
// Spreads the real module so the screen's other imports, isRequired,
// isEffectivelyRequired and parseCSV, keep their real implementations.
const buildSchemaRegistryMock = vi.fn();
vi.mock('@jasonwarrenuk/schema-forge', async (importOriginal) => ({
	...(await importOriginal<typeof import('@jasonwarrenuk/schema-forge')>()),
	buildSchemaRegistry: (...args: unknown[]) => buildSchemaRegistryMock(...args),
}));

/** Find the first descendant (recursively) with the given border title. */
function findPanelBox(root: any, title: string): any {
	for (const child of root.getChildren?.() ?? []) {
		if (child.title === title) return child;
		const found = findPanelBox(child, title);
		if (found) return found;
	}
	return null;
}

/** Grab the Keymap's dispatcher registered via renderer.keyInput.on('keypress', fn). */
function getKeypressHandler(mockContext: ReturnType<typeof fixtures.createMockContext>) {
	const call = (mockContext.renderer.keyInput.on as any).mock.calls.find(
		(c: unknown[]) => c[0] === 'keypress'
	);
	return call?.[1] as (key: { name: string }) => void;
}

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

		// One call for the screen shell, one for the auto-mounted help overlay (TR.C1),
		// one for the auto-mounted confirm overlay (TR.C2), one for the
		// auto-mounted command palette overlay (TR.D1).
		expect(mockContext.renderer.root.add).toHaveBeenCalledTimes(4);
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

	describe('two-panel focus sync (TR.B5 regression)', () => {
		it('keeps border colour and real focus in sync across Tab', async () => {
			const screen = new MappingEditorScreen(mockContext);
			screen.render({ mode: 'edit', mappingId: 'test-mapping' });
			await new Promise((resolve) => setTimeout(resolve, 50));

			const root = (mockContext.renderer.root.add as any).mock.calls[0][0];
			const leftBox = findPanelBox(root, 'Mapped Fields');
			const rightBox = findPanelBox(root, 'Schema Fields');
			expect(leftBox).toBeDefined();
			expect(rightBox).toBeDefined();

			// Initial state: left focused (accent border), right muted.
			expect(leftBox.borderColor.equals(accentColour)).toBe(true);
			expect(rightBox.borderColor.equals(borderColour)).toBe(true);

			const dispatch = getKeypressHandler(mockContext);
			expect(dispatch).toBeDefined();

			// Tab -> right panel focused.
			dispatch({ name: 'tab' });
			expect(rightBox.borderColor.equals(accentColour)).toBe(true);
			expect(leftBox.borderColor.equals(borderColour)).toBe(true);

			// Tab again -> back to left. Border and real focus must agree at every step.
			dispatch({ name: 'tab' });
			expect(leftBox.borderColor.equals(accentColour)).toBe(true);
			expect(rightBox.borderColor.equals(borderColour)).toBe(true);
		});

		it('lights the right panel border and blurs the left list when searching', async () => {
			const screen = new MappingEditorScreen(mockContext);
			screen.render({ mode: 'edit', mappingId: 'test-mapping' });
			await new Promise((resolve) => setTimeout(resolve, 50));

			const root = (mockContext.renderer.root.add as any).mock.calls[0][0];
			const leftBox = findPanelBox(root, 'Mapped Fields');
			const rightBox = findPanelBox(root, 'Schema Fields');

			const dispatch = getKeypressHandler(mockContext);
			dispatch({ name: '/' });

			expect(rightBox.borderColor.equals(accentColour)).toBe(true);
			expect(leftBox.borderColor.equals(borderColour)).toBe(true);
		});

		it('does not desync when search ENTER hands off to the results list (previously a bug)', async () => {
			const screen = new MappingEditorScreen(mockContext);
			screen.render({ mode: 'edit', mappingId: 'test-mapping' });
			await new Promise((resolve) => setTimeout(resolve, 50));

			const root = (mockContext.renderer.root.add as any).mock.calls[0][0];
			const rightBox = findPanelBox(root, 'Schema Fields');

			const dispatch = getKeypressHandler(mockContext);
			dispatch({ name: '/' }); // focus search, right border lights

			// Find the searchInput's registered ENTER handler and invoke it directly,
			// mirroring how InputRenderableEvents.ENTER fires in the real renderer.
			const inputOnCalls = (screen as any).searchInput.on.mock.calls as unknown[][];
			const enterCall = inputOnCalls.find((c) => c[0] === 'enter');
			expect(enterCall).toBeDefined();
			(enterCall![1] as () => void)();

			// Focus moved from search to the results list, but stayed inside the right
			// panel; the border must not flicker or fall out of sync with focusTarget.
			expect(rightBox.borderColor.equals(accentColour)).toBe(true);
			expect((screen as any).focusTarget).toBe('right');
		});
	});

	describe('selection-driven actions (TR.B5 regression)', () => {
		// leftSelect.selectedIndex is write-only on the real SelectRenderable and
		// always reads back undefined; the mock mirrors this (see
		// tests/fixtures/tui/opentui.ts) so these tests only pin the fix if
		// they assert the resulting mutation, not just that the handler ran.
		// Driving selection via setSelectedIndex() and checking the outcome is
		// what actually fails against the old `.selectedIndex` read.

		it('removes the selected mapping on "x"', async () => {
			const screen = new MappingEditorScreen(mockContext);
			screen.render({ mode: 'edit', mappingId: 'test-mapping' });
			await new Promise((resolve) => setTimeout(resolve, 50));

			const leftSelect = (screen as any).leftSelect;
			leftSelect.setSelectedIndex(1); // Sex row

			const dispatch = getKeypressHandler(mockContext);
			dispatch({ name: 'x' });

			const mappings = (screen as any).mappings;
			expect(mappings).toHaveLength(1);
			expect(mappings[0].csvColumn).toBe('ULN');
			expect((screen as any).dirty).toBe(true);
		});

		it('cycles the selected mapping\'s transform on "t"', async () => {
			const screen = new MappingEditorScreen(mockContext);
			screen.render({ mode: 'edit', mappingId: 'test-mapping' });
			await new Promise((resolve) => setTimeout(resolve, 50));

			const leftSelect = (screen as any).leftSelect;
			leftSelect.setSelectedIndex(0); // ULN row, starts at stringToInt

			const dispatch = getKeypressHandler(mockContext);
			dispatch({ name: 't' });

			const mappings = (screen as any).mappings;
			const uln = mappings.find((m: { csvColumn: string }) => m.csvColumn === 'ULN');
			expect(uln.transform).toBe('postcode'); // next after stringToInt in TRANSFORMS
		});
	});

	describe('grouped schema field display (TR.D3)', () => {
		beforeEach(() => {
			loadSchemaMock.mockResolvedValueOnce({ success: true, data: {} });
			buildSchemaRegistryMock.mockReturnValueOnce(buildTestRegistry());
		});

		it('renders ancestor group headers with a __group_ value and no description', async () => {
			const screen = new MappingEditorScreen(mockContext);
			screen.render({ mode: 'create' });
			await new Promise((resolve) => setTimeout(resolve, 50));

			const options = (screen as any).rightSelect.options;
			const learnerHeader = options.find((o: { value: string }) => o.value === '__group_Learner');

			expect(learnerHeader).toBeDefined();
			expect(learnerHeader.description).toBe('');
			expect(learnerHeader.name.trim()).toBe('Learner');
		});

		it('renders field rows with the bare element name and a Message.-stripped path', async () => {
			const screen = new MappingEditorScreen(mockContext);
			screen.render({ mode: 'create' });
			await new Promise((resolve) => setTimeout(resolve, 50));

			const options = (screen as any).rightSelect.options;
			const ulnRow = options.find((o: { value: string }) => o.value === 'Message.Learner.ULN');

			expect(ulnRow).toBeDefined();
			expect(ulnRow.name.trim().endsWith('ULN')).toBe(true);
			expect(ulnRow.description).not.toContain('Message.');
			expect(ulnRow.description.trim()).toBe('Learner.ULN');
		});

		it('indents a nested group and its fields deeper than the top-level group', async () => {
			const screen = new MappingEditorScreen(mockContext);
			screen.render({ mode: 'create' });
			await new Promise((resolve) => setTimeout(resolve, 50));

			const options = (screen as any).rightSelect.options;
			const learnerHeHeader = options.find((o: { value: string }) => o.value === '__group_Learner.LearnerHE');
			const learnerHeader = options.find((o: { value: string }) => o.value === '__group_Learner');

			expect(learnerHeHeader.name.length).toBeGreaterThan(learnerHeader.name.length);
		});

		it('skips over a group header when SELECTION_CHANGED lands on one, in either direction', async () => {
			const screen = new MappingEditorScreen(mockContext);
			screen.render({ mode: 'create' });
			await new Promise((resolve) => setTimeout(resolve, 50));

			const rightSelect = (screen as any).rightSelect;
			const options = rightSelect.options;
			// Learner.LearnerHE sits mid-list (not at either boundary), so both
			// skip directions land on a real neighbouring row rather than bouncing.
			const headerIndex = options.findIndex(
				(o: { value: string }) => o.value === '__group_Learner.LearnerHE'
			);
			expect(headerIndex).toBeGreaterThan(0);
			expect(headerIndex).toBeLessThan(options.length - 1);

			const selectionChangedCall = (rightSelect.on as any).mock.calls.find(
				(c: unknown[]) => c[0] === 'selectionChanged'
			);
			expect(selectionChangedCall).toBeDefined();
			const onSelectionChanged = selectionChangedCall[1] as (
				index: number,
				option: unknown
			) => void;

			// Moving downward onto the header should step one further forward.
			(screen as any).previousRightIndex = headerIndex - 1;
			onSelectionChanged(headerIndex, options[headerIndex]);
			expect(rightSelect.setSelectedIndex).toHaveBeenCalledWith(headerIndex + 1);

			// Moving upward onto the header should step one further back.
			(screen as any).previousRightIndex = headerIndex + 1;
			onSelectionChanged(headerIndex, options[headerIndex]);
			expect(rightSelect.setSelectedIndex).toHaveBeenCalledWith(headerIndex - 1);
		});

		it('does not create a mapping when ITEM_SELECTED fires on a group header', async () => {
			const screen = new MappingEditorScreen(mockContext);
			screen.render({ mode: 'create' });
			await new Promise((resolve) => setTimeout(resolve, 50));

			const rightSelect = (screen as any).rightSelect;
			const itemSelectedCall = (rightSelect.on as any).mock.calls.find(
				(c: unknown[]) => c[0] === 'itemSelected'
			);
			const onItemSelected = itemSelectedCall[1] as (index: number, option: unknown) => void;

			const before = (screen as any).mappings.length;
			onItemSelected(0, { name: 'Learner', description: '', value: '__group_Learner' });

			expect((screen as any).mappings).toHaveLength(before);
		});
	});
});

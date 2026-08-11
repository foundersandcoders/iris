import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	WorkflowScreen,
	formatElapsed,
	computeAggregateProgress,
} from '../../../src/tui/screens/workflow';
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

vi.mock('@jasonwarrenuk/schema-forge', async (importOriginal) => ({
	...(await importOriginal<typeof import('@jasonwarrenuk/schema-forge')>()),
	buildSchemaRegistry: vi.fn().mockReturnValue({}),
}));

// Stub generators: each yields nothing and resolves immediately with a
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
		// on failure), so no help overlay is mounted here; just the screen shell.
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
		screen.render({ filePath: 'data.csv', workflowType: 'convert' }); // don't await, never resolves without a keypress
		await new Promise((resolve) => setTimeout(resolve, 10));

		screen.cleanup();

		expect(mockContext.renderer.keyInput.off).toHaveBeenCalledWith('keypress', expect.any(Function));
		// One removal for the screen shell, one for the help overlay (TR.C1),
		// one for the confirm overlay (TR.C2).
		expect(mockContext.renderer.root.remove).toHaveBeenCalledTimes(3);
	});

	describe('completion toast', () => {
		it('fires a success toast on a successful convert, before replace() tears the screen down', async () => {
			const toasts = tuiFixtures.createMockToasts();
			const ctx = tuiFixtures.createMockContext(mockContext.renderer, toasts);
			const screen = new WorkflowScreen(ctx);

			const result = await screen.render({ filePath: 'data.csv', workflowType: 'convert' });

			// The toast call must happen inside render()/routeToResultScreen(),
			// i.e. before the screen is torn down, proving it doesn't depend on
			// the screen surviving. The manager itself (tested in
			// toastManager.test.ts) is what actually outlives cleanup().
			expect(toasts.success).toHaveBeenCalledWith('Converted 0 learners');
			expect(result).toMatchObject({ action: 'replace', screen: 'success' });

			screen.cleanup();
		});

		it('pluralises the learner count correctly', async () => {
			const { convertWorkflow } = await import('../../../src/lib/workflows/csvConvert');
			(convertWorkflow as any).mockReturnValueOnce(
				(async function* () {
					return {
						success: true,
						steps: [],
						duration: 1,
						data: {
							xml: '',
							outputPath: 'out.xml',
							csvData: { rows: [{}] },
							validation: validResult,
						},
					};
				})()
			);

			const toasts = tuiFixtures.createMockToasts();
			const ctx = tuiFixtures.createMockContext(mockContext.renderer, toasts);
			const screen = new WorkflowScreen(ctx);

			await screen.render({ filePath: 'data.csv', workflowType: 'convert' });

			expect(toasts.success).toHaveBeenCalledWith('Converted 1 learner');

			screen.cleanup();
		});

		it('does not fire a toast when ctx has no toast manager', async () => {
			const screen = new WorkflowScreen(mockContext);
			await expect(
				screen.render({ filePath: 'data.csv', workflowType: 'convert' })
			).resolves.toMatchObject({ action: 'replace', screen: 'success' });
			screen.cleanup();
		});

		it('does not fire a toast on validate or check workflows', async () => {
			const toasts = tuiFixtures.createMockToasts();
			const ctx = tuiFixtures.createMockContext(mockContext.renderer, toasts);

			const validateScreen = new WorkflowScreen(ctx);
			await validateScreen.render({ filePath: 'data.csv', workflowType: 'validate' });
			validateScreen.cleanup();

			const checkScreen = new WorkflowScreen(ctx);
			await checkScreen.render({ filePath: 'data.xml', workflowType: 'check' });
			checkScreen.cleanup();

			expect(toasts.success).not.toHaveBeenCalled();
		});
	});

	describe('progress bar and elapsed timer', () => {
		// handleEvent() is driven directly here rather than through a live
		// generator: opentui-spinner's SpinnerRenderable constructor
		// unconditionally calls resolveRenderLib() (to encode unicode frames),
		// which the test double deliberately throws on (see its comment),
		// no test may construct a real spinner. step:start events are
		// therefore synthesised with a fake spinner stand-in already seeded
		// into stepRenderables, mirroring the post-step:start state without
		// invoking the real constructor. buildUI() must run first per the
		// documented pattern (populates stepRenderables).
		function stepEvent(type: string, id: string, extra: Record<string, unknown> = {}) {
			return { type, step: { id, name: id, status: 'running', progress: 0, ...extra }, timestamp: 0 };
		}

		function buildScreen(): WorkflowScreen {
			const screen = new WorkflowScreen(mockContext);
			(screen as any).workflowType = 'convert';
			(screen as any).steps = [
				{ id: 'parse', name: 'Parse CSV', status: 'pending', progress: 0 },
				{ id: 'validate', name: 'Validate Data', status: 'pending', progress: 0 },
				{ id: 'generate', name: 'Generate XML', status: 'pending', progress: 0 },
				{ id: 'save', name: 'Save Output', status: 'pending', progress: 0 },
			];
			(screen as any).buildUI('Converting');
			return screen;
		}

		it('advances the bar as steps complete', () => {
			const screen = buildScreen();
			(screen as any).handleEvent(stepEvent('step:complete', 'parse', { status: 'complete' }));

			expect((screen as any).progress.getValue()).toBe(0.25);
			screen.cleanup();
		});

		it('a skipped step counts toward completion, the blocked-convert case', () => {
			const screen = buildScreen();
			(screen as any).handleEvent(stepEvent('step:complete', 'parse', { status: 'complete' }));
			(screen as any).handleEvent(stepEvent('step:complete', 'validate', { status: 'complete' }));
			(screen as any).handleEvent(stepEvent('step:complete', 'generate', { status: 'skipped' }));
			(screen as any).handleEvent(stepEvent('step:complete', 'save', { status: 'skipped' }));

			expect((screen as any).progress.getValue()).toBe(1);
			screen.cleanup();
		});

		it('step:error advances the bar and recolours it to the error accent', async () => {
			const { theme } = await import('../../../assets/brand/theme');
			const { RGBA } = await import('../../fixtures/tui/opentui');

			const screen = buildScreen();
			(screen as any).handleEvent(
				stepEvent('step:error', 'parse', { status: 'failed', error: new Error('boom') })
			);

			const progress = (screen as any).progress;
			expect(progress.getValue()).toBe(0.25);
			const barContainer = progress.root.getChildren()[0];
			const filledText = barContainer.getChildren()[0];
			expect(filledText.fg.equals(RGBA.fromHex(theme.errorAccent))).toBe(true);

			screen.cleanup();
		});

		it('step:progress refines a running step without stopping its spinner', () => {
			const screen = buildScreen();
			// Seed the post-step:start state directly, bypassing the real
			// SpinnerRenderable constructor (see the describe-level comment).
			const fakeSpinner = { stop: vi.fn() };
			(screen as any).stepRenderables.get('parse').spinner = fakeSpinner;
			(screen as any).steps[0].status = 'running';

			(screen as any).handleEvent(
				stepEvent('step:progress', 'parse', { status: 'running', progress: 50 })
			);

			// Half of one quarter = 0.125.
			expect((screen as any).progress.getValue()).toBe(0.125);
			const renderables = (screen as any).stepRenderables.get('parse');
			expect(renderables.spinner).toBe(fakeSpinner);
			expect(fakeSpinner.stop).not.toHaveBeenCalled();

			screen.cleanup();
		});

		it('starts the elapsed timer during a run and clears it in the finally block', async () => {
			vi.useFakeTimers();
			const screen = new WorkflowScreen(mockContext);
			const resultPromise = screen.render({ filePath: 'data.csv', workflowType: 'convert' });
			await resultPromise;

			expect((screen as any).elapsedTimer).toBeUndefined();
			vi.useRealTimers();
			screen.cleanup();
		});

		it('cleanup() clears a still-running elapsed timer', () => {
			vi.useFakeTimers();
			const screen = buildScreen();
			(screen as any).startTime = Date.now();
			(screen as any).startElapsedTimer();
			vi.advanceTimersByTime(10);

			expect((screen as any).elapsedTimer).toBeDefined();
			screen.cleanup();
			expect((screen as any).elapsedTimer).toBeUndefined();

			// No further ticks should fire against the torn-down screen.
			const setStatusSpy = vi.spyOn((screen as any).progress, 'setStatus');
			vi.advanceTimersByTime(5000);
			expect(setStatusSpy).not.toHaveBeenCalled();

			vi.useRealTimers();
		});

		it('the status readout ticks every second while running', () => {
			vi.useFakeTimers();
			const screen = buildScreen();
			(screen as any).startTime = Date.now();
			(screen as any).startElapsedTimer();
			vi.advanceTimersByTime(2000);

			const statusText = (screen as any).progress.root.getChildren()[1];
			expect(statusText.content.chunks[0].text).toBe('elapsed 0:02');

			screen.cleanup();
			vi.useRealTimers();
		});
	});

	describe('formatElapsed()', () => {
		it('formats whole seconds as m:ss', () => {
			expect(formatElapsed(0)).toBe('elapsed 0:00');
			expect(formatElapsed(62_000)).toBe('elapsed 1:02');
			expect(formatElapsed(600_000)).toBe('elapsed 10:00');
		});

		it('floors rather than rounds, so it never runs ahead of reality', () => {
			expect(formatElapsed(1_999)).toBe('elapsed 0:01');
		});

		it('clamps negative durations to zero', () => {
			expect(formatElapsed(-500)).toBe('elapsed 0:00');
		});
	});

	describe('computeAggregateProgress()', () => {
		function step(status: 'pending' | 'running' | 'complete' | 'failed' | 'skipped', progress = 0) {
			return { id: 'x', name: 'X', status, progress };
		}

		it('returns 0 for an empty step list, never NaN', () => {
			expect(computeAggregateProgress([])).toBe(0);
		});

		it('one of four complete is 0.25', () => {
			const steps = [step('complete'), step('pending'), step('pending'), step('pending')];
			expect(computeAggregateProgress(steps)).toBe(0.25);
		});

		it('all complete is 1', () => {
			const steps = [step('complete'), step('complete'), step('complete'), step('complete')];
			expect(computeAggregateProgress(steps)).toBe(1);
		});

		it('a skipped step counts as done, the blocked-conversion case', () => {
			const steps = [step('complete'), step('complete'), step('skipped'), step('skipped')];
			expect(computeAggregateProgress(steps)).toBe(1);
		});

		it('a failed step counts as done, the workflow has stopped', () => {
			const steps = [step('complete'), step('failed'), step('pending'), step('pending')];
			expect(computeAggregateProgress(steps)).toBe(0.5);
		});

		it('a running step contributes its own fractional progress', () => {
			const steps = [step('complete'), step('running', 50), step('pending'), step('pending')];
			expect(computeAggregateProgress(steps)).toBe(0.375); // 1 + 0.5 of 4
		});
	});
});

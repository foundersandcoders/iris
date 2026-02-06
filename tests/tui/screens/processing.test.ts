import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessingScreen } from '../../../src/tui/screens/processing';
import * as tuiFixtures from '../../fixtures/tui/tui';

describe('ProcessingScreen', () => {
	let mockContext: ReturnType<typeof tuiFixtures.createMockContext>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockContext = tuiFixtures.createMockContext();
	});

	it('can be instantiated', () => {
		const screen = new ProcessingScreen(mockContext);
		expect(screen).toBeInstanceOf(ProcessingScreen);
		expect(screen.name).toBe('processing');
	});

	it('returns pop action when no filePath provided', async () => {
		const screen = new ProcessingScreen(mockContext);
		const result = await screen.render();
		expect(result).toEqual({ action: 'pop' });
	});

	it('displays step status icons', () => {
		const screen = new ProcessingScreen(mockContext);

		const getIcon = (screen as any).getStatusIcon.bind(screen);

		expect(getIcon('pending')).toBe('○');
		expect(getIcon('running')).toBe('◐');
		expect(getIcon('complete')).toBe('●');
		expect(getIcon('failed')).toBe('✗');
		expect(getIcon('skipped')).toBe('◌');
	});

	it('displays step status colors', () => {
		const screen = new ProcessingScreen(mockContext);

		const getColor = (screen as any).getStatusColor.bind(screen);

		// Just verify it returns strings (colors) for each status
		expect(typeof getColor('pending')).toBe('string');
		expect(typeof getColor('running')).toBe('string');
		expect(typeof getColor('complete')).toBe('string');
		expect(typeof getColor('failed')).toBe('string');
		expect(typeof getColor('skipped')).toBe('string');
	});

	it('handleEvent updates step status on step:start', () => {
		const screen = new ProcessingScreen(mockContext);

		// Build UI to initialize stepRenderables
		(screen as any).buildUI();

		const steps = (screen as any).steps;
		const parseStep = steps.find((s: any) => s.id === 'parse');

		expect(parseStep.status).toBe('pending');

		const event = {
			type: 'step:start' as const,
			step: { id: 'parse', name: 'Parse CSV', status: 'running' as const },
			timestamp: Date.now(),
		};

		(screen as any).handleEvent(event);

		expect(parseStep.status).toBe('running');

		screen.cleanup();
	});

	it('handleEvent updates step status on step:complete', () => {
		const screen = new ProcessingScreen(mockContext);

		// Build UI to initialize stepRenderables
		(screen as any).buildUI();

		const steps = (screen as any).steps;
		const parseStep = steps.find((s: any) => s.id === 'parse');

		// Start the step first
		(screen as any).handleEvent({
			type: 'step:start',
			step: { id: 'parse', name: 'Parse CSV', status: 'running' },
			timestamp: Date.now(),
		});

		const completeEvent = {
			type: 'step:complete' as const,
			step: {
				id: 'parse',
				name: 'Parse CSV',
				status: 'complete' as const,
				message: 'Parsed 10 rows',
			},
			timestamp: Date.now(),
		};

		(screen as any).handleEvent(completeEvent);

		expect(parseStep.status).toBe('complete');
		expect(parseStep.message).toBe('Parsed 10 rows');

		screen.cleanup();
	});

	it('handleEvent updates step status on step:error', () => {
		const screen = new ProcessingScreen(mockContext);

		// Build UI to initialize stepRenderables
		(screen as any).buildUI();

		const steps = (screen as any).steps;
		const parseStep = steps.find((s: any) => s.id === 'parse');

		const errorEvent = {
			type: 'step:error' as const,
			step: {
				id: 'parse',
				name: 'Parse CSV',
				status: 'failed' as const,
				error: new Error('Failed to parse'),
			},
			timestamp: Date.now(),
		};

		(screen as any).handleEvent(errorEvent);

		expect(parseStep.status).toBe('failed');
		expect(parseStep.message).toBe('Failed to parse');

		screen.cleanup();
	});
});

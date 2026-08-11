import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

import { createTransitions, isRemoteSession } from '../../../src/tui/utils/transitions';
import { engine, createTimeline } from '../../fixtures/tui/opentui';
import * as fixtures from '../../fixtures/tui/tui';

describe('createTransitions()', () => {
	let renderer: ReturnType<typeof fixtures.createMockRenderer>;

	beforeEach(() => {
		vi.clearAllMocks();
		renderer = fixtures.createMockRenderer();
	});

	describe('disabled (reduce-motion or SSH)', () => {
		it('never touches the Timeline or engine', () => {
			const transitions = createTransitions(renderer, false);
			transitions.fadeIn('push', { root: { opacity: 0 } });
			transitions.dispose();

			expect(createTimeline).not.toHaveBeenCalled();
			expect(engine.attach).not.toHaveBeenCalled();
			expect(engine.detach).not.toHaveBeenCalled();
		});

		it('fadeIn is a synchronous no-op, no opacity mutation', () => {
			const transitions = createTransitions(renderer, false);
			const screen = { root: { opacity: 0 } };
			transitions.fadeIn('push', screen);
			expect(screen.root.opacity).toBe(0);
		});
	});

	describe('enabled', () => {
		it('attaches to the engine exactly once across multiple transitions', () => {
			const transitions = createTransitions(renderer, true);
			transitions.fadeIn('push', { root: { opacity: 0 } });
			transitions.fadeIn('pop', { root: { opacity: 0 } });
			transitions.fadeIn('replace', { root: { opacity: 0 } });

			expect(engine.attach).toHaveBeenCalledTimes(1);
			expect(engine.attach).toHaveBeenCalledWith(renderer);
		});

		it('animates an already-mounted root from 0 to 1', () => {
			const transitions = createTransitions(renderer, true);
			const screen = { root: { opacity: 0.5 } };

			transitions.fadeIn('push', screen);

			expect(screen.root.opacity).toBe(0); // reset before the animation starts
			const timeline = (createTimeline as ReturnType<typeof vi.fn>).mock.results[0].value;
			expect(timeline.add).toHaveBeenCalledWith(
				screen.root,
				expect.objectContaining({ opacity: 1 })
			);
			expect(timeline.play).toHaveBeenCalled();
		});

		it('push/pop/replace use different duration and ease', () => {
			const transitions = createTransitions(renderer, true);

			transitions.fadeIn('push', { root: { opacity: 0 } });
			transitions.fadeIn('pop', { root: { opacity: 0 } });
			transitions.fadeIn('replace', { root: { opacity: 0 } });

			// Each fadeIn() creates its OWN Timeline instance; reusing one
			// shared timeline was the actual bug being fixed here (adding at
			// startTime 0 on an already-advanced shared clock resolved
			// instantly instead of animating).
			const results = (createTimeline as ReturnType<typeof vi.fn>).mock.results;
			const pushProps = results[0].value.add.mock.calls[0][1];
			const popProps = results[1].value.add.mock.calls[0][1];
			const replaceProps = results[2].value.add.mock.calls[0][1];
			expect(pushProps.duration).not.toBe(popProps.duration);
			expect(popProps.duration).not.toBe(replaceProps.duration);
			expect(pushProps.ease).not.toBe(popProps.ease);
		});

		it('each fadeIn creates a fresh Timeline rather than reusing one', () => {
			const transitions = createTransitions(renderer, true);
			transitions.fadeIn('push', { root: { opacity: 0 } });
			transitions.fadeIn('push', { root: { opacity: 0 } });
			transitions.fadeIn('push', { root: { opacity: 0 } });

			expect(createTimeline).toHaveBeenCalledTimes(3);
		});

		it('polls via a frame callback when the root is not yet mounted, then animates once it appears', () => {
			const transitions = createTransitions(renderer, true);
			const screen: { root?: { opacity: number } } = {};

			transitions.fadeIn('push', screen);

			// No root yet, a frame callback was registered, nothing animated.
			expect(renderer.setFrameCallback).toHaveBeenCalledTimes(1);
			const poll = (renderer.setFrameCallback as ReturnType<typeof vi.fn>).mock.calls[0][0];

			// Root appears; the next frame tick should pick it up and animate.
			screen.root = { opacity: 1 };
			poll();

			expect(renderer.removeFrameCallback).toHaveBeenCalledWith(poll);
			expect(screen.root.opacity).toBe(0);
			const timeline = (createTimeline as ReturnType<typeof vi.fn>).mock.results[0].value;
			expect(timeline.add).toHaveBeenCalledWith(screen.root, expect.objectContaining({ opacity: 1 }));
		});

		it('keeps polling past the deadline if the root still has not appeared', () => {
			vi.useFakeTimers();
			const transitions = createTransitions(renderer, true);
			const screen: { root?: { opacity: number } } = {};

			transitions.fadeIn('push', screen);
			const poll = (renderer.setFrameCallback as ReturnType<typeof vi.fn>).mock.calls[0][0];

			vi.advanceTimersByTime(600); // past the 500ms deadline
			poll();

			// Root still hasn't appeared; the poll must NOT be torn down while
			// it's still pending, or a root that mounts even later would never
			// get its opacity restored and would stay invisible forever.
			expect(renderer.removeFrameCallback).not.toHaveBeenCalled();
			vi.useRealTimers();
		});

		it('snaps a root that mounts past the deadline straight to opacity 1, without animating', () => {
			vi.useFakeTimers();
			const transitions = createTransitions(renderer, true);
			const screen: { root?: { opacity: number } } = {};

			transitions.fadeIn('push', screen);
			const poll = (renderer.setFrameCallback as ReturnType<typeof vi.fn>).mock.calls[0][0];

			vi.advanceTimersByTime(600); // past the 500ms deadline, root still unmounted
			poll();
			expect(renderer.removeFrameCallback).not.toHaveBeenCalled();

			// Root finally mounts, well after the deadline.
			screen.root = { opacity: 0 };
			poll();

			expect(renderer.removeFrameCallback).toHaveBeenCalledWith(poll);
			expect(screen.root.opacity).toBe(1); // snapped, not left at 0
			expect(createTimeline).not.toHaveBeenCalled(); // no animation was played
			vi.useRealTimers();
		});

		it('appends the frame callback via setFrameCallback, never replacing existing callbacks', () => {
			// setFrameCallback on the real renderer appends to an array rather
			// than replacing, this double doesn't model that array itself, but
			// asserting the transitions module always goes through
			// setFrameCallback (never touches renderer state directly) is the
			// contract that keeps it compatible with that append semantics.
			const transitions = createTransitions(renderer, true);
			transitions.fadeIn('push', {});
			expect(renderer.setFrameCallback).toHaveBeenCalledWith(expect.any(Function));
		});

		it('dispose() calls engine.detach() exactly once and is idempotent', () => {
			const transitions = createTransitions(renderer, true);
			transitions.fadeIn('push', { root: { opacity: 0 } }); // attaches
			transitions.dispose();
			transitions.dispose();

			expect(engine.detach).toHaveBeenCalledTimes(1);
		});

		it('dispose() before any fadeIn does not call engine.detach()', () => {
			const transitions = createTransitions(renderer, true);
			transitions.dispose();
			expect(engine.detach).not.toHaveBeenCalled();
		});

		it('dispose() cancels a mount poll that never resolved, so it does not run forever', () => {
			const transitions = createTransitions(renderer, true);
			const screen: { root?: { opacity: number } } = {}; // never mounts

			transitions.fadeIn('push', screen);
			const poll = (renderer.setFrameCallback as ReturnType<typeof vi.fn>).mock.calls[0][0];

			transitions.dispose();

			expect(renderer.removeFrameCallback).toHaveBeenCalledWith(poll);
		});

		it('dispose() does not try to cancel a poll that already resolved', () => {
			const transitions = createTransitions(renderer, true);
			const screen: { root?: { opacity: number } } = {};

			transitions.fadeIn('push', screen);
			const poll = (renderer.setFrameCallback as ReturnType<typeof vi.fn>).mock.calls[0][0];
			screen.root = { opacity: 1 };
			poll(); // resolves and removes itself

			(renderer.removeFrameCallback as ReturnType<typeof vi.fn>).mockClear();
			transitions.dispose();

			expect(renderer.removeFrameCallback).not.toHaveBeenCalled();
		});
	});
});

describe('isRemoteSession()', () => {
	const original = { ...process.env };

	afterEach(() => {
		process.env = { ...original };
	});

	it('is false with no SSH env vars', () => {
		delete process.env.SSH_CONNECTION;
		delete process.env.SSH_TTY;
		delete process.env.SSH_CLIENT;
		expect(isRemoteSession()).toBe(false);
	});

	it.each(['SSH_CONNECTION', 'SSH_TTY', 'SSH_CLIENT'])('is true when %s is set', (key) => {
		delete process.env.SSH_CONNECTION;
		delete process.env.SSH_TTY;
		delete process.env.SSH_CLIENT;
		process.env[key] = 'anything';
		expect(isRemoteSession()).toBe(true);
	});
});

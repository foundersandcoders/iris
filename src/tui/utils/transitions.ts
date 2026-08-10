/** ====== Screen Transitions ======
 * Fade-in-only opacity transition for incoming screens (TR.C4). Screens
 * mount at opacity:0 (see appShell's `opacity` option) and fade up to 1;
 * the outgoing screen just disappears, as it always has. No fade-out.
 *
 * Scoped deliberately to fade-in only: a full fade-out+fade-in was
 * considered and rejected. Router.push/pop/replace all call the outgoing
 * screen's cleanup() before the next screen exists, and several screens
 * (dashboard, settings) await storage I/O before building UI, so a
 * crossfade would have no genuine window where both roots are usefully
 * co-resident, and two overlapping full-screen roots at partial opacity
 * would just read as an unreadable mush, not a crossfade. Fade-in alone
 * gets most of the perceived effect (in a TUI the eye registers arrival,
 * not departure) for a fraction of the complexity, no Screen-interface
 * change, no cleanup()-ordering risk. See docs/roadmaps/v5a-2606/enhanced.md
 * TR.C4 and the plan file for the fuller rationale.
 *
 * Verified against node_modules/@opentui/core 0.1.77: Renderable.opacity is
 * a real, animatable numeric property that reaches the Zig renderer via
 * bufferPushOpacity/popOpacity FFI calls, gated so there's zero overhead at
 * opacity===1. Timeline.add() only animates numeric properties, so opacity
 * qualifies directly.
 */
import { createTimeline, engine } from '@opentui/core';
import type { Renderer } from '../types';

export type TransitionKind = 'push' | 'pop' | 'replace';

/** A screen's transition target: typed as the minimal shape Timeline needs
 *  (a numeric opacity property), not the real BoxRenderable, so this module
 *  stays free of any dependency on the Screen/Router types. */
export interface TransitionTarget {
	root?: { opacity: number };
}

export interface Transitions {
	/** Animate the given screen's root from its current opacity to 1. If the
	 *  root isn't mounted yet (screens that await I/O before buildUI()), polls
	 *  once per frame until it appears. Before a deadline it animates the
	 *  full fade; past the deadline it snaps straight to opacity 1 instead,
	 *  the root must always end up visible, so the poll never simply gives up
	 *  while the root is still pending. */
	fadeIn(kind: TransitionKind, screen: TransitionTarget): void;
	/** Detach from the render engine. Call once at TUI teardown, before
	 *  renderer.destroy(). Idempotent. */
	dispose(): void;
}

/** Per-kind timing: push arrives with intent (outQuad, the longest), pop
 *  snaps back faster (outExpo: going back is cheaper than going forward),
 *  replace is a neutral swap (linear, the shortest). The original 90-140ms
 *  values were too short to read as motion at all: they resolved in ~5-8
 *  frames at 60fps, which came across as a flash rather than a fade. These
 *  are roughly 3x longer, closer to typical UI transition timing, while
 *  still short enough that a slow terminal degrades to a few visible steps
 *  rather than a stall. */
const TIMING: Record<TransitionKind, { duration: number; ease: string }> = {
	push: { duration: 420, ease: 'outQuad' },
	pop: { duration: 300, ease: 'outExpo' },
	replace: { duration: 260, ease: 'linear' },
};

/** How long fadeIn will animate a late-mounting root before switching to a
 *  direct opacity snap instead. Generous relative to real I/O (config load,
 *  history load), past this point the wait itself has already cost more
 *  than the fade would add, so there's nothing left to animate towards.
 *  Does NOT bound how long the poll itself runs: a root can still appear
 *  (and get snapped visible) arbitrarily later than this. A screen that
 *  never builds UI at all is only stopped by dispose() cancelling the
 *  pending poll (see the `pendingPolls` set in createTransitions), not by
 *  this deadline. */
const MOUNT_POLL_DEADLINE_MS = 500;

/** Auto-enable reduce-motion over SSH: remote terminals round-trip every
 *  frame, so a 140ms fade becomes a smear of half-drawn screens. Checked at
 *  the point of use, not folded into the stored config value: the user's
 *  actual preference is left untouched. */
export function isRemoteSession(): boolean {
	return Boolean(process.env.SSH_CONNECTION || process.env.SSH_TTY || process.env.SSH_CLIENT);
}

/** No-op implementation used when motion is disabled (config or SSH). Never
 *  imports/touches the Timeline or engine: this is what makes "disabled"
 *  mean zero animation overhead, not a zero-duration animation. */
const NOOP_TRANSITIONS: Transitions = Object.freeze({
	fadeIn() {},
	dispose() {},
});

export function createTransitions(renderer: Renderer, enabled: boolean): Transitions {
	if (!enabled) return NOOP_TRANSITIONS;

	let attached = false;

	// Mount-poll frame callbacks not yet resolved. A screen that throws
	// before buildUI(), or that the router tears down mid-poll, would
	// otherwise leave its poll registered on the renderer forever, awaited
	// every frame for the rest of the process. Tracked by reference since
	// removeFrameCallback() matches on function identity.
	const pendingPolls = new Set<(deltaTime: number) => Promise<void>>();

	function ensureAttached(): void {
		if (!attached) {
			engine.attach(renderer);
			attached = true;
		}
	}

	function play(kind: TransitionKind, root: { opacity: number }): void {
		const { duration, ease } = TIMING[kind];
		root.opacity = 0;

		// A fresh, one-shot Timeline per transition, NOT a shared/reused one.
		// Timeline.add()'s startTime defaults to 0 on THAT TIMELINE'S OWN
		// clock, not "now" in wall-clock terms. Reusing a single long-lived
		// Timeline across many transitions meant every fade after the first
		// was added at absolute time 0 while currentTime had already advanced
		// past the animation's own duration: evaluateItem() resolves an
		// already-elapsed window straight to its end value, so the opacity
		// jumped to 1 with no visible interpolation. This was the actual
		// cause of transitions being imperceptible.
		//
		// autoplay:false because createTimeline() would otherwise play()
		// immediately with zero items added yet, completing on its very next
		// update() and dropping live before add() ever runs.
		//
		// onComplete unregisters from the engine, register()/unregister()
		// drive requestLive()/dropLive() via updateLiveState(), so the
		// renderer drops back to idle once nothing is animating, rather than
		// leaking a live timeline (and its render-loop cost) forever.
		const timeline = createTimeline({
			duration,
			autoplay: false,
			onComplete: () => engine.unregister(timeline),
		});
		timeline.add(root, { opacity: 1, duration, ease: ease as never });
		timeline.play();
	}

	return {
		fadeIn(kind, screen) {
			ensureAttached();

			if (screen.root) {
				play(kind, screen.root);
				return;
			}

			// Root not mounted yet (screen awaits I/O before buildUI()). Poll
			// once per frame via the renderer's own frame callback, appending,
			// not replacing, so this never clobbers the workflow spinner or any
			// other registered callback, until the root appears.
			//
			// Every screen mounts at opacity:0 when motion is enabled (see
			// appShell's `opacity` option), specifically so this fade-in has
			// somewhere to animate from. Before the deadline, a late-arriving
			// root gets the full animated play(). Past the deadline, animating
			// is no longer worth the wait, but the root still MUST end up
			// visible, bailing out here entirely (as the code used to) left
			// slow-mounting screens (Dashboard/Settings/History, which await
			// storage I/O before buildUI()) stuck at opacity 0 forever, since
			// nothing else ever sets it back to 1. So the callback keeps
			// polling past the deadline; it just switches from animating to a
			// direct opacity snap the moment the root shows up. A screen that
			// never builds UI at all is caught by dispose() below, which
			// cancels any poll still pending at teardown.
			const deadline = Date.now() + MOUNT_POLL_DEADLINE_MS;
			const poll = async (): Promise<void> => {
				if (!screen.root) return;
				renderer.removeFrameCallback(poll);
				pendingPolls.delete(poll);
				if (Date.now() >= deadline) {
					screen.root.opacity = 1;
				} else {
					play(kind, screen.root);
				}
			};
			pendingPolls.add(poll);
			renderer.setFrameCallback(poll);
		},
		dispose() {
			pendingPolls.forEach((poll) => renderer.removeFrameCallback(poll));
			pendingPolls.clear();
			if (attached) {
				engine.detach();
				attached = false;
			}
		},
	};
}

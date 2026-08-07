/** ====== Screen Transitions ======
 * Fade-in-only opacity transition for incoming screens (TR.C4). Screens
 * mount at opacity:0 (see appShell's `opacity` option) and fade up to 1;
 * the outgoing screen just disappears, as it always has. No fade-out.
 *
 * Scoped deliberately to fade-in only: a full fade-out+fade-in was
 * considered and rejected. Router.push/pop/replace all call the outgoing
 * screen's cleanup() before the next screen exists, and several screens
 * (dashboard, settings) await storage I/O before building UI — so a
 * crossfade would have no genuine window where both roots are usefully
 * co-resident, and two overlapping full-screen roots at partial opacity
 * would just read as an unreadable mush, not a crossfade. Fade-in alone
 * gets most of the perceived effect (in a TUI the eye registers arrival,
 * not departure) for a fraction of the complexity — no Screen-interface
 * change, no cleanup()-ordering risk. See docs/roadmaps/v5a-2606/enhanced.md
 * TR.C4 and the plan file for the fuller rationale.
 *
 * Verified against node_modules/@opentui/core 0.1.77: Renderable.opacity is
 * a real, animatable numeric property that reaches the Zig renderer via
 * bufferPushOpacity/popOpacity FFI calls, gated so there's zero overhead at
 * opacity===1. Timeline.add() only animates numeric properties, so opacity
 * qualifies directly.
 */
import { createTimeline, engine, type Timeline } from '@opentui/core';
import type { Renderer } from '../types';

export type TransitionKind = 'push' | 'pop' | 'replace';

/** A screen's transition target — typed as the minimal shape Timeline needs
 *  (a numeric opacity property), not the real BoxRenderable, so this module
 *  stays free of any dependency on the Screen/Router types. */
export interface TransitionTarget {
	root?: { opacity: number };
}

export interface Transitions {
	/** Animate the given screen's root from its current opacity to 1. If the
	 *  root isn't mounted yet (screens that await I/O before buildUI()), polls
	 *  once per frame until it appears or a deadline elapses, then gives up
	 *  cleanly — never fires against nothing and never leaks the poll. */
	fadeIn(kind: TransitionKind, screen: TransitionTarget): void;
	/** Detach from the render engine. Call once at TUI teardown, before
	 *  renderer.destroy(). Idempotent. */
	dispose(): void;
}

/** Per-kind timing: push arrives with intent (outQuad, the longest), pop
 *  snaps back faster (outExpo — going back is cheaper than going forward),
 *  replace is a neutral swap (linear, the shortest). ~8-12 frames at 60fps —
 *  enough to read as continuous, short enough that a slow terminal degrades
 *  to a couple of visible steps rather than a stall. */
const TIMING: Record<TransitionKind, { duration: number; ease: string }> = {
	push: { duration: 140, ease: 'outQuad' },
	pop: { duration: 100, ease: 'outExpo' },
	replace: { duration: 90, ease: 'linear' },
};

/** How long fadeIn will keep polling for a not-yet-mounted root before
 *  giving up. Generous relative to real I/O (config load, history load) but
 *  bounded so a screen that never builds UI can't leak a frame callback
 *  forever. */
const MOUNT_POLL_DEADLINE_MS = 500;

/** Auto-enable reduce-motion over SSH: remote terminals round-trip every
 *  frame, so a 140ms fade becomes a smear of half-drawn screens. Checked at
 *  the point of use, not folded into the stored config value — the user's
 *  actual preference is left untouched. */
export function isRemoteSession(): boolean {
	return Boolean(process.env.SSH_CONNECTION || process.env.SSH_TTY || process.env.SSH_CLIENT);
}

/** No-op implementation used when motion is disabled (config or SSH). Never
 *  imports/touches the Timeline or engine — this is what makes "disabled"
 *  mean zero animation overhead, not a zero-duration animation. */
const NOOP_TRANSITIONS: Transitions = Object.freeze({
	fadeIn() {},
	dispose() {},
});

export function createTransitions(renderer: Renderer, enabled: boolean): Transitions {
	if (!enabled) return NOOP_TRANSITIONS;

	let attached = false;
	let timeline: Timeline | undefined;

	function ensureAttached(): Timeline {
		if (!attached) {
			engine.attach(renderer);
			attached = true;
		}
		// One reusable timeline for the module's lifetime — engine.attach()
		// is meant to be called once per app run, not per transition.
		timeline ??= createTimeline();
		return timeline;
	}

	return {
		fadeIn(kind, screen) {
			const tl = ensureAttached();
			const { duration, ease } = TIMING[kind];

			if (screen.root) {
				screen.root.opacity = 0;
				tl.add(screen.root, { opacity: 1, duration, ease: ease as never });
				tl.play();
				return;
			}

			// Root not mounted yet (screen awaits I/O before buildUI()). Poll
			// once per frame via the renderer's own frame callback — appending,
			// not replacing, so this never clobbers the workflow spinner or any
			// other registered callback — until the root appears or the
			// deadline elapses, whichever comes first.
			const deadline = Date.now() + MOUNT_POLL_DEADLINE_MS;
			const poll = async (): Promise<void> => {
				if (screen.root) {
					renderer.removeFrameCallback(poll);
					screen.root.opacity = 0;
					tl.add(screen.root, { opacity: 1, duration, ease: ease as never });
					tl.play();
					return;
				}
				if (Date.now() >= deadline) {
					renderer.removeFrameCallback(poll);
				}
			};
			renderer.setFrameCallback(poll);
		},
		dispose() {
			if (attached) {
				engine.detach();
				attached = false;
			}
		},
	};
}

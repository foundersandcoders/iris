/** ====== Layout Utilities ======
 * Spacing scale, version helper, and TUI header formatter.
 * `APP_VERSION` and `header()` import from package.json — single source of truth.
 * See `.claude/CLAUDE.md` § Version Management and `scripts/update-version.ts`.
 */
import packageJson from '../../../package.json';

/** Named spacing steps (terminal cell counts).
 *  Use for padding, gap, and vertical rhythm (blank-line spacers). */
export const spacing = {
	none: 0,
	xs: 1,
	sm: 2,
	md: 3,
	lg: 4,
	xl: 6,
} as const;

export type SpacingStep = keyof typeof spacing;

/** Resolve a named step or raw cell count to a number. */
export function space(step: SpacingStep | number): number {
	return typeof step === 'number' ? step : spacing[step];
}

/** App version sourced from package.json. */
export const APP_VERSION: string = packageJson.version;

/** Header line for the app shell and about screen (e.g. "Iris  v1.4.2").
 *  Returns a plain string — callers apply their own fg colour. */
export function header(title = 'Iris'): string {
	return `${title}  v${APP_VERSION}`;
}

/** |===================|| Glob Pattern Matching ||==================|
 *  | Shared glob-to-regex conversion for storage adapter list() filtering.
 *  | Escapes regex metacharacters and anchors the match so patterns like
 *  | '*.json' only match intended filenames (not 'foo.jsonx' etc).
 *  |=====================================================================|
 */

/** Escapes regex metacharacters, leaving `*` and `?` for glob translation. */
function escapeRegExpExceptGlobChars(pattern: string): string {
	return pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
}

/** Converts a glob pattern (`*`, `?`) into an anchored RegExp. */
export function globToRegExp(pattern: string): RegExp {
	const escaped = escapeRegExpExceptGlobChars(pattern).replace(/\*/g, '.*').replace(/\?/g, '.');
	return new RegExp(`^${escaped}$`);
}

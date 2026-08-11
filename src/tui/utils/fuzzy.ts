/** ====== Fuzzy Matching ======
 * Subsequence-based fuzzy match + rank, for the command palette (TR.D1).
 * Pure and renderer-free: no dependency on OpenTUI, directly unit-testable.
 */

/** Score a query against a target string as a case-insensitive subsequence
 *  match: every query character must appear in target, in order, but not
 *  necessarily contiguously. Returns null when the query doesn't match at
 *  all. Higher scores rank first; the formula rewards (in priority order):
 *  consecutive runs, matches at a word boundary (start of target or after
 *  a non-alphanumeric separator), and matches earlier in the string. */
export function fuzzyMatch(query: string, target: string): number | null {
	if (query === '') return 0;

	const q = query.toLowerCase();
	const t = target.toLowerCase();

	let score = 0;
	let targetIndex = 0;
	let consecutiveRun = 0;

	for (let queryIndex = 0; queryIndex < q.length; queryIndex++) {
		const char = q[queryIndex];
		const foundAt = t.indexOf(char, targetIndex);
		if (foundAt === -1) return null;

		const isConsecutive = foundAt === targetIndex;
		const isWordBoundary = foundAt === 0 || !/[a-z0-9]/.test(t[foundAt - 1]);

		consecutiveRun = isConsecutive ? consecutiveRun + 1 : 1;

		score += 1;
		score += consecutiveRun * 2; // reward runs, and reward them more as they grow
		if (isWordBoundary) score += 3;
		score -= foundAt * 0.1; // earlier matches rank slightly higher

		targetIndex = foundAt + 1;
	}

	return score;
}

/** Filter and rank items by fuzzy-matching `query` against `key(item)`.
 *  An empty query returns every item, in its original order (no ranking
 *  applied, there's nothing to rank against). Non-matching items are
 *  dropped; matches are sorted by descending score. */
export function fuzzyFilter<T>(query: string, items: T[], key: (item: T) => string): T[] {
	if (query === '') return [...items];

	const scored: { item: T; score: number }[] = [];
	for (const item of items) {
		const score = fuzzyMatch(query, key(item));
		if (score !== null) scored.push({ item, score });
	}

	scored.sort((a, b) => b.score - a.score);
	return scored.map((s) => s.item);
}

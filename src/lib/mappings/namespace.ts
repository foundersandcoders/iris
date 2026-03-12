/** |===================|| Namespace Utilities ||==================|
 *  | Utilities for working with ILR schema namespaces.
 *  | Extract collection year codes from namespace strings.
 *  |===============================================================|
 */

/**
 * Derive ILR collection year code from schema namespace.
 *
 * The namespace format is 'ESFA/ILR/YYYY-YY' where YYYY is the start year
 * and YY is the end year suffix. The collection year code is formed by
 * taking the last 2 digits of each.
 *
 * @param namespace - Schema namespace (e.g., 'ESFA/ILR/2025-26')
 * @returns Collection year code (e.g., '2526')
 * @throws Error if namespace format is invalid
 *
 * @example
 * deriveCollectionYear('ESFA/ILR/2025-26') // returns '2526'
 * deriveCollectionYear('ESFA/ILR/2024-25') // returns '2425'
 */
export function deriveCollectionYear(namespace: string): string {
	// Match the year pattern at the end: YYYY-YY
	const match = namespace.match(/(\d{4})-(\d{2})$/);

	if (!match) {
		throw new Error(
			`Cannot derive collection year from namespace: "${namespace}". ` +
				`Expected format: "ESFA/ILR/YYYY-YY"`
		);
	}

	// Extract year components
	const startYear = match[1]; // e.g., '2025'
	const endYearSuffix = match[2]; // e.g., '26'

	// Take last 2 digits of start year + end year suffix
	const startYearSuffix = startYear.slice(2); // '25'

	return `${startYearSuffix}${endYearSuffix}`; // '2526'
}

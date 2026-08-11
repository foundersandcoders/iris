/** ====== Schema Field Row Grouping Test Fixtures ======
 * Representative leaf paths shaped like the real ILR schema (see
 * docs/schemas/schemafile25.xsd via SchemaRegistry), trimmed to the handful
 * of ancestor levels TR.D3's grouping needs to prove out: a container with
 * its own direct fields, one level of nested child container, and one
 * doubly-nested grandchild container.
 */

/** Learner has direct fields, a nested LearnerHE (which itself nests
 *  LearnerHEFinancialSupport), and a sibling nested LearningDelivery. Mirrors
 *  the real schema's shape where a container's own fields and its
 *  descendants' fields interleave in path-string sort order (the bug the
 *  old `leafPaths.sort()` had). */
export const mixedDepthPaths = [
	'Message.Learner.ALSCost',
	'Message.Learner.Sex',
	'Message.Learner.DOB',
	'Message.Learner.LearnerHE.UCASPERID',
	'Message.Learner.LearnerHE.LearnerHEFinancialSupport.FinTypeCode',
	'Message.Learner.LearnerHE.LearnerHEFinancialSupport.FinAmount',
	'Message.Learner.LearningDelivery.AimType',
];

/** Expected group path ordering: parents before children, alphabetical among
 *  siblings at the same depth. */
export const expectedGroupOrder = [
	'Learner',
	'Learner.LearnerHE',
	'Learner.LearningDelivery',
	'Learner.LearnerHE.LearnerHEFinancialSupport',
];

/** Depths matching expectedGroupOrder, 0-indexed relative to the root prefix. */
export const expectedGroupDepths = [0, 1, 1, 2];

/** A filtered path list (e.g. after a search narrows to one container) with
 *  every path under a single doubly-nested group. */
export const singleNestedGroupPaths = [
	'Message.Learner.LearningDelivery.LearningDeliveryHE.NetFeeCost',
	'Message.Learner.LearningDelivery.LearningDeliveryHE.StudentFeeRegimeMet',
];

/** Sibling paths deliberately out of alphabetical order, to prove
 *  within-group field sorting. */
export const unsortedSiblingPaths = [
	'Message.Learner.Sex',
	'Message.Learner.ALSCost',
	'Message.Learner.DOB',
];

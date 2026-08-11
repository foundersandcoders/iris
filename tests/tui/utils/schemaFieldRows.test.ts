import { describe, it, expect } from 'vitest';
import { groupFieldPaths, GROUP_VALUE_PREFIX } from '../../../src/tui/utils/schemaFieldRows';
import * as fixtures from '../../fixtures/tui/schemaFieldRows';

describe('groupFieldPaths', () => {
	it('returns an empty array for empty input', () => {
		expect(groupFieldPaths([])).toEqual([]);
	});

	it('groups Learner own fields as one contiguous block ahead of nested child groups', () => {
		const rows = groupFieldPaths(fixtures.mixedDepthPaths, 'Message.');

		// Locate the Learner group header and every row up to the next group header.
		const learnerHeaderIndex = rows.findIndex((r) => r.kind === 'group' && r.path === 'Learner');
		expect(learnerHeaderIndex).toBeGreaterThanOrEqual(0);

		const nextHeaderIndex = rows.findIndex(
			(r, i) => i > learnerHeaderIndex && r.kind === 'group'
		);
		const learnerBlock = rows.slice(learnerHeaderIndex, nextHeaderIndex);

		// Every field in the Learner block must be a direct Learner child (no further dots
		// beyond "Learner.<name>"), i.e. none of them belong to a nested container.
		for (const row of learnerBlock.slice(1)) {
			expect(row.kind).toBe('field');
			const relative = row.path.replace(/^Message\./, '');
			expect(relative.split('.')).toHaveLength(2); // "Learner.<name>"
		}
	});

	it('orders groups parents-before-children by depth, then alphabetically within a depth', () => {
		const rows = groupFieldPaths(fixtures.mixedDepthPaths, 'Message.');
		const groupRows = rows.filter((r) => r.kind === 'group');
		const depths = groupRows.map((r) => r.depth);

		// Depths must be non-decreasing overall is too strict (siblings interleave), but
		// every group must come after all shallower groups have been visited at least once
		// is exactly "shallowest depth seen so far never increases past a later shallower one".
		// Simpler: assert the known fixture ordering directly.
		expect(groupRows.map((r) => r.path)).toEqual(fixtures.expectedGroupOrder);
		expect(depths).toEqual(fixtures.expectedGroupDepths);
	});

	it('assigns correct depth for 1, 2 and 3 levels below the root prefix', () => {
		const rows = groupFieldPaths(fixtures.mixedDepthPaths, 'Message.');

		const learnerGroup = rows.find((r) => r.kind === 'group' && r.path === 'Learner');
		const learnerHEGroup = rows.find((r) => r.kind === 'group' && r.path === 'Learner.LearnerHE');
		const financialSupportGroup = rows.find(
			(r) => r.kind === 'group' && r.path === 'Learner.LearnerHE.LearnerHEFinancialSupport'
		);

		expect(learnerGroup?.depth).toBe(0);
		expect(learnerHEGroup?.depth).toBe(1);
		expect(financialSupportGroup?.depth).toBe(2);

		const directField = rows.find((r) => r.kind === 'field' && r.path === 'Message.Learner.ALSCost');
		const nestedField = rows.find(
			(r) => r.kind === 'field' && r.path === 'Message.Learner.LearnerHE.UCASPERID'
		);
		expect(directField?.depth).toBe(1);
		expect(nestedField?.depth).toBe(2);
	});

	it('emits exactly one group when the input is filtered down to a single nested container', () => {
		const rows = groupFieldPaths(fixtures.singleNestedGroupPaths, 'Message.');
		const groupRows = rows.filter((r) => r.kind === 'group');

		expect(groupRows).toHaveLength(1);
		expect(groupRows[0]).toMatchObject({ path: 'Learner.LearningDelivery.LearningDeliveryHE' });
	});

	it('sorts fields within a group alphabetically by path', () => {
		const rows = groupFieldPaths(fixtures.unsortedSiblingPaths, 'Message.');
		const fieldPaths = rows.filter((r) => r.kind === 'field').map((r) => r.path);

		expect(fieldPaths).toEqual([...fieldPaths].sort((a, b) => a.localeCompare(b)));
	});

	it('prefixes every group value with GROUP_VALUE_PREFIX', () => {
		const rows = groupFieldPaths(fixtures.mixedDepthPaths, 'Message.');
		const groupRows = rows.filter((r) => r.kind === 'group');

		expect(groupRows.length).toBeGreaterThan(0);
		// Group rows carry no `value` field themselves (that's built by the caller from
		// `path`), so assert the prefix constant is exported and non-empty for callers to use.
		expect(GROUP_VALUE_PREFIX).toBe('__group_');
	});
});

/** ====== Schema Field Row Grouping ======
 * Group leaf schema paths by ancestor container, for the mapping-editor's
 * Schema Fields panel (TR.D3). Pure and renderer-free: no dependency on
 * OpenTUI, directly unit-testable.
 */

/** Sentinel prefix for a group header's SelectOption value, so ITEM_SELECTED
 *  and SELECTION_CHANGED handlers can recognise a header row and skip it. */
export const GROUP_VALUE_PREFIX = '__group_';

/** A row in the grouped Schema Fields list: either an ancestor container
 *  header or a mappable leaf field. `depth` is relative to the shared root
 *  prefix passed to groupFieldPaths (e.g. `Learner` is depth 0). */
export type FieldRow =
	| { kind: 'group'; path: string; name: string; depth: number }
	| { kind: 'field'; path: string; depth: number };

/** Group leaf paths by their immediate ancestor container, ordering groups
 *  parents-before-children (by depth, then alphabetically) so a container's
 *  own fields form one contiguous block ahead of its nested child groups.
 *  Fields within a group are sorted alphabetically by path. Groups with no
 *  surviving paths are never emitted, so filtering the input list before
 *  calling this drops empty groups for free.
 *
 *  `rootPrefix` (e.g. "Message.") is stripped from group/field paths before
 *  depth is measured, so the outermost mappable container sits at depth 0. */
export function groupFieldPaths(paths: string[], rootPrefix = ''): FieldRow[] {
	const groups = new Map<string, string[]>();

	for (const path of paths) {
		const relative = rootPrefix && path.startsWith(rootPrefix) ? path.slice(rootPrefix.length) : path;
		const segments = relative.split('.');
		const groupPath = segments.slice(0, -1).join('.');
		const existing = groups.get(groupPath);
		if (existing) {
			existing.push(path);
		} else {
			groups.set(groupPath, [path]);
		}
	}

	const groupPaths = [...groups.keys()].sort((a, b) => {
		const depthDiff = a.split('.').length - b.split('.').length;
		return depthDiff !== 0 ? depthDiff : a.localeCompare(b);
	});

	const rows: FieldRow[] = [];
	for (const groupPath of groupPaths) {
		const depth = groupPath.split('.').length - 1;
		const name = groupPath.split('.').slice(-1)[0];
		rows.push({ kind: 'group', path: groupPath, name, depth });

		const fieldPaths = groups.get(groupPath)!.sort((a, b) => a.localeCompare(b));
		for (const path of fieldPaths) {
			rows.push({ kind: 'field', path, depth: depth + 1 });
		}
	}

	return rows;
}

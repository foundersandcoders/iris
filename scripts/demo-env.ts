#!/usr/bin/env bun
/** |===================|| Demo Environment Helper ||==================|
 *  | Pre-seeds ~/.iris/config.json so VHS demo tapes land the file
 *  | picker directly on repo sample data (deterministic navigation),
 *  | backing up and restoring any real config around the recording.
 *  |
 *  | outputDir doubles as both convert's write destination and the
 *  | validate/check picker's starting directory, so `setup convert`
 *  | points it at a disposable ~/.iris/demo-output/ scratch dir instead
 *  | of the tracked docs/data/iris samples that validate/check read —
 *  | `setup` (no target) points it at docs/data/iris directly, which is
 *  | safe there since those tapes never write.
 *  |=====================================================================|
 */

import { existsSync, mkdirSync, writeFileSync, renameSync, rmSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { DEFAULT_CONFIG } from '../src/lib/types/configTypes';

const REPO_ROOT = join(import.meta.dirname, '..');
const IRIS_DIR = join(homedir(), '.iris');
const CONFIG_PATH = join(IRIS_DIR, 'config.json');
const BACKUP_PATH = join(IRIS_DIR, 'config.json.demobak');
const DEMO_OUTPUT_DIR = join(IRIS_DIR, 'demo-output');

// The tapes navigate the file picker by row position (Down/Enter), not by
// name — the picker has no type-to-filter. Row order is deterministic
// (dirs-first, then case-insensitive alpha; see file-picker.ts's
// loadDirectory()), so as long as each sample dir holds exactly these
// files, the tapes land on the row they expect. Adding, removing, or
// renaming a sample file shifts the rows and silently records the wrong
// thing — assertSampleFiles() catches that before any config is written.
const EXPECTED_SAMPLES: Record<string, string[]> = {
	[join(REPO_ROOT, 'docs', 'data', 'airtable')]: ['25-26 Export.csv', '25-26 Tweak.csv'],
	[join(REPO_ROOT, 'docs', 'data', 'iris')]: [
		'ILR-10085696-2526-20260204-154809-01.xml',
		'ILR-99999999-2526-20250108-094401.xml',
	],
};

/** Mirrors file-picker.ts's dotfile filtering + dirs-first/alpha sort, restricted to files. */
function assertSampleFiles(dir: string): void {
	const expected = EXPECTED_SAMPLES[dir];
	const actual = readdirSync(dir, { withFileTypes: true })
		.filter((d) => d.isFile() && !d.name.startsWith('.'))
		.map((d) => d.name)
		.sort((a, b) => a.localeCompare(b));

	const matches = actual.length === expected.length && actual.every((name, i) => name === expected[i]);
	if (!matches) {
		console.error(
			`${dir} doesn't match what the demo tapes expect — a tape would silently record the wrong file.\n` +
				`  Expected: ${JSON.stringify(expected)}\n` +
				`  Found:    ${JSON.stringify(actual)}\n` +
				'Update EXPECTED_SAMPLES in scripts/demo-env.ts to match, or revert the sample-data change.'
		);
		process.exit(1);
	}
}

const command = process.argv[2];
const target = process.argv[3];

if (command === 'setup') {
	mkdirSync(IRIS_DIR, { recursive: true });

	if (existsSync(BACKUP_PATH)) {
		// setup only ever creates .demobak after moving the real config aside,
		// so a leftover one means a prior run crashed before teardown — the
		// real config is sitting safely in .demobak. Recover it rather than
		// forcing a manual mv.
		console.log(`Recovering ${BACKUP_PATH} from a demo recording that didn't tear down cleanly.`);
		if (existsSync(CONFIG_PATH)) {
			rmSync(CONFIG_PATH);
		}
		renameSync(BACKUP_PATH, CONFIG_PATH);
	}

	let outputDir: string;
	if (target === 'convert') {
		assertSampleFiles(join(REPO_ROOT, 'docs', 'data', 'airtable'));

		// Scratch dir for convert's write output — never the repo's tracked
		// docs/data/iris samples, which validate/check read from.
		if (existsSync(DEMO_OUTPUT_DIR)) {
			rmSync(DEMO_OUTPUT_DIR, { recursive: true });
		}
		mkdirSync(DEMO_OUTPUT_DIR, { recursive: true });
		outputDir = DEMO_OUTPUT_DIR;
	} else {
		assertSampleFiles(join(REPO_ROOT, 'docs', 'data', 'iris'));

		outputDir = join(REPO_ROOT, 'docs', 'data', 'iris');
	}

	if (existsSync(CONFIG_PATH)) {
		renameSync(CONFIG_PATH, BACKUP_PATH);
	}

	const demoConfig = {
		...DEFAULT_CONFIG,
		csvInputDir: join(REPO_ROOT, 'docs', 'data', 'airtable'),
		outputDir,
	};
	writeFileSync(CONFIG_PATH, JSON.stringify(demoConfig, null, 2) + '\n');
	console.log(`Demo config written to ${CONFIG_PATH}`);
} else if (command === 'teardown') {
	if (existsSync(BACKUP_PATH)) {
		if (existsSync(CONFIG_PATH)) {
			rmSync(CONFIG_PATH);
		}
		renameSync(BACKUP_PATH, CONFIG_PATH);
		console.log('Restored original config.json');
	} else if (existsSync(CONFIG_PATH)) {
		rmSync(CONFIG_PATH);
		console.log('Removed demo config.json (no prior config existed)');
	}

	if (existsSync(DEMO_OUTPUT_DIR)) {
		rmSync(DEMO_OUTPUT_DIR, { recursive: true });
	}
} else {
	console.error('Usage: bun run scripts/demo-env.ts <setup [convert]|teardown>');
	process.exit(1);
}

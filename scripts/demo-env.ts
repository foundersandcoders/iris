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

import { existsSync, mkdirSync, writeFileSync, renameSync, rmSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { DEFAULT_CONFIG } from '../src/lib/types/configTypes';

const REPO_ROOT = join(dirname(new URL(import.meta.url).pathname), '..');
const IRIS_DIR = join(homedir(), '.iris');
const CONFIG_PATH = join(IRIS_DIR, 'config.json');
const BACKUP_PATH = join(IRIS_DIR, 'config.json.demobak');
const DEMO_OUTPUT_DIR = join(IRIS_DIR, 'demo-output');

const command = process.argv[2];
const target = process.argv[3];

if (command === 'setup') {
	mkdirSync(IRIS_DIR, { recursive: true });

	if (existsSync(BACKUP_PATH)) {
		console.error(
			`${BACKUP_PATH} already exists — a previous demo recording didn't tear down cleanly.\n` +
				'Resolve manually before recording again: restore it (mv the .demobak over config.json) or remove it if it is stale.'
		);
		process.exit(1);
	}

	if (existsSync(CONFIG_PATH)) {
		renameSync(CONFIG_PATH, BACKUP_PATH);
	}

	let outputDir: string;
	if (target === 'convert') {
		// Scratch dir for convert's write output — never the repo's tracked
		// docs/data/iris samples, which validate/check read from.
		if (existsSync(DEMO_OUTPUT_DIR)) {
			rmSync(DEMO_OUTPUT_DIR, { recursive: true });
		}
		mkdirSync(DEMO_OUTPUT_DIR, { recursive: true });
		outputDir = DEMO_OUTPUT_DIR;
	} else {
		outputDir = join(REPO_ROOT, 'docs', 'data', 'iris');
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

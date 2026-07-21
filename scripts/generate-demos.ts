#!/usr/bin/env bun
/** |===================|| Demo Recording Script ||==================|
 *  | Runs VHS over every tape in tapes/ to (re)generate the terminal
 *  | recordings embedded in the README and docs. Requires the VHS
 *  | toolchain (vhs, ttyd, ffmpeg) on PATH.
 *  |====================================================================|
 */

import { parseArgs } from 'util';
import { Glob } from 'bun';

const { values } = parseArgs({
	args: process.argv.slice(2),
	options: {
		help: {
			type: 'boolean',
			short: 'h',
		},
	},
});

if (values.help) {
	console.log(`
Usage: bun run demos [options]

Renders every tapes/*.tape file with VHS, skipping shared includes
(files prefixed with an underscore, e.g. tapes/_common.tape).

Options:
  -h, --help  Show this help message

Requires:
  vhs, ttyd, ffmpeg on PATH — see README.md#demo-recordings for install steps.
	`);
	process.exit(0);
}

const REQUIRED_BINARIES = ['vhs', 'ttyd', 'ffmpeg'];

const missing = REQUIRED_BINARIES.filter((bin) => !Bun.which(bin));

if (missing.length > 0) {
	console.error(`Missing required binaries: ${missing.join(', ')}`);
	console.error('\nInstall the VHS toolchain with Homebrew:');
	console.error('  brew install vhs ttyd ffmpeg');
	console.error('\nSee https://github.com/charmbracelet/vhs for other platforms.');
	process.exit(1);
}

const glob = new Glob('tapes/*.tape');
const tapePaths = [...glob.scanSync('.')]
	.filter((path) => !path.split('/').pop()?.startsWith('_'))
	.sort();

if (tapePaths.length === 0) {
	console.log('No tapes found in tapes/ (files prefixed with "_" are shared includes, not recordings).');
	process.exit(0);
}

console.log(`Rendering ${tapePaths.length} tape${tapePaths.length === 1 ? '' : 's'}...\n`);

const failures: string[] = [];

for (const tapePath of tapePaths) {
	console.log(`→ ${tapePath}`);

	const proc = Bun.spawn(['vhs', tapePath], {
		stdout: 'inherit',
		stderr: 'inherit',
	});
	await proc.exited;

	if (proc.exitCode === 0) {
		console.log(`✓ ${tapePath}\n`);
	} else {
		console.error(`✗ ${tapePath} (exit ${proc.exitCode})\n`);
		failures.push(tapePath);
	}
}

if (failures.length > 0) {
	console.error(`Failed: ${failures.join(', ')}`);
	process.exit(1);
}

console.log('All demo recordings rendered successfully.');

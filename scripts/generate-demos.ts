#!/usr/bin/env bun
/** |===================|| Demo Recording Script ||==================|
 *  | Runs VHS over every tape in tapes/ to (re)generate the terminal
 *  | recordings embedded in the README and docs. Requires the VHS
 *  | toolchain (vhs, ttyd, ffmpeg) on PATH.
 *  |====================================================================|
 */

import { parseArgs } from 'util';
import { Glob } from 'bun';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const BUNDLED_FONT = join(import.meta.dirname, '..', 'assets', 'fonts', 'FiraCode-Regular.ttf');

/** VHS renders via headless Chrome and resolves FontFamily against whatever
 *  fonts are OS-registered — an uninstalled font silently falls back to a
 *  wide, non-monospace substitute. Install the bundled Fira Code so every
 *  machine that runs `bun run demos` renders identically, without requiring
 *  a manual `brew install --cask font-fira-code` step first. */
function fontDestination(): string {
	if (process.platform === 'darwin') {
		return join(homedir(), 'Library', 'Fonts', 'FiraCode-Regular.ttf');
	}
	if (process.platform === 'win32') {
		// Copying the .ttf into the per-user Fonts folder alone doesn't register
		// it — Windows also requires a matching HKCU\...\Fonts registry value
		// before GDI/DirectWrite (and so headless Chrome, which VHS renders
		// through) will enumerate it. Automating registry writes from here isn't
		// worth the risk with no Windows machine to verify it against, so fail
		// clearly with manual install steps rather than silently no-op.
		throw new Error(
			'Automatic font installation is not supported on Windows. ' +
				'Install Fira Code manually: double-click assets/fonts/FiraCode-Regular.ttf and choose "Install", then re-run `bun run demos`.'
		);
	}
	return join(homedir(), '.local', 'share', 'fonts', 'FiraCode-Regular.ttf');
}

/** Bytes must match the bundled font exactly — a same-named-but-different
 *  file at the destination (or an `fc-list` hit for an unrelated font that
 *  merely shares "Fira Code" in its family name) must not short-circuit the
 *  install, or the recording silently stops being reproducible across
 *  machines. */
function isBundledFontInstalled(dest: string): boolean {
	if (!existsSync(dest)) return false;
	return Bun.file(dest).size === Bun.file(BUNDLED_FONT).size;
}

function ensureFontInstalled(): void {
	const dest = fontDestination();

	if (isBundledFontInstalled(dest)) {
		return;
	}

	mkdirSync(join(dest, '..'), { recursive: true });
	copyFileSync(BUNDLED_FONT, dest);
	console.log(`Installed bundled font: ${dest}`);

	if (process.platform === 'linux' && Bun.which('fc-cache')) {
		Bun.spawnSync(['fc-cache', '-f']);
	}
}

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

ensureFontInstalled();

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

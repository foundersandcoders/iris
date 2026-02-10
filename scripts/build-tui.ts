#!/usr/bin/env bun
/** |===================|| TUI Binary Build Script ||==================|
 *  | Compiles Iris TUI into standalone executable using Bun's bundler.
 *  | Outputs to dist/ with platform-specific naming.
 *  |===================================================================|
 */

import { parseArgs } from 'util';
import { stat, rename } from 'fs/promises';

const { values } = parseArgs({
	args: process.argv.slice(2),
	options: {
		target: {
			type: 'string',
			short: 't',
			default: `${process.platform}-${process.arch}`,
		},
		help: {
			type: 'boolean',
			short: 'h',
		},
	},
});

if (values.help) {
	console.log(`
Usage: bun run scripts/build-tui.ts [options]

Options:
  -t, --target <platform-arch>  Target platform (e.g. darwin-arm64, windows-x64)
  -h, --help                    Show this help message

Examples:
  bun run scripts/build-tui.ts                    # Build for current platform
  bun run scripts/build-tui.ts --target darwin-arm64
  bun run scripts/build-tui.ts --target windows-x64
	`);
	process.exit(0);
}

const target = values.target as string;
const bunTarget = target.startsWith('bun-') ? target : `bun-${target}`;
const isWindows = target.startsWith('windows');
const extension = isWindows ? '.exe' : '';
const outputName = `iris-${target}${extension}`;
const outputPath = `./dist/${outputName}`;

console.log(`Building Iris TUI for ${target}...`);

try {
	const buildResult = await Bun.build({
		entrypoints: ['./src/cli.ts'],
		outdir: './dist',
		target: 'bun',
		compile: {
			target: bunTarget as 'bun-darwin-arm64' | 'bun-darwin-x64' | 'bun-windows-x64' | 'bun-linux-x64' | 'bun-linux-arm64',
			outputName: outputName.replace(extension, ''),
		},
		minify: false, // Keep readable for debugging
		sourcemap: 'none',
	});

	if (!buildResult.success) {
		console.error('Build failed:');
		for (const log of buildResult.logs) {
			console.error(`  ${log.message}`);
		}
		process.exit(1);
	}

	// Bun creates the binary with the entrypoint name — rename it to our desired name
	const bunOutputPath = './dist/cli' + (isWindows ? '.exe' : '');
	await rename(bunOutputPath, outputPath);

	// Check output size
	const fileStats = await stat(outputPath);
	const sizeMB = (fileStats.size / 1024 / 1024).toFixed(2);

	console.log(`✓ Build successful: ${outputPath}`);
	console.log(`  Size: ${sizeMB} MB`);

	// macOS code signing (ad-hoc, suppresses Gatekeeper warnings)
	if (process.platform === 'darwin' && !isWindows) {
		console.log('Signing binary...');
		const signProc = Bun.spawn(['codesign', '--force', '--sign', '-', outputPath], {
			stdout: 'inherit',
			stderr: 'inherit',
		});
		await signProc.exited;

		if (signProc.exitCode === 0) {
			console.log('✓ Binary signed');
		} else {
			console.warn('⚠ Code signing failed (non-fatal)');
		}
	}

	console.log(`\nTo test:\n  ${outputPath} --help`);
} catch (error) {
	console.error('Build error:', error);
	process.exit(1);
}

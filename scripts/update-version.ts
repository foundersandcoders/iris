#!/usr/bin/env bun
/** |===================|| Version Updater ||==================|
 *  | Updates version across all project files
 *  | Single source of truth: package.json
 *  |==========================================================|
 */

import { readFileSync, writeFileSync } from 'fs';
import { exit } from 'process';

const newVersion = process.argv[2];

if (!newVersion) {
	console.error('Usage: bun run scripts/update-version.ts <version>');
	console.error('Example: bun run scripts/update-version.ts 1.5.0');
	exit(1);
}

// Validate semver format
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
	console.error(`Error: "${newVersion}" is not a valid semantic version`);
	console.error('Expected format: X.Y.Z (e.g., 1.5.0)');
	exit(1);
}

console.log(`Updating all files to v${newVersion}...\n`);

try {
	// Update package.json
	const pkgPath = 'package.json';
	const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
	pkg.version = newVersion;
	writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
	console.log(`✓ Updated ${pkgPath}`);

	// Update Cargo.toml
	const cargoPath = 'src-tauri/Cargo.toml';
	let cargo = readFileSync(cargoPath, 'utf-8');
	cargo = cargo.replace(/^version = ".*"$/m, `version = "${newVersion}"`);
	writeFileSync(cargoPath, cargo);
	console.log(`✓ Updated ${cargoPath}`);

	// Update tauri.conf.json
	const tauriPath = 'src-tauri/tauri.conf.json';
	const tauri = JSON.parse(readFileSync(tauriPath, 'utf-8'));
	tauri.version = newVersion;
	writeFileSync(tauriPath, JSON.stringify(tauri, null, 2) + '\n');
	console.log(`✓ Updated ${tauriPath}`);

	// Update README.md
	const readmePath = 'README.md';
	let readme = readFileSync(readmePath, 'utf-8');
	readme = readme.replace(/^# Iris `v.*`$/m, `# Iris \`v${newVersion}\``);
	writeFileSync(readmePath, readme);
	console.log(`✓ Updated ${readmePath}`);

	console.log(`\n✓ All files updated to v${newVersion}`);
	console.log('\nNote: layout.ts and config.ts automatically pull from package.json');
} catch (error) {
	console.error(`\nError updating files: ${error}`);
	exit(1);
}

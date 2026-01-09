#!/usr/bin/env bun

/**
 * Iris CLI - ILR Toolkit Command Line Interface
 *
 * Usage:
 *   iris <command> [options]
 *
 * Commands:
 *   convert <csv-file>    Convert CSV to ILR XML
 *   validate <xml-file>   Validate ILR XML file
 *   check                 Run cross-submission consistency checks
 *   help                  Show this help message
 */

const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
	console.log(`
Iris CLI - ILR Toolkit

Usage:
  iris <command> [options]

Commands:
  convert <csv-file>    Convert CSV to ILR XML
  validate <xml-file>   Validate ILR XML file
  check                 Run cross-submission consistency checks
  help                  Show this help message

Version: 0.1.0
`);
}

function main() {
	if (!command || command === 'help' || command === '--help' || command === '-h') {
		showHelp();
		process.exit(0);
	}

	switch (command) {
		case 'convert':
			console.log('Convert command - not yet implemented');
			break;
		case 'validate':
			console.log('Validate command - not yet implemented');
			break;
		case 'check':
			console.log('Check command - not yet implemented');
			break;
		default:
			console.error(`Unknown command: ${command}`);
			console.log('Run "iris help" for usage information');
			process.exit(1);
	}
}

main();

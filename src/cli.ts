/**
  * CLI Entry Point
  * Routes to TUI (default) or direct commands
  */
import { TUI } from './tui/app';

const args = process.argv.slice(2);
const command = args[0];

// No arguments = Launch TUI
if (!command) {
  const tui = new TUI();
  await tui.start();
  process.exit(0);
}

// Direct commands (existing implementation)
function commandBye() {
  console.log('Bye!');
  process.exit(0);
}

function commandConvert() {
  console.group('=== Iris Convert ===');
  console.log('Convert command not yet implemented');
  console.groupEnd();
}

function commandCheck() {
  console.group('=== Iris Check ===');
  console.log('Check command not yet implemented');
  console.groupEnd();
}

function commandHelp() {
  console.group('=== Iris Help ===');
  console.group('Usage:');
  console.log('iris              Launch interactive TUI (default)');
  console.log('iris <command>    Run direct command');
  console.groupEnd();
  console.log('');
  console.group('Commands:');
  console.log('convert <csv-file>    Convert CSV to ILR XML');
  console.log('validate <xml-file>   Validate ILR XML file');
  console.log('check                 Run cross-submission checks');
  console.log('help                  Show this help message');
  console.groupEnd();
  console.groupEnd();
}

function commandValidate() {
  console.group('=== Iris Validate ===');
  console.log('Validate command not yet implemented');
  console.groupEnd();
}

async function commandSign() {
  console.group('=== Iris Sign ===');
  const defaultPath = 'src-tauri/target/release/bundle/macos/Iris.app';
  const appPath = args[1] || defaultPath;
  console.log(`Signing: ${appPath}`);
  console.log('Type: Ad-hoc (development only)');
  console.groupEnd();

  try {
    // Check if app exists
    const appExists = await Bun.file(appPath).exists();
    if (!appExists) {
      console.error(`Error: App not found at ${appPath}`);
      console.log(`Hint: Run 'bun tauri:build' first`);
      console.groupEnd();
      return;
    }

    // Run codesign
    const proc = Bun.spawn([
      'codesign',
      '--deep',
      '--force',
      '--verify',
      '--verbose',
      '--sign',
      '-',
      appPath
    ], {
      stdout: 'pipe',
      stderr: 'pipe'
    });

    const output = await new Response(proc.stdout).text();
    const errors = await new Response(proc.stderr).text();

    await proc.exited;

    if (proc.exitCode === 0) {
      console.log(`✓ Successfully signed ${appPath}`);
      if (output) console.log(output);
      if (errors) console.log(errors); // codesign outputs to stderr even on success
    } else {
      console.error(`✗ Signing failed (exit code ${proc.exitCode})`);
      if (errors) console.error(errors);
    }
  } catch (error) {
    console.error(`Error during signing:`, error);
    console.log(``);
    console.log(`Note: codesign is only available on macOS`);
  }

  console.groupEnd(); // Sign
}

switch (command) {
  case 'bye':
    commandBye();
    break;
  case 'check':
    commandCheck();
    break;
  case 'convert':
    commandConvert();
    break;
  case 'help':
    commandHelp();
    break;
  case 'sign':
    await commandSign();
    break;
  case 'validate':
    commandValidate();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.log('Run "iris help" for usage information');
    process.exit(1);
}
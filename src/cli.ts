#!/usr/bin/env bun

/**
 * Dev Options
 * - helpType: "dir" | "list" | "nested" | "table"
 */
const dev = { helpType: "nested" };

const menuCommands = {
  core: {
    convert: { argument: `<csv-file>`, description: `Convert CSV to ILR XML` },
    validate: { argument: `<xml-file>`, description: `Validate ILR XML file` }
  },
  advanced: {
    check: { argument: ``, description: `Run cross-submission consistency checks` }
  },
  build: {
    sign: { argument: `[app-path]`, description: `Ad-hoc sign macOS app (development only)` }
  },
  system: {
    help: { argument: ``, description: `Show this help message` },
    bye: { argument: ``, description: `Quit Iris` }
  }
}

const args = process.argv.slice(2);
const command = args[0];

function appStart() {
  console.group(`====== Iris • ILR Submission Toolkit ======`);
  console.group(`Release Details`);
  console.log(`Version: 0.1.0`);
  console.groupEnd();
  
  console.log(``);
  
  console.log(`|=|==================================|=|`);
  console.log(`|=| Hi Jess! Try running "iris help" |=|`);
  console.log(`|=|==================================|=|`);
}

function appEnd() {
  console.groupEnd();
  // console.log(`===========================================`);
  process.exit(0);
}

function catchInvalid() {
  console.group(`=== User Ignorance Error ===`); // Check
  console.log(`I'm sorry Jess, I can't do that.`);
  console.error(`${command} is not a command`);
  console.info('Run "iris help" for usage information');
  console.groupEnd();
}

function commandBye() {
  console.log(`Bye!`)
  appEnd();
}

function commandConvert() {
  console.group(`=== Iris Convert ===`); // Convert
  console.log(`Convert command not yet implemented`)
  console.groupEnd(); // Convert
}

function commandCheck() {
  console.group(`=== Iris Check ===`); // Check
  console.log(`Check command not yet implemented`)
  console.groupEnd(); // Check
}

function commandHelp() {
  console.group(`=== Iris Help ===`); // Help

  console.group(`Usage:`); // Help > Usage
  console.log(`iris <command> [options]`);
  console.groupEnd();
  
  console.log(``);
  
  const display = dev.helpType; 
  const menu = menuCommands;
  
  console.group(`Commands:`); // Help > Commands
  if (display == "dir") {
    console.dir(menu.core);
    console.dir(menu.advanced);
    console.dir(menu.system);
  } else if (display == "list") {
    console.log(`- convert <csv-file>    Convert CSV to ILR XML`);
    console.log(`- validate <xml-file>   Validate ILR XML file`);
    console.log(`- check                 Run cross-submission consistency checks`);
    console.log(`- sign [app-path]       Ad-hoc sign macOS app (development only)`);
    console.log(`- help                  Show this help message`);
    console.log(`- bye                   Quit Iris`);
  } else if (display == "nested") {
    console.group(`CORE`); // Help > Commands > Core
    console.log(`convert <csv-file>    Convert CSV to ILR XML`);
    console.log(`validate <xml-file>   Validate ILR XML file`);
    console.groupEnd();

    console.group(`ADVANCED`); // Help > Commands > Advanced
    console.log(`check                 Run cross-submission consistency checks`);
    console.groupEnd();

    console.group(`BUILD`); // Help > Commands > Build
    console.log(`sign [app-path]       Ad-hoc sign macOS app (development only)`);
    console.groupEnd();

    console.group(`SYSTEM`); // Help > Commands > System
    console.log(`help                  Show this help message`);
    console.log(`bye                   Quit Iris`);
    console.groupEnd();
  } else if (display == "table") {
    console.group(`CORE`); // Help > Commands > Core
    console.table(menu.core)
    console.groupEnd(); // Help > Commands > Core

    console.group(`ADVANCED`); // Help > Commands > Advanced
    console.table(menu.advanced)
    console.groupEnd(); // Help > Commands > Advanced

    console.group(`BUILD`); // Help > Commands > Build
    console.table(menu.build)
    console.groupEnd(); // Help > Commands > Build

    console.group(`SYSTEM`); // Help > Commands > System
    console.table(menu.system)
    console.groupEnd(); // Help > Commands > System
  }
  console.groupEnd(); // Help > Commands

  console.groupEnd(); // Help
}

function commandValidate() {
  console.group(`=== Iris Validate ===`); // Validate
  console.log(`Validate command not yet implemented`)
  console.groupEnd(); // Validate
}

async function commandSign() {
  console.group(`=== Iris Sign ===`); // Sign

  const defaultPath = `src-tauri/target/release/bundle/macos/Iris.app`;
  const appPath = args[1] || defaultPath;

  console.log(`Signing: ${appPath}`);
  console.log(`Type: Ad-hoc (development only)`);
  console.log(``);

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

function extractCommandBase(command: string | undefined): string | void {
  if (command) return command.split(" ")[0];
  return;
}

async function main() {
  console.clear();

  const base = extractCommandBase(command);

  if (!base) {
    appStart();
  } else {
    switch (base) {
      default:
        catchInvalid();
        break;
      case "bye":
        commandBye();
        break;
  		case 'check':
        commandCheck();
   			break;
  		case 'convert':
        commandConvert();
        break;
      case "help":
        commandHelp();
        break;
      case 'sign':
        await commandSign();
        break;
  		case 'validate':
        commandValidate();
        break;
   	}
  }

  appEnd();
  process.exit(0); // Backstop
}



main();

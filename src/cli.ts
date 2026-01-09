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

function extractCommandBase(command: string | undefined): string | void {
  if (command) return command.split(" ")[0];
  return;
}

function main() {
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
  		case 'validate':
        commandValidate();
        break;
   	}
  }
  
  appEnd();
  process.exit(0); // Backstop
}



main();

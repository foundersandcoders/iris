/** ====== TUI Application ======
  * Manages full-screen terminal interface, screen transitions, and workflows
  */
import terminalKit from 'terminal-kit';
import { Router } from "./utils/router";
import { Dashboard } from './screens/dashboard';
import { FilePicker } from './screens/file-picker';
import { ProcessingScreen } from './screens/processing';

const term = terminalKit.terminal;

interface TUIOptions {
  startCommand?: string;
  args?: string[];
}

export class TUI {
  private router: Router;
  
  constructor(private options: TUIOptions = {}) {
    this.router = new Router(term);
  }

  async start() {
    this.initialize();
    this.registerScreens();
    
    await this.router.push("dashboard");
  }

  private initialize() {
    term.fullscreen(true);
    term.hideCursor(true);
    term.grabInput(true);

    /* Ctrl+C */
    term.on('key', (key: string) => {
      if (key === 'CTRL_C') {
        this.cleanup();
        process.exit(0);
      }
    });

    process.stdout.on('resize', () => {
      /* TODO: Handle this in Router */
    });
  }
  
  private registerScreens() {
    this.router.register('dashboard', (term) => new Dashboard(term));
    this.router.register('convert', (term) => new FilePicker(term));
    this.router.register('processing', (term) => new ProcessingScreen(term));
  }

  private cleanup() {
    term.fullscreen(false);
    term.hideCursor(false); // TODO: Check terminalKit.terminal API
    term.grabInput(false);
  }
}
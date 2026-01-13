/**
  * Main TUI Application
  * Manages full-screen terminal interface, screen transitions, and workflows
  */
import terminalKit from 'terminal-kit';
import { Dashboard } from './screens/dashboard';

const term = terminalKit.terminal;

interface TUIOptions {
  startCommand?: string;
  args?: string[];
}

export class TUI {
  private currentScreen: any = null;

  constructor(private options: TUIOptions = {}) {}

  async start() {
    this.initialize();

    if (this.options.startCommand) {
      // Future: Jump directly to workflow
      console.log('Direct workflow not yet implemented');
      await this.showDashboard();
    } else {
      // Show dashboard
      await this.showDashboard();
    }
  }

  private initialize() {
    // Full-screen mode
    term.fullscreen(true);
    term.hideCursor();
    term.grabInput({ mouse: false });

    // Graceful shutdown on Ctrl+C
    term.on('key', (key: string) => {
      if (key === 'CTRL_C') {
        this.cleanup();
        process.exit(0);
      }
    });

    // Handle window resize
    process.stdout.on('resize', () => {
      this.refresh();
    });
  }

  async showDashboard() {
    const dashboard = new Dashboard(term);
    const selection = await dashboard.render();

    // Handle selection
    if (selection === 'quit') {
      this.cleanup();
      process.exit(0);
    }

    // Future: Launch workflows based on selection
    console.log('Selected:', selection);
  }

  private cleanup() {
    term.fullscreen(false);
    term.showCursor();
    term.grabInput(false);
  }

  private refresh() {
    // Re-render current screen on terminal resize
    if (this.currentScreen) {
      this.currentScreen.render();
    }
  }
}
/** ====== Screen Router ======
  * Manages navigation between TUI screens with stack-based history
  */
import type { Terminal } from 'terminal-kit';

/* LOG (25-01-14) Navigation Array
 * 
 * OKAY this might be a slightly insane approach? I don't know.
 * 
 * But here we go, TUI navigation is henceforth an array of class instances.
 */

export type ScreenData = Record<string, unknown>;

export interface ScreenResult {
  /** Action */ action: 'push' | 'pop' | 'replace' | 'quit';
  /** Destination */ screen?: string;
  /** Payload */ data?: ScreenData;
}

export interface Screen {
  readonly name: string;
  render(data?: ScreenData): Promise<ScreenResult>;
  cleanup?(): void;
}

export type ScreenFactory = (term: Terminal) => Screen;

interface StackEntry {
  screenName: string;
  data?: ScreenData;
}

export class Router {
  private screens: Map<string, ScreenFactory> = new Map();
  private stack: StackEntry[] = [];
  private currentScreen: Screen | null = null;

  constructor(private term: Terminal) {}

  register(
    name: string,
    factory: ScreenFactory
  ): void {
    this.screens.set(name, factory);
  }

  /* Go Forwards */
  async push(
    screenName: string,
    data?: ScreenData
  ): Promise<void> {
    const factory = this.screens.get(screenName);
    if (!factory) {
      throw new Error(`Screen not found: ${screenName}`);
    }

    // Cleanup current screen
    this.currentScreen?.cleanup?.();

    // Push to stack
    this.stack.push({ screenName, data });

    // Create and render new screen
    this.currentScreen = factory(this.term);
    await this.runScreen(data);
  }

  /* Go Backwards */
  async pop(data?: ScreenData): Promise<void> {
    if (this.stack.length <= 1) {
      return;
    }

    // Cleanup current screen
    this.currentScreen?.cleanup?.();

    // Pop current screen
    this.stack.pop();

    // Get previous screen
    const previous = this.stack[this.stack.length - 1];
    const factory = this.screens.get(previous.screenName);
    if (!factory) {
      throw new Error(`Screen not found: ${previous.screenName}`);
    }

    // Merge any returned data with original data
    const screenData = { ...previous.data, ...data };

    // Create and render previous screen
    this.currentScreen = factory(this.term);
    await this.runScreen(screenData);
  }

  /* Go Sideways */
  async replace(
    screenName: string,
    data?: ScreenData
  ): Promise<void> {
    const factory = this.screens.get(screenName);
    if (!factory) {
      throw new Error(`Screen not found: ${screenName}`);
    }

    // Cleanup current screen
    this.currentScreen?.cleanup?.();

    // Replace top of stack
    if (this.stack.length > 0) {
      this.stack[this.stack.length - 1] = { screenName, data };
    } else {
      this.stack.push({ screenName, data });
    }

    // Create and render new screen
    this.currentScreen = factory(this.term);
    await this.runScreen(data);
  }

  getBreadcrumbs(): string[] {
    return this.stack.map((entry) => entry.screenName);
  }

  canGoBack(): boolean {
    return this.stack.length > 1;
  }

  private async runScreen(data?: ScreenData): Promise<void> {
    if (!this.currentScreen) return;

    const result = await this.currentScreen.render(data);

    switch (result.action) {
      case 'push':
        if (result.screen) {
          await this.push(result.screen, result.data);
        }
        break;
      case 'pop':
        await this.pop(result.data);
        break;
      case 'replace':
        if (result.screen) {
          await this.replace(result.screen, result.data);
        }
        break;
      case 'quit':
        // Signal to exit - handled by TUI
        break;
    }
  }
}
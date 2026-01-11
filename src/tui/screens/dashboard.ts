/**
  * Dashboard Screen
  * Main menu and entry point for TUI
  */
import { theme, symbols, borders } from '../theme';

export class Dashboard {
  private selectedIndex = 0;
  private menuItems = [
    { key: 'convert', label: 'Convert CSV to ILR XML' },
    { key: 'validate', label: 'Validate XML Submission' },
    { key: 'check', label: 'Cross-Submission Check' },
    { key: 'history', label: 'Browse Submission History' },
    { key: 'settings', label: 'Settings & Configuration' },
    { key: 'quit', label: 'Quit' },
  ];

  constructor(private term: any) {}

  async render(): Promise<string> {
    return new Promise((resolve) => {
      this.term.clear();
      this.drawScreen();

      // Handle keyboard input
      this.term.on('key', (key: string) => {
        if (key === 'UP' && this.selectedIndex > 0) {
          this.selectedIndex--;
          this.drawScreen();
        } else if (key === 'DOWN' && this.selectedIndex < this.menuItems.length - 1) {
          this.selectedIndex++;
          this.drawScreen();
        } else if (key === 'ENTER') {
          const selected = this.menuItems[this.selectedIndex];
          this.term.removeAllListeners('key');
          resolve(selected.key);
        } else if (key === 'q' || key === 'ESCAPE') {
          this.term.removeAllListeners('key');
          resolve('quit');
        } else if (key >= '1' && key <= '6') {
          const index = parseInt(key) - 1;
          if (index < this.menuItems.length) {
            this.selectedIndex = index;
            const selected = this.menuItems[this.selectedIndex];
            this.term.removeAllListeners('key');
            resolve(selected.key);
          }
        }
      });
    });
  }

  private drawScreen() {
    this.term.clear();

    // Header
    this.term.moveTo(1, 1);
    this.term.bold.hex(theme.primary)('IRIS');
    this.term.moveTo(50, 1);
    this.term.hex(theme.textMuted)('v0.1.0');

    // Title
    this.term.moveTo(1, 3);
    this.term.hex(theme.text)('ILR Toolkit');

    // Menu
    this.term.moveTo(1, 5);
    this.term.hex(theme.text)('Quick Actions');

    this.menuItems.forEach((item, index) => {
      this.term.moveTo(3, 7 + index);

      if (index === this.selectedIndex) {
        this.term.hex(theme.primary)(symbols.arrow + ' ');
        this.term.bold.hex(theme.text)(`${index + 1}  ${item.label}`);
      } else {
        this.term.hex(theme.textMuted)(`  ${index + 1}  ${item.label}`);
      }
    });

    // Status bar
    const height = this.term.height;
    this.term.moveTo(1, height);
    this.term.hex(theme.textMuted)('[↑↓/1-6] Select  [ENTER] Confirm  [q] Quit');
  }
}
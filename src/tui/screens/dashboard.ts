/** ====== Dashboard Screen ======
  * 
  * Main menu and entry point for TUI
  */
import type { Terminal } from 'terminal-kit';
import { Layout } from '../utils/layout';
import { theme, symbols } from '../theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';

export class Dashboard implements Screen {
  readonly name = 'dashboard';
  private layout: Layout;
  private selectedIndex = 0;
  
  private menuItems = [
    { key: 'convert', label: 'Convert CSV to ILR XML', implemented: true },
    { key: 'validate', label: 'Validate XML Submission', implemented: false },
    { key: 'check', label: 'Cross-Submission Check', implemented: false },
    { key: 'history', label: 'Browse Submission History', implemented: false },
    { key: 'settings', label: 'Settings & Configuration', implemented: false },
    { key: 'quit', label: 'Quit', implemented: true },
  ];

  constructor(private term: Terminal) {
    this.layout = new Layout(term);
  }

  async render(data?: ScreenData): Promise<ScreenResult> {
    return new Promise((resolve) => {
      this.drawScreen();

      /* LOG (25-01-14): Keyboard Navigation
        
        REALLY? I HAVE TO DO THIS LIKE I'M NAVIGATING AN ARRAY?
        
        Take me back to Svelte
        */
      this.term.on('key', (key: string) => {
        if (key === 'UP' && this.selectedIndex > 0) {
          this.selectedIndex--;
          this.drawScreen();
        } else if (key === 'DOWN' && this.selectedIndex < this.menuItems.length - 1) {
          this.selectedIndex++;
          this.drawScreen();
        } else if (key === 'ENTER') {
          const selected = this.menuItems[this.selectedIndex];
          if (selected.key === 'quit') {
            this.term.removeAllListeners('key');
            resolve({ action: 'quit' });
          } else if (!selected.implemented) {
            this.drawScreen();
            this.term.moveTo(1, this.term.height - 2);
            this.term.colorRgbHex(theme.textMuted)('Patience, Daniel/Jess...');
            this.term.styleReset();
          } else {
            this.term.removeAllListeners('key');
            resolve({ action: 'push', screen: selected.key });
          }
        } else if (key === 'q' || key === 'ESCAPE') {
          this.term.removeAllListeners('key');
          resolve({ action: 'quit' });
        } else if (key >= '1' && key <= '6') {
          const index = parseInt(key) - 1;
          if (index < this.menuItems.length) {
            this.selectedIndex = index;
            const selected = this.menuItems[this.selectedIndex];
            this.term.removeAllListeners('key');
            if (selected.key === 'quit') {
              this.term.removeAllListeners('key');
              resolve({ action: 'quit' });
            } else if (!selected.implemented) {
              this.drawScreen();
              this.term.moveTo(1, this.term.height - 2);
              this.term.colorRgbHex(theme.textMuted)('Patience, Daniel/Jess...');
              this.term.styleReset();
            } else {
              this.term.removeAllListeners('key');
              resolve({ action: 'push', screen: selected.key });
            }
          }
        }
      });
    });
  }

  cleanup(): void {
    this.term.removeAllListeners('key');
  }

  private drawScreen(): void {
    const region = this.layout.draw({
      title: 'ILR Toolkit',
      statusBar: '[↑↓/1-6] Select  [ENTER] Confirm  [q] Quit',
      showBack: false,
    });

    this.term.moveTo(1, region.contentTop);
    this.term.colorRgbHex(theme.text)('Quick Actions');
    this.term.styleReset();

    this.menuItems.forEach((item, index) => {
      this.term.moveTo(3, region.contentTop + 2 + index);

      if (index === this.selectedIndex) {
        this.term.colorRgbHex(theme.primary)(`${symbols.arrow} `);
        this.term.bold.colorRgbHex(theme.text)(`${index + 1}  ${item.label}`);
      } else {
        this.term.colorRgbHex(theme.textMuted)(`  ${index + 1}  ${item.label}`);
      }
      this.term.styleReset();
    });
  }
}
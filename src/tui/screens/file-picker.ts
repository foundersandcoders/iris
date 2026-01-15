import fs from 'node:fs/promises';
import path from 'node:path';
import type { Terminal } from 'terminal-kit';
import { Layout } from '../utils/layout';
import { THEMES } from '../theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';

const theme = THEMES.themeLight;

interface FileEntry {
  name: string;
  isDirectory: boolean;
  path: string;
}

export class FilePicker implements Screen {
  readonly name = 'file-picker';
  private layout: Layout;
  private currentPath: string;
  private entries: FileEntry[] = [];
  private selectedIndex = 0;
  private scrollOffset = 0;
  private showHidden = false;

  constructor(private term: Terminal) {
    this.layout = new Layout(term);
    this.currentPath = process.cwd();
  }

  async render(data?: ScreenData): Promise<ScreenResult> {
    if (data?.path && typeof data.path === 'string') {
      this.currentPath = data.path;
    }

    await this.loadDirectory();

    return new Promise((resolve) => {
      this.drawScreen();

      this.term.on('key', async (key: string) => {
        if (key === 'UP') {
          if (this.selectedIndex > 0) {
            this.selectedIndex--;
            this.adjustScroll();
            this.drawScreen();
          }
        } else if (key === 'DOWN') {
          if (this.selectedIndex < this.entries.length - 1) {
            this.selectedIndex++;
            this.adjustScroll();
            this.drawScreen();
          }
        }
        else if (key === 'PAGE_UP') {
          const region = this.layout.draw({ title: '' });
          const pageSize = region.contentHeight;
          this.selectedIndex = Math.max(0, this.selectedIndex - pageSize);
          this.adjustScroll();
          this.drawScreen();
        } else if (key === 'PAGE_DOWN') {
          const region = this.layout.draw({ title: '' });
          const pageSize = region.contentHeight;
          this.selectedIndex = Math.min(this.entries.length - 1, this.selectedIndex + pageSize);
          this.adjustScroll();
          this.drawScreen();
        }
        else if (key === 'ENTER') {
          const selected = this.entries[this.selectedIndex];
          if (selected) {
            if (selected.isDirectory) {
              this.currentPath = selected.path;
              this.selectedIndex = 0;
              this.scrollOffset = 0;
              await this.loadDirectory();
              this.drawScreen();
            } else {
              this.cleanup();
              resolve({
                action: 'push',
                screen: 'processing',
                data: { filePath: selected.path }
              });
            }
          }
        } else if (key === 'BACKSPACE' || key === 'LEFT') {
          const parent = path.dirname(this.currentPath);
          if (parent !== this.currentPath) {
            this.currentPath = parent;
            this.selectedIndex = 0;
            this.scrollOffset = 0;
            await this.loadDirectory();
            this.drawScreen();
          }
        } else if (key === 'q' || key === 'ESCAPE') {
          this.cleanup();
          resolve({ action: 'pop' });
        }
      });
    });
  }

  cleanup(): void {
    this.term.removeAllListeners('key');
  }

  private async loadDirectory() {
    try {
      const dirents = await fs.readdir(this.currentPath, { withFileTypes: true });

      const filtered = dirents.filter(d => {
        if (!this.showHidden && d.name.startsWith('.') && d.name !== '..') return false;
        if (d.isDirectory()) return true;
        if (d.name.toLowerCase().endsWith('.csv')) return true;
        return false;
      });

      const mapped: FileEntry[] = filtered.map(d => ({
        name: d.name,
        isDirectory: d.isDirectory(),
        path: path.join(this.currentPath, d.name)
      }));

      mapped.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      this.entries = mapped;
    } catch (error) {
      this.entries = [];
    }
  }

  private adjustScroll() {
    const region = this.layout.draw({ title: '' });
    const height = region.contentHeight;

    if (this.selectedIndex < this.scrollOffset) {
      this.scrollOffset = this.selectedIndex;
    } else if (this.selectedIndex >= this.scrollOffset + height) {
      this.scrollOffset = this.selectedIndex - height + 1;
    }
  }

  private drawScreen(): void {
    const region = this.layout.draw({
      title: 'Select CSV File',
      breadcrumbs: [this.shortenPath(this.currentPath)],
      statusBar: '[↑↓] Nav  [ENTER] Select  [BACKSPACE] Up Dir  [ESC] Back',
      showBack: true,
    });

    const visibleHeight = region.contentHeight;
    const visibleItems = this.entries.slice(this.scrollOffset, this.scrollOffset + visibleHeight);

    if (this.entries.length === 0) {
      this.term.moveTo(3, region.contentTop + 2);
      this.term.colorRgbHex(theme.textMuted)('No CSV files found in this directory.');
      return;
    }

    visibleItems.forEach((item, index) => {
      const y = region.contentTop + index;
      const actualIndex = this.scrollOffset + index;
      const isSelected = actualIndex === this.selectedIndex;

      this.term.moveTo(1, y);

      if (isSelected) {
        // Light highlight background
        this.term.bgColorRgbHex(theme.highlight);
        // Dark text on highlight
        this.term.colorRgbHex(theme.text);
        this.term.eraseLineAfter();
      } else {
        this.term.bgDefaultColor();
      }

      const icon = item.isDirectory ? '📁' : '📄';
      const color = item.isDirectory ? theme.primary : theme.success;

      this.term('  ');
      if (isSelected) {
        this.term.colorRgbHex(color)(icon + '  ');
        this.term.colorRgbHex(theme.text)(item.name);
      } else {
        this.term.colorRgbHex(color)(icon + '  ');
        this.term.colorRgbHex(theme.text)(item.name);
      }
      
      this.term.styleReset();
    });
  }

  private shortenPath(fullPath: string): string {
    const home = process.env.HOME || '';
    if (fullPath.startsWith(home)) {
      return '~' + fullPath.slice(home.length);
    }
    return fullPath;
  }
}
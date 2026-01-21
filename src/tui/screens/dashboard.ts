/** ====== Dashboard Screen ======
 * Main menu and entry point for TUI
 */
import gradient from 'gradient-string';
import type { Terminal } from 'terminal-kit';
import { Layout } from '../utils/layout';
import { THEMES, PALETTE, symbols } from '../theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';

const theme = THEMES.themeLight;

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
						// Using 'Vein' color for alerts/patience messages
						this.term.colorRgbHex(PALETTE.line.main.colour)('Patience, Daniel/Jess...');
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
							this.term.colorRgbHex(PALETTE.line.main.colour)('Patience, Daniel/Jess...');
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
			title: '',
			statusBar: '[↑↓/1-6] Select  [ENTER] Confirm  [q] Quit',
			showBack: false,
		});

		const asciiArt = [
			'  ┏━┓   ╭┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬╮   ┏━┓  ',
			'  ┗━╋━━━┿┷┷┷┷┷┷┷┷┷┷┷┷┷┷┷┷┷┷┷┷┷┷┷┿━━━╋━┛  ',
			'╭─┰─╂─░██████         ░██       ╰───╂─┰─╮',
			'│ ┃ ┃   ░██                         ┃ ┃ │',
			'│ ┃ ┃   ░██  ░██░████ ░██ ░███████  ┃ ┃ │',
			'│ ┃ ┃   ░██  ░███     ░██░██        ┃ ┃ │',
			'│ ┃ ┃   ░██  ░██      ░██ ░███████  ┃ ┃ │',
			'│ ┃ ┃   ░██  ░██      ░██       ░██ ┃ ┃ │',
			'╰─┸─╂─░██████░██      ░██ ░███████──╂─┸─╯',
			'  ┏━╋━━━┿┯┯┯┯┯┯┯┯┯┯┯┯┯┯┯┯┯┯┯┯┯┯┯┿━━━╋━┓  ',
			'  ┗━┛   ╰┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴╯   ┗━┛  ',
		];

		const logoGradient = gradient([PALETTE.foreground.main.midi, PALETTE.foreground.alt.midi]);

		asciiArt.forEach((line, i) => {
			this.term.moveTo(1, 2 + i);
			this.term(logoGradient(line));
		});

		const contentTop = 2 + asciiArt.length + 2;

		this.term.moveTo(1, contentTop);
		this.term.colorRgbHex(theme.text)('Quick Actions');
		this.term.styleReset();

		this.menuItems.forEach((item, index) => {
			this.term.moveTo(3, contentTop + 2 + index);
			const isSelected = index === this.selectedIndex;

			if (isSelected) {
				this.term.bgColorRgbHex(theme.highlight);
				this.term.colorRgbHex(theme.text).bold(`${symbols.arrow} `);
			} else {
				this.term.bgColorRgbHex(theme.background);
				this.term('  ');
			}

			if (item.implemented) {
				this.term.colorRgbHex(theme.text);
				if (isSelected) this.term.bold;
				this.term(`${index + 1}  ${item.label}`);
			} else {
				this.term.colorRgbHex(theme.textMuted);
				this.term(`${index + 1}  ${item.label}`);
				this.term.colorRgbHex(theme.textMuted)(' (soon)');
			}

			this.term.styleReset();
		});
	}
}

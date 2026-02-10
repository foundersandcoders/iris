/** ====== About Iris Screen ======
 * Read-only screen showing software metadata, version, and runtime info.
 */
import {
	BoxRenderable,
	TextRenderable,
	type KeyEvent,
} from '@opentui/core';
import type { RenderContext, Renderer } from '../types';
import { theme } from '../../../brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import { DEFAULT_CONFIG } from '../../lib/types/configTypes';

const CONTAINER_ID = 'about-root';

// Read version from package.json at import time
import packageJson from '../../../package.json';

export class AboutScreen implements Screen {
	readonly name = 'about';
	private renderer: Renderer;
	private keyHandler?: (key: KeyEvent) => void;

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(_data?: ScreenData): Promise<ScreenResult> {
		this.buildUI();

		return new Promise((resolve) => {
			this.keyHandler = (key: KeyEvent) => {
				if (key.name === 'escape' || key.name === 'q') {
					this.renderer.keyInput.off('keypress', this.keyHandler!);
					resolve({ action: 'pop' });
				}
			};
			this.renderer.keyInput.on('keypress', this.keyHandler);
		});
	}

	cleanup(): void {
		if (this.keyHandler) {
			this.renderer.keyInput.off('keypress', this.keyHandler);
		}
		this.renderer.root.remove(CONTAINER_ID);
	}

	private buildUI(): void {
		const container = new BoxRenderable(this.renderer, {
			id: CONTAINER_ID,
			flexDirection: 'column',
			width: '100%',
			height: '100%',
			backgroundColor: theme.background,
		});

		// Title
		container.add(new TextRenderable(this.renderer, {
			content: 'About Iris',
			fg: theme.primary,
		}));

		// Description (before fields)
		container.add(new TextRenderable(this.renderer, {
			content: '  ILR toolkit for converting learner data from CSV',
			fg: theme.textMuted,
		}));
		container.add(new TextRenderable(this.renderer, {
			content: '  exports into ILR-compliant XML for ESFA submission.',
			fg: theme.textMuted,
		}));

		container.add(new TextRenderable(this.renderer, { content: '' }));

		// Software info
		const fields: [string, string, string?][] = [
			['Software Package', 'Iris', 'github.com/fac/iris'],
			['Software Supplier', 'Founders and Coders', 'foundersandcoders.com'],
			['Version', packageJson.version],
			['Runtime', `Bun ${typeof Bun !== 'undefined' ? Bun.version : 'unknown'}`],
			['Platform', `${process.platform} ${process.arch}`],
		];

		for (const [label, value, url] of fields) {
			const padding = ' '.repeat(Math.max(1, 22 - label.length));
			const display = url ? `${value} (${url})` : value;
			container.add(new TextRenderable(this.renderer, {
				content: `  ${label}${padding}${display}`,
				fg: theme.text,
			}));
		}

		// Fill remaining space
		container.add(new BoxRenderable(this.renderer, { flexGrow: 1 }));

		// Status bar
		container.add(new TextRenderable(this.renderer, {
			content: '[ESC] Back',
			fg: theme.textMuted,
		}));

		this.renderer.root.add(container);
	}
}

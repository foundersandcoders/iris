/** ====== About Iris Screen ======
 * Read-only screen showing software metadata, version, and runtime info.
 */
import { TextRenderable, t, fg, link, underline } from '@opentui/core';
import type { RenderContext, Renderer } from '../types';
import { theme, PALETTE } from '../../../assets/brand/theme';
import type { Screen, ScreenResult, ScreenData } from '../utils/router';
import { appShell, panel, type AppShell, type Panel } from '../components';
import { Keymap } from '../utils/keymap';

const CONTAINER_ID = 'about-root';

// Read version from package.json at import time
import packageJson from '../../../package.json';

export class AboutScreen implements Screen {
	readonly name = 'about';
	private renderer: Renderer;
	private shell?: AppShell;
	private infoPanel?: Panel;
	private keymap?: Keymap;

	constructor(ctx: RenderContext) {
		this.renderer = ctx.renderer;
	}

	async render(_data?: ScreenData): Promise<ScreenResult> {
		return new Promise((resolve) => {
			const keymap = this.buildUI(resolve);
			keymap.attach(this.renderer);
		});
	}

	cleanup(): void {
		this.keymap?.detach(this.renderer);
		this.renderer.root.remove(CONTAINER_ID);
	}

	private buildUI(resolve: (result: ScreenResult) => void): Keymap {
		const finish = () => resolve({ action: 'pop' });
		this.keymap = new Keymap({
			bindings: [],
			onBack: finish,
			onQuit: finish,
		});
		const keymap = this.keymap;

		this.shell = appShell(this.renderer, {
			id: CONTAINER_ID,
			breadcrumb: 'About',
			footer: keymap.toKeybar(),
		});

		this.infoPanel = panel(this.renderer, { title: 'About Iris', flexGrow: 1 });

		// Description
		this.infoPanel.add(new TextRenderable(this.renderer, {
			content: 'ILR toolkit for converting learner data from CSV',
			fg: theme.textMuted,
		}));
		this.infoPanel.add(new TextRenderable(this.renderer, {
			content: 'exports into ILR-compliant XML for ESFA submission.',
			fg: theme.textMuted,
		}));

		this.infoPanel.add(new TextRenderable(this.renderer, { content: '' }));

		// Software info
		const labelColour = theme.text;
		const linkColour = PALETTE.foreground.alt.midi;

		const fields: { label: string; value: string; url?: string }[] = [
			{ label: 'Software Package', value: 'Iris', url: 'https://github.com/fac/iris' },
			{ label: 'Software Supplier', value: 'Founders and Coders', url: 'https://foundersandcoders.com' },
			{ label: 'Version', value: packageJson.version },
			{ label: 'Runtime', value: `Bun ${typeof Bun !== 'undefined' ? Bun.version : 'unknown'}` },
			{ label: 'Platform', value: `${process.platform} ${process.arch}` },
		];

		for (const field of fields) {
			const padding = ' '.repeat(Math.max(1, 22 - field.label.length));
			if (field.url) {
				this.infoPanel.add(new TextRenderable(this.renderer, {
					content: t`${fg(labelColour)(`${field.label}${padding}`)}${link(field.url)(underline(fg(linkColour)(field.value)))}`,
				}));
			} else {
				this.infoPanel.add(new TextRenderable(this.renderer, {
					content: `${field.label}${padding}${field.value}`,
					fg: labelColour,
				}));
			}
		}

		this.shell.content.add(this.infoPanel.box);
		this.renderer.root.add(this.shell.root);

		return keymap;
	}
}

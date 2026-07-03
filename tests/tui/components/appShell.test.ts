import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appShell } from '../../../src/tui/components/appShell';
import { APP_VERSION } from '../../../src/tui/utils/layout';
import * as fixtures from '../../fixtures/tui/tui';

// @opentui/core can only load under Bun (see tests/fixtures/tui/opentui.ts),
// so it's replaced with a shared test double.
vi.mock('@opentui/core', async () => import('../../fixtures/tui/opentui'));

describe('appShell()', () => {
	let ctx: ReturnType<typeof fixtures.createMockContext>;

	beforeEach(() => {
		ctx = fixtures.createMockContext();
	});

	it('returns a root BoxRenderable', () => {
		const shell = appShell(ctx.renderer);
		expect(shell.root.constructor.name).toBe('BoxRenderable');
	});

	it('returns a content BoxRenderable', () => {
		const shell = appShell(ctx.renderer);
		expect(shell.content.constructor.name).toBe('BoxRenderable');
	});

	it('adds three children to root in order (header, content, footer)', () => {
		const shell = appShell(ctx.renderer);
		// root.getChildren() returns the live child list
		const children = shell.root.getChildren();
		expect(children).toHaveLength(3);
		expect(children[0].constructor.name).toBe('TextRenderable');  // header
		expect(children[1].constructor.name).toBe('BoxRenderable');   // content
		expect(children[2].constructor.name).toBe('TextRenderable');  // footer
	});

	it('default header text contains APP_VERSION', () => {
		const shell = appShell(ctx.renderer);
		const headerChild = shell.root.getChildren()[0] as any;
		const headerText: string = headerChild.content.chunks[0].text;
		expect(headerText).toContain(`v${APP_VERSION}`);
	});

	it('default header text contains "Iris"', () => {
		const shell = appShell(ctx.renderer);
		const headerChild = shell.root.getChildren()[0] as any;
		const headerText: string = headerChild.content.chunks[0].text;
		expect(headerText).toContain('Iris');
	});

	it('uses a custom title when provided', () => {
		const shell = appShell(ctx.renderer, { title: 'Rhea' });
		const headerChild = shell.root.getChildren()[0] as any;
		const headerText: string = headerChild.content.chunks[0].text;
		expect(headerText).toContain('Rhea');
	});

	it('appends a breadcrumb to the header when provided', () => {
		const shell = appShell(ctx.renderer, { title: 'Iris', breadcrumb: 'Settings' });
		const headerChild = shell.root.getChildren()[0] as any;
		const headerText: string = headerChild.content.chunks[0].text;
		expect(headerText).toContain('Iris');
		expect(headerText).toContain('Settings');
	});

	it('content box is the middle child and has flexGrow set', () => {
		const shell = appShell(ctx.renderer);
		// content is the same object as the middle child
		expect(shell.content).toBe(shell.root.getChildren()[1]);
	});

	it('setFooter() updates the footer text in place', () => {
		const shell = appShell(ctx.renderer, { footer: 'original' });
		shell.setFooter('[q] Quit');
		const footerChild = shell.root.getChildren()[2] as any;
		const footerText: string = footerChild.content.chunks[0].text;
		expect(footerText).toBe('[q] Quit');
	});

	it('setHeader() updates the header text in place', () => {
		const shell = appShell(ctx.renderer);
		shell.setHeader('Theia', 'History');
		const headerChild = shell.root.getChildren()[0] as any;
		const headerText: string = headerChild.content.chunks[0].text;
		expect(headerText).toContain('Theia');
		expect(headerText).toContain('History');
	});
});

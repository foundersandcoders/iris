import { sveltekit } from '@sveltejs/kit/vite';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	// .xsd files are read as raw text (schema fixtures) but Vite's default import
	// analysis tries to parse them as JS; treat them as assets instead.
	assetsInclude: ['**/*.xsd'],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
		// vi.mock('@opentui/core', ...) (see tests/fixtures/tui/opentui.ts) only
		// intercepts imports vitest transforms itself. opentui-spinner is
		// externalised by default, so its nested `from '@opentui/core'` import
		// reaches the real, Bun-only package instead of the mock. Inlining it
		// routes that import through vitest's transform, where the mock applies.
		server: {
			deps: {
				inline: ['opentui-spinner']
			}
		},
		// bun.ts uses the global `Bun` runtime API, unavailable under vitest's Node
		// environment. It's exercised under `bun test` instead (tests/lib is the bun
		// test root — see bunfig.toml).
		exclude: [...configDefaults.exclude, 'tests/lib/storage/adapters/bun.test.ts']
	},
	// Tauri expects the dev server to run on a specific port
	server: {
		port: 1420,
		strictPort: true
	},
	// Use relative base path for Tauri
	base: './'
});

import { sveltekit } from '@sveltejs/kit/vite';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	// .xsd files are read as raw text (schema fixtures) but Vite's default import
	// analysis tries to parse them as JS; treat them as assets instead.
	assetsInclude: ['**/*.xsd'],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
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

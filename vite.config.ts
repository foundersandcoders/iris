import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}']
	},
	// Tauri expects the dev server to run on a specific port
	server: {
		port: 1420,
		strictPort: true
	},
	// Use relative base path for Tauri
	base: './'
});

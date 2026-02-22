import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  base: '/my-cellar/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [svelte({ hot: false }), tailwindcss()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test-setup.ts'],
    // Ensure Svelte resolves client-side code in jsdom environment
    server: {
      deps: {
        inline: [/svelte/],
      },
    },
  },
  resolve: {
    conditions: ['browser'],
  },
});

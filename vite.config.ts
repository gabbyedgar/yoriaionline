import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const pages = [
  'index',
  'about',
  'activity',
  'browse',
  'faq',
  'hosts',
  'how-it-works',
  'privacy',
  'safety',
  'terms',
  'travelers',
];

export default defineConfig({
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((p) => [p, resolve(__dirname, `${p}.html`)]),
      ),
    },
  },
});

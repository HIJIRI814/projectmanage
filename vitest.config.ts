import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '~': resolve(fileURLToPath(new URL('.', import.meta.url))),
      '@': resolve(fileURLToPath(new URL('.', import.meta.url))),
      '~domain': resolve(fileURLToPath(new URL('./domain', import.meta.url))),
      '~application': resolve(fileURLToPath(new URL('./application', import.meta.url))),
      '~infrastructure': resolve(fileURLToPath(new URL('./infrastructure', import.meta.url))),
    },
  },
});

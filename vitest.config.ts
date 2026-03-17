import { defineConfig } from 'vitest/config';

export default defineConfig({
  cacheDir: './.vitest-cache',
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
    },
  },
});

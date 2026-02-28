import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    root: resolve(__dirname),
  },
});

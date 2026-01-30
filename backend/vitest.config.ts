import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
    },
    reporters: ['verbose', 'html'],
    outputFile: {
      html: './test-reports/index.html',
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});

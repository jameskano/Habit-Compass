import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**'],
    fileParallelism: false,
    hookTimeout: 120_000,
    include: ['supabase/functions/**/*.live.test.ts'],
    maxConcurrency: 1,
    testTimeout: 120_000,
  },
})

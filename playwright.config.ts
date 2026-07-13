import { defineConfig, devices } from '@playwright/test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const outputDir = process.env.CI
  ? './test-results'
  : join(tmpdir(), `habit-compass-playwright-${process.pid}`)
const viteCacheDir =
  process.env.VITE_CACHE_DIR ?? join(tmpdir(), `habit-compass-vite-playwright-${process.pid}`)

export default defineConfig({
  testDir: './src/test/e2e',
  outputDir,
  fullyParallel: true,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:5179',
    trace: 'on-first-retry',
  },
  webServer: {
    command: `${pnpmCommand} dev --host 127.0.0.1 --port 5179 --strictPort`,
    env: {
      ...process.env,
      VITE_APP_DATA_SOURCE: process.env.VITE_APP_DATA_SOURCE ?? 'mock',
      VITE_CACHE_DIR: viteCacheDir,
    },
    url: 'http://127.0.0.1:5179',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})

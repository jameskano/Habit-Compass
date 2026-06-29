import { defineConfig, devices } from '@playwright/test'

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

export default defineConfig({
  testDir: './src/test/e2e',
  fullyParallel: true,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:5179',
    trace: 'on-first-retry',
  },
  webServer: {
    command: `${pnpmCommand} dev --host 127.0.0.1 --port 5179 --strictPort`,
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

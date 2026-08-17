import { defineConfig, devices } from '@playwright/test'

const smokePort = Number(process.env.SMOKE_PORT || 4173)
const smokeHost = process.env.SMOKE_HOST || '127.0.0.1'
const baseURL = `http://${smokeHost}:${smokePort}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run build:smoke && npm run preview -- --host ${smokeHost} --port ${smokePort} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
})

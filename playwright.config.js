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
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    // Full route smoke (60 covered routes) stays Chromium-only. The
    // cross-browser critical spec is excluded here and runs via
    // `npm run test:smoke:cross-browser`.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [
        '**/smoke.cross-browser.spec.js',
        '**/visual.spec.js',
        '**/production-ui-phase2-sovereign.spec.js',
      ],
    },
    {
      name: 'sovereign',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/production-ui-phase2-sovereign.spec.js'],
    },
    // Lightweight cross-browser coverage: the original 10 critical routes on
    // Chromium, Firefox, and WebKit via a single shared spec + manifest.
    {
      name: 'chromium-critical',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/smoke.cross-browser.spec.js'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: ['**/smoke.cross-browser.spec.js'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: ['**/smoke.cross-browser.spec.js'],
    },
    // Deterministic visual regression for the most important surfaces, on the
    // fixed desktop viewport matching the primary development layout. Chromium
    // only; baselines are committed and Linux CI is authoritative.
    {
      name: 'visual',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        // Force grayscale text antialiasing so snapshots render identically on
        // CI (where subpixel/LCD text is enabled) and local environments.
        launchOptions: { args: ['--disable-lcd-text'] },
      },
      testMatch: ['**/visual.spec.js'],
    },
  ],
  webServer: {
    command: `npm run build:smoke && npm run preview -- --host ${smokeHost} --port ${smokePort} --strictPort`,
    env: {
      ...process.env,
      VITE_APP_BRAND: process.env.VITE_APP_BRAND || '',
    },
    url: baseURL,
    // A server on this port can belong to another checkout and serve an older
    // build. Always start this worktree's smoke build instead of reusing it.
    reuseExistingServer: false,
    timeout: 240_000,
  },
})

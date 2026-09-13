import { defineConfig, mergeConfig } from 'vitest/config'

import baseConfigFn from './vite.config.mjs'

const baseConfig = baseConfigFn({ command: 'serve' })

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      setupFiles: ['./src/test/setup.js'],
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        reportsDirectory: './coverage',
        include: ['src/**'],
        exclude: [
          // Node-test-covered modules (node --test) rather than Vitest.
          'src/navigation/navModel.js',
          'src/navigation/navLinkState.js',
          'src/navigation/routeSmokeManifest.js',
          'src/navigation/routeSmokeAccounting.js',
          'vite.allowed-hosts.mjs',
          // Generated/build output and Playwright artifacts.
          'dist/**',
          'coverage/**',
          'e2e/**',
          'playwright-report/**',
          'test-results/**',
          'scripts/**',
        ],
      },
    },
  }),
)

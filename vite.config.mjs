/* global process */
import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

import pkg from './package.json'
import {
  APP_BACKGROUND_COLOR,
  APP_DISPLAY_NAME,
  APP_MANIFEST_TITLE,
  APP_THEME_COLOR,
} from './src/config/AppBranding.js'
import {
  parseAllowedHosts,
  resolveAllowedHostsEnv,
} from './vite.allowed-hosts.mjs'

// Source-map upload to Sentry activates only when the required build-time
// credentials are present. Without them ordinary builds never enable source
// maps, so they are not publicly exposed just for Sentry.
const hasSentryBuildCredentials = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT,
)

const sentryPlugins = []
if (hasSentryBuildCredentials) {
  sentryPlugins.push(
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      telemetry: false,
      sourcemaps: {
        assets: ['dist/**/*.js'],
        filesToDeleteAfterUpload: ['dist/**/*.js.map'],
      },
    }),
  )
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  // Strip console.* / debugger from production bundles only, so dev logging
  // is untouched. `command` is 'build' for `vite build`, 'serve' for the dev server.
  esbuild: {
    drop: command === 'build' ? ['console', 'debugger'] : [],
  },
  plugins: [
    react(),
    VitePWA({
      includeAssets: [
        'favicon.ico',
        'robots.txt',
        'apple-touch-icon.png',
        'safari-pinned-tab.svg',
        'mstile-150x150.png',
      ],
      injectManifest: {
        globIgnores: ['index.html'],
        globPatterns: ['**/*.{js,css,html,png,svg}'],
      },
      manifest: {
        background_color: APP_BACKGROUND_COLOR,
        display: 'standalone',
        icons: [
          {
            sizes: '192x192',
            src: '/android-chrome-192x192.png',
            type: 'image/png',
          },
          {
            sizes: '512x512',
            src: '/android-chrome-512x512.png',
            type: 'image/png',
          },
          {
            sizes: '64x64',
            src: 'pwa-64x64.png',
            type: 'image/png',
          },
          {
            sizes: '192x192',
            src: 'pwa-192x192.png',
            type: 'image/png',
          },
          {
            sizes: '512x512',
            src: 'pwa-512x512.png',
            type: 'image/png',
          },
          {
            purpose: 'maskable',
            sizes: '512x512',
            src: 'maskable-icon-512x512.png',
            type: 'image/png',
          },
        ],
        name: APP_MANIFEST_TITLE,
        short_name: APP_DISPLAY_NAME,
        theme_color: APP_THEME_COLOR,
      },
      registerType: 'prompt',
      workbox: {
        clientsClaim: true, // Take control of uncontrolled clients as soon as the service worker becomes active
        maximumFileSizeToCacheInBytes: 6000000, // 6MB
        //Exclude API and Swagger routes from service worker navigation fallback
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//, // Exclude all API routes
          /^\/swagger/, // Exclude all Swagger routes
        ],
        skipWaiting: true, // Force the waiting service worker to become the active service worker
      },
    }),
    // Uploaded source maps are deleted from dist after upload so production
    // artifacts do not expose them publicly.
    ...sentryPlugins,
  ],
  build: {
    // Only the production build with Sentry credentials emits source maps.
    sourcemap: hasSentryBuildCredentials,
    // Route-level code splitting keeps every page out of the initial payload.
    // The largest remaining chunk (~570kB) is shared vendor code pulled by
    // lazy routes; raise the warning threshold slightly above it so genuine
    // regressions still warn, without hiding real problems.
    chunkSizeWarningLimit: 600,
  },

  resolve: {
    alias: [
      {
        find: '@',
        replacement: '/src',
      },
    ],
  },
  server: {
    // Development-only seam for installation-specific trusted hostnames.
    // Public/canonical URLs remain separate runtime configuration concerns.
    allowedHosts: parseAllowedHosts(resolveAllowedHostsEnv(process.env)),
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:2021',
      },
    },
  },
}))

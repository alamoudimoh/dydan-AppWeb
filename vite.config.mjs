/* global process */
import { sentryVitePlugin } from '@sentry/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

import pkg from './package.json'
import { APP_DISPLAY_TAGLINE } from './src/config/AppBranding.js'
import { productTokens, resolveProductBrand } from './src/theme/tokens.js'
import {
  parseAllowedHosts,
  resolveAllowedHostsEnv,
} from './vite.allowed-hosts.mjs'
import { resolveDevProxyTarget } from './vite.dev-proxy.mjs'

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
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const brand = productTokens[resolveProductBrand(env.VITE_APP_BRAND)]

  return {
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
      tailwindcss(),
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
          background_color: brand.light.page,
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
          name: `${brand.name}: ${APP_DISPLAY_TAGLINE}`,
          short_name: brand.name,
          theme_color: brand.light.page,
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
      // Resolved from the Vite-loaded env so .env, .env.local and mode-specific
      // Vite env files work, while an explicitly exported process env var still
      // takes precedence.
      allowedHosts: parseAllowedHosts(resolveAllowedHostsEnv(env)),
      // Development only: keep the production listener unchanged while making
      // the approved UI available to local and LAN reviewers on its standard
      // integration port. Vite's React plugin provides the HMR boundary.
      port: Number(env.VITE_DEV_PORT || 2925),
      host: '0.0.0.0',
      hmr: true,
      proxy: {
        '/api': {
          // Development-only seam so the dev server can be pointed at the
          // intended Dydan backend via VITE_DEV_PROXY_TARGET. Resolved from
          // the Vite-loaded env (loadEnv) so .env, .env.local, mode-specific
          // Vite env files and the shell environment all work. The default
          // matches the standard zero-config Dydan deployment port.
          target: resolveDevProxyTarget(env),
        },
      },
    },
  }
})

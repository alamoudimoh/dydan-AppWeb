import { expect, test } from '@playwright/test'

import {
  installApiMocks,
  overrideUserPreferences,
  smokePreferences,
} from './fixtures/apiMocks.js'
import { clearSmokeSession, installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

// Representative Arabic (ar-SA) route smoke. Direction and language are app
// state driven by the mocked preferences endpoint: the boot effect applies
// `language` from GET /users/preferences, so authenticated routes render RTL
// once the override presents ar-SA. Signed-out routes never load preferences
// (the query is token-gated), so the auth surface keeps the default English
// identity — asserted here as documented runtime behavior.
//
// The approved runtime localizes the shell: navigation labels and the top-bar
// search placeholder come from the i18n catalogue, while screen headings stay
// on their approved English reference copy. Routes with a sidebar entry assert
// their Arabic navigation label; /notifications and /search have no sidebar
// entry, so they assert the Arabic top-bar search placeholder instead.
const AR_ROUTES = [
  { path: '/login', auth: false, dir: 'ltr', lang: 'en' },
  { path: '/', auth: true, dir: 'rtl', lang: 'ar-SA', arabic: /الرئيسية/ },
  { path: '/today', auth: true, dir: 'rtl', lang: 'ar-SA', arabic: /اليوم/ },
  {
    path: '/all-tasks',
    auth: true,
    dir: 'rtl',
    lang: 'ar-SA',
    arabic: /كل المهام/,
  },
  {
    path: '/calendar',
    auth: true,
    dir: 'rtl',
    lang: 'ar-SA',
    arabic: /التقويم/,
  },
  {
    path: '/projects',
    auth: true,
    dir: 'rtl',
    lang: 'ar-SA',
    arabic: /المشاريع/,
  },
  {
    path: '/routines',
    auth: true,
    dir: 'rtl',
    lang: 'ar-SA',
    arabic: /الروتين/,
  },
  {
    path: '/assets',
    auth: true,
    dir: 'rtl',
    lang: 'ar-SA',
    arabic: /الأصول/,
  },
  {
    path: '/shopping',
    auth: true,
    dir: 'rtl',
    lang: 'ar-SA',
    arabic: /التسوق/,
  },
  { path: '/goals', auth: true, dir: 'rtl', lang: 'ar-SA', arabic: /الأهداف/ },
  {
    path: '/activity',
    auth: true,
    dir: 'rtl',
    lang: 'ar-SA',
    arabic: /النشاط/,
  },
  {
    path: '/notifications',
    auth: true,
    dir: 'rtl',
    lang: 'ar-SA',
    placeholder: 'بحث…',
  },
  {
    path: '/rewards',
    auth: true,
    dir: 'rtl',
    lang: 'ar-SA',
    arabic: /المكافآت/,
  },
  {
    path: '/progress',
    auth: true,
    dir: 'rtl',
    lang: 'ar-SA',
    arabic: /التقدم/,
  },
  {
    path: '/settings',
    auth: true,
    dir: 'rtl',
    lang: 'ar-SA',
    arabic: /الإعدادات/,
  },
  {
    path: '/search',
    auth: true,
    dir: 'rtl',
    lang: 'ar-SA',
    placeholder: 'بحث…',
  },
]

const installArabicLanguage = async (page, auth) => {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'ar-SA')
    localStorage.setItem('language', JSON.stringify('ar-SA'))
  })
  // For authenticated routes the app resolves its language from preferences
  // (LocalizationContext state), not from i18next storage, so the override is
  // what actually flips direction and label copy.
  if (auth) {
    await overrideUserPreferences(page, smokePreferences({ language: 'ar-SA' }))
  }
}

test.describe('Arabic (ar-SA) UI smoke', () => {
  for (const route of AR_ROUTES) {
    test(`ar smoke: ${route.path}`, async ({ page }) => {
      const runtimeGuard = attachRuntimeErrorGuard(page)
      await installApiMocks(page)
      await installArabicLanguage(page, route.auth)

      if (route.auth) {
        await installSmokeSession(page)
      } else {
        await clearSmokeSession(page)
      }

      await page.goto(route.path, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle')

      await expect(page.locator('#root')).toBeVisible()
      await expect(page.locator('#root')).not.toBeEmpty()
      await expect(page.locator('html')).toHaveAttribute('dir', route.dir)
      await expect(page.locator('html')).toHaveAttribute('lang', route.lang)
      if (route.arabic) {
        await expect(page.locator('#root')).toContainText(route.arabic)
      }
      if (route.placeholder) {
        await expect(page.getByPlaceholder(route.placeholder)).toBeVisible()
      }

      runtimeGuard.assertClean()
    })
  }
})

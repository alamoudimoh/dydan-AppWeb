import { expect, test } from '@playwright/test'

import { installApiMocks } from './fixtures/apiMocks.js'
import { clearSmokeSession, installSmokeSession } from './fixtures/auth.js'
import { attachRuntimeErrorGuard } from './helpers/runtimeErrors.js'

// Representative Arabic (ar-SA) route smoke. Sets the app language through the
// same localStorage keys the i18n detector and LocalizationContext read, then
// verifies RTL direction, rendered Arabic copy where i18n drives the UI, and a
// clean runtime.
//
// Login, dashboard, chores and routines now render Arabic copy for their
// previously hardcoded English surfaces, so all routes assert Arabic content.
const AR_ROUTES = [
  { path: '/login', auth: false, arabic: /نسيت كلمة المرور؟/ },
  { path: '/', auth: true, arabic: /كل مهام اليوم مكتملة!/ },
  { path: '/family', auth: true, arabic: /تقدم العائلة/ },
  { path: '/shopping', auth: true, arabic: /التسوق/ },
  { path: '/chores', auth: true, arabic: /لا توجد مهام تطابق هذا العرض/ },
  { path: '/calendar', auth: true, arabic: /التقويم/ },
  { path: '/routines', auth: true, arabic: /الروتينات/ },
  { path: '/settings', auth: true, arabic: /الإعدادات/ },
  { path: '/settings/profile', auth: true, arabic: /الملف الشخصي/ },
  { path: '/settings/account', auth: true, arabic: /الجلسة الحالية/ },
  {
    path: '/settings/localization',
    auth: true,
    arabic: /اللغة والإعدادات الإقليمية/,
  },
]

const installArabicLanguage = async page => {
  await page.addInitScript(() => {
    // i18next-browser-languagedetector stores a plain string in i18nextLng;
    // LocalizationContext reads the app `language` key as JSON.
    localStorage.setItem('i18nextLng', 'ar-SA')
    localStorage.setItem('language', JSON.stringify('ar-SA'))
  })
}

test.describe('Arabic (ar-SA) UI smoke', () => {
  for (const route of AR_ROUTES) {
    test(`ar smoke: ${route.path}`, async ({ page }) => {
      const runtimeGuard = attachRuntimeErrorGuard(page)
      await installApiMocks(page)
      await installArabicLanguage(page)

      if (route.auth) {
        await installSmokeSession(page)
      } else {
        await clearSmokeSession(page)
      }

      await page.goto(route.path, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle')

      await expect(page.locator('#root')).toBeVisible()
      await expect(page.locator('#root')).not.toBeEmpty()

      const dir = await page.evaluate(() =>
        document.documentElement.getAttribute('dir'),
      )
      expect(dir).toBe('rtl')
      const lang = await page.evaluate(() =>
        document.documentElement.getAttribute('lang'),
      )
      expect(lang).toBe('ar-SA')
      if (route.arabic) {
        await expect(page.locator('#root')).toContainText(route.arabic)
      }

      runtimeGuard.assertClean()
    })
  }
})

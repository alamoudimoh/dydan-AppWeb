import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localesDir = path.resolve(__dirname, '../../public/locales')
const locales = ['en', 'ar', 'ar-SA']
const requiredKeys = [
  'title',
  'description',
  'currentSession',
  'currentBadge',
  'lastActive',
  'signOut',
  'signOutOtherSessions',
  'loading',
  'emptyTitle',
  'loadErrorTitle',
  'confirmTitle',
  'currentConfirmTitle',
  'confirmOthersTitle',
  'revokeSuccess',
  'revokeError',
  'alreadyEnded',
  'currentUnknown',
]

const loadSessions = locale => {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(localesDir, locale, 'settings.json'), 'utf8'),
  )
  return catalog.accountSessions
}

test('session management copy exists in English and both Arabic catalogs', () => {
  for (const locale of locales) {
    const sessions = loadSessions(locale)
    assert.ok(sessions, `${locale}/settings.json is missing accountSessions`)
    for (const key of requiredKeys) {
      assert.ok(
        String(sessions[key] || '').trim(),
        `${locale}/settings.json is missing accountSessions.${key}`,
      )
    }
  }
})

test('session management Arabic variants stay synchronized', () => {
  assert.deepEqual(loadSessions('ar'), loadSessions('ar-SA'))
})

test('session management copy does not expose backend token terminology', () => {
  const forbidden =
    /\b(?:sid|fam|rotation family|token family|refresh lineage)\b|رمز الوصول/i
  for (const locale of locales) {
    for (const [key, value] of Object.entries(loadSessions(locale))) {
      assert.doesNotMatch(
        String(value),
        forbidden,
        `${locale}/settings.json accountSessions.${key} exposes backend terminology`,
      )
    }
  }
})

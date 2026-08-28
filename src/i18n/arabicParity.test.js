import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localesDir = path.resolve(__dirname, '../../public/locales')
const NAMESPACES = ['common', 'settings', 'chores', 'shoppingLists']

// Legitimate English tokens that must remain identical in Arabic because they
// are technical values or proper nouns, not copy.
const ALLOWED_IDENTICAL = new Set([
  'circleSettings.webhookPlaceholder', // example URL
  'accountSettings.plus', // product plan name
  'profileMenu.plus', // product plan name
  'localization.formats.ymd', // ISO date format token
  'profile.accountIdentity.providers.google', // brand name
  'profile.accountIdentity.providers.apple', // brand name
  // Filter chip label templates: the surrounding format symbols (":", parens)
  // are universal; the {{type}}/{{value}}/{{op}}/{{count}} tokens they wrap are
  // themselves localized values.
  'toolbar.chipValue',
  'toolbar.chipCount',
  'toolbar.chipCount_one',
  'toolbar.chipCount_other',
  'toolbar.chipPoints',
  // Auth placeholders are example values, not translatable copy.
  'auth.emailPlaceholder',
  'auth.serverURLPlaceholder',
  // App store brand names remain in Latin script across locales.
  'onboarding.heardAbout.sources.appStore',
  // Format templates with only interpolation placeholders; real copy is in child keys.
  'realtime.taskActionMessage',
])

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flatten(value, fullKey)
    }
    return [[fullKey, value]]
  })

const loadNamespace = (locale, ns) =>
  flatten(
    JSON.parse(
      fs.readFileSync(path.join(localesDir, locale, `${ns}.json`), 'utf8'),
    ),
  )

const placeholders = value =>
  [...String(value).matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(m => m[1]).sort()

test('Arabic catalogs have full key parity with English', () => {
  for (const ns of NAMESPACES) {
    const en = loadNamespace('en', ns)
    const ar = loadNamespace('ar', ns)
    const enKeys = new Set(en.map(([k]) => k))
    const arKeys = new Set(ar.map(([k]) => k))
    const missing = [...enKeys].filter(k => !arKeys.has(k)).sort()
    const extra = [...arKeys].filter(k => !enKeys.has(k)).sort()
    assert.deepEqual(
      missing,
      [],
      `ar/${ns}.json missing keys: ${missing.join(', ')}`,
    )
    assert.deepEqual(
      extra,
      [],
      `ar/${ns}.json has obsolete keys: ${extra.join(', ')}`,
    )
  }
})

test('Arabic and ar-SA catalogs are consistent', () => {
  for (const ns of NAMESPACES) {
    const ar = JSON.stringify(loadNamespace('ar', ns))
    const arSA = JSON.stringify(loadNamespace('ar-SA', ns))
    assert.equal(ar, arSA, `ar/${ns}.json and ar-SA/${ns}.json differ`)
  }
})

test('Arabic translations preserve placeholders and have no empty values', () => {
  for (const ns of NAMESPACES) {
    const en = new Map(loadNamespace('en', ns))
    for (const [key, value] of loadNamespace('ar', ns)) {
      assert.ok(
        String(value).trim().length > 0,
        `ar/${ns}.json:${key} is empty`,
      )
      const enValue = en.get(key)
      if (typeof enValue === 'string') {
        assert.deepEqual(
          placeholders(value),
          placeholders(enValue),
          `ar/${ns}.json:${key} placeholder mismatch (${enValue} -> ${value})`,
        )
      }
    }
  }
})

test('no accidental untranslated English values in Arabic (except allowed tokens)', () => {
  for (const ns of NAMESPACES) {
    const en = new Map(loadNamespace('en', ns))
    for (const [key, value] of loadNamespace('ar', ns)) {
      if (ALLOWED_IDENTICAL.has(key)) continue
      if (!en.has(key)) continue
      const enValue = en.get(key)
      if (!enValue) continue
      assert.notEqual(
        value,
        enValue,
        `ar/${ns}.json:${key} is still English ("${enValue}")`,
      )
    }
  }
})

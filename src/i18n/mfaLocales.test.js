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
  'cardTitle',
  'enabledDescription',
  'disabledDescription',
  'enable',
  'disable',
  'setupTitle',
  'addedAccount',
  'verifyAndEnable',
  'step1Instruction',
  'qrCodeGenerationFailed',
  'step2Instruction',
  'backupCodesDescription',
  'disableWarning',
  'previousBackupCodesWarning',
  'setupFailed',
  'invalidVerificationCode',
]

const loadMfa = locale => {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(localesDir, locale, 'settings.json'), 'utf8'),
  )
  return catalog.mfa
}

test('MFA copy exists in English and both Arabic catalogs', () => {
  for (const locale of locales) {
    const mfa = loadMfa(locale)
    assert.ok(mfa, `${locale}/settings.json is missing mfa`)
    for (const key of requiredKeys) {
      assert.ok(
        String(mfa[key] || '').trim(),
        `${locale}/settings.json is missing mfa.${key}`,
      )
    }
  }
})

test('MFA Arabic variants stay synchronized', () => {
  assert.deepEqual(loadMfa('ar'), loadMfa('ar-SA'))
})

test('MFA setup error preserves the HTTP status placeholder', () => {
  for (const locale of locales) {
    assert.match(
      loadMfa(locale).setupFailed,
      /\{\{status\}\}/,
      `${locale}/settings.json mfa.setupFailed must include {{status}}`,
    )
  }
})

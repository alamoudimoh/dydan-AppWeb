import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getLanguageDisplayName,
  resolveDirection,
  resolveIntlLocale,
} from './localizationModel.js'

test('resolveIntlLocale maps app language codes to Intl locales', () => {
  assert.equal(resolveIntlLocale('en'), 'en-US')
  assert.equal(resolveIntlLocale('ar-SA'), 'ar-SA')
  assert.equal(resolveIntlLocale('zh-CN'), 'zh-CN')
  assert.equal(resolveIntlLocale('pt'), 'pt-BR')
})

test('resolveDirection returns rtl for Arabic variants and ltr otherwise', () => {
  assert.equal(resolveDirection('ar'), 'rtl')
  assert.equal(resolveDirection('ar-SA'), 'rtl')
  assert.equal(resolveDirection('en'), 'ltr')
  assert.equal(resolveDirection('en-US'), 'ltr')
  assert.equal(resolveDirection('de'), 'ltr')
  assert.equal(resolveDirection('zh-CN'), 'ltr')
  assert.equal(resolveDirection(''), 'ltr')
})

test('getLanguageDisplayName prefers translated labels', () => {
  const t = (key, opts) =>
    key === 'localization.languages.de' ? 'German' : opts?.defaultValue || ''
  assert.equal(
    getLanguageDisplayName('de', t, [{ code: 'de', nativeName: 'Deutsch' }]),
    'German',
  )
})

test('getLanguageDisplayName falls back to native catalog names', () => {
  const t = (_key, opts) => opts?.defaultValue || ''
  assert.equal(
    getLanguageDisplayName('ja', t, [{ code: 'ja', nativeName: '日本語' }]),
    '日本語',
  )
})

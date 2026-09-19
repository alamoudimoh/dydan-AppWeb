import assert from 'node:assert/strict'
import test from 'node:test'

import {
  APP_BACKGROUND_COLOR,
  APP_DISPLAY_NAME,
  APP_MANIFEST_TITLE,
  APP_SUPPORT_URL,
  APP_THEME_COLOR,
  formatPageTitle,
  formatSearchPlaceholder,
} from './AppBranding.js'

test('APP_DISPLAY_NAME is Dydan for user-facing surfaces', () => {
  assert.equal(APP_DISPLAY_NAME, 'Dydan')
})

test('manifest title includes display name and tagline', () => {
  assert.match(APP_MANIFEST_TITLE, /^Dydan:/)
})

test('formatPageTitle prefixes chore and page titles', () => {
  assert.equal(formatPageTitle('Groceries'), 'Dydan: Groceries')
  assert.equal(formatPageTitle(), 'Dydan')
})

test('formatSearchPlaceholder uses display name', () => {
  assert.equal(formatSearchPlaceholder(), 'Search Dydan')
})

test('PWA shell colors match the Dydan page background', () => {
  assert.equal(APP_THEME_COLOR, '#F8FAFF')
  assert.equal(APP_BACKGROUND_COLOR, '#F8FAFF')
})

test('default support URL points to the Dydan app issue tracker', () => {
  assert.equal(
    APP_SUPPORT_URL,
    'https://github.com/alamoudimoh/DyDan-AppWeb/issues',
  )
})

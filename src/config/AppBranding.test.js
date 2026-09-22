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

test('APP_DISPLAY_NAME is dydan for user-facing surfaces', () => {
  assert.equal(APP_DISPLAY_NAME, 'dydan')
})

test('manifest title includes display name and tagline', () => {
  assert.match(APP_MANIFEST_TITLE, /^dydan:/)
})

test('formatPageTitle prefixes chore and page titles', () => {
  assert.equal(formatPageTitle('Groceries'), 'dydan: Groceries')
  assert.equal(formatPageTitle(), 'dydan')
})

test('formatSearchPlaceholder uses display name', () => {
  assert.equal(formatSearchPlaceholder(), 'Search dydan')
})

test('PWA shell colors match the dydan page background', () => {
  assert.equal(APP_THEME_COLOR, '#FFF8E8')
  assert.equal(APP_BACKGROUND_COLOR, '#FFF8E8')
})

test('default support URL points to the dydan app issue tracker', () => {
  assert.equal(
    APP_SUPPORT_URL,
    'https://github.com/alamoudimoh/DyDan-AppWeb/issues',
  )
})

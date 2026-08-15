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

test('APP_DISPLAY_NAME is DayDan for user-facing surfaces', () => {
  assert.equal(APP_DISPLAY_NAME, 'DayDan')
})

test('manifest title includes display name and tagline', () => {
  assert.match(APP_MANIFEST_TITLE, /^DayDan:/)
})

test('formatPageTitle prefixes chore and page titles', () => {
  assert.equal(formatPageTitle('Groceries'), 'DayDan: Groceries')
  assert.equal(formatPageTitle(), 'DayDan')
})

test('formatSearchPlaceholder uses display name', () => {
  assert.equal(formatSearchPlaceholder(), 'Search DayDan')
})

test('PWA shell colors match the DayDan page background', () => {
  assert.equal(APP_THEME_COLOR, '#F6F7F9')
  assert.equal(APP_BACKGROUND_COLOR, '#F6F7F9')
})

test('default support URL points to the Taskier-App issue tracker', () => {
  assert.equal(
    APP_SUPPORT_URL,
    'https://github.com/alamoudimoh/Taskier-App/issues',
  )
})

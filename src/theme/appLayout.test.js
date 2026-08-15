import assert from 'node:assert/strict'
import test from 'node:test'

import {
  APP_PAGE_MAX_WIDTH,
  formStackSpacing,
  pageStackSpacing,
  pageShellSx,
  sectionCardSx,
  settingsPageSx,
} from './appLayout.js'

test('APP_PAGE_MAX_WIDTH defines wide and narrow content rails', () => {
  assert.equal(APP_PAGE_MAX_WIDTH.wide, 1100)
  assert.equal(APP_PAGE_MAX_WIDTH.narrow, 760)
})

test('pageShellSx aligns mobile and desktop padding', () => {
  assert.deepEqual(pageShellSx.px, { xs: 1.5, sm: 3 })
  assert.deepEqual(pageShellSx.py, { xs: 2, sm: 3 })
  assert.equal(pageShellSx.maxWidth, APP_PAGE_MAX_WIDTH.wide)
})

test('settingsPageSx matches page vertical rhythm', () => {
  assert.deepEqual(settingsPageSx.py, pageShellSx.py)
})

test('stack spacing tokens stay aligned', () => {
  assert.equal(pageStackSpacing, 2)
  assert.equal(formStackSpacing, pageStackSpacing)
})

test('sectionCardSx uses responsive density', () => {
  assert.deepEqual(sectionCardSx.p, { xs: 1.5, sm: 2 })
})

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  APP_PAGE_MAX_WIDTH,
  detailPageContainerSx,
  formStackSpacing,
  listPageContainerSx,
  pageShellSx,
  pageStackSpacing,
  sectionCardSx,
  settingsPageSx,
  widePageContainerSx,
} from './appLayout.js'

test('APP_PAGE_MAX_WIDTH defines wide and narrow content rails', () => {
  assert.equal(APP_PAGE_MAX_WIDTH.wide, 1128)
  assert.equal(APP_PAGE_MAX_WIDTH.narrow, 760)
})

test('pageShellSx aligns mobile and desktop padding', () => {
  assert.deepEqual(pageShellSx.px, { xs: 1.5, sm: 4, lg: 5 })
  assert.deepEqual(pageShellSx.py, { xs: 2.5, sm: 4 })
  assert.equal(pageShellSx.maxWidth, APP_PAGE_MAX_WIDTH.wide)
})

test('settingsPageSx matches page vertical rhythm', () => {
  assert.deepEqual(settingsPageSx.py, pageShellSx.py)
})

test('stack spacing tokens stay aligned', () => {
  assert.equal(pageStackSpacing, 3)
  assert.equal(formStackSpacing, 2)
})

test('sectionCardSx uses responsive density', () => {
  assert.deepEqual(sectionCardSx.p, { xs: 2.25, sm: 2.25 })
})

test('list and detail containers share vertical rhythm', () => {
  assert.deepEqual(listPageContainerSx.py, settingsPageSx.py)
  assert.deepEqual(detailPageContainerSx.py, settingsPageSx.py)
  assert.equal(listPageContainerSx.pb, 10)
  assert.equal(widePageContainerSx.pb, 10)
})

import assert from 'node:assert/strict'
import test from 'node:test'

import { NAV_LINK_IDS } from './navModel.js'
import { isNavLinkActive, NAV_LINK_PATHS } from './navLinkState.js'

test('isNavLinkActive matches home and chore routes', () => {
  assert.equal(isNavLinkActive('/', NAV_LINK_IDS.HOME), true)
  assert.equal(isNavLinkActive('/chores', NAV_LINK_IDS.ALL_TASKS), true)
  assert.equal(isNavLinkActive('/chores/42', NAV_LINK_IDS.ALL_TASKS), true)
  assert.equal(isNavLinkActive('/chores', NAV_LINK_IDS.HOME), false)
})

test('isNavLinkActive distinguishes settings overview from profile', () => {
  assert.equal(isNavLinkActive('/settings', NAV_LINK_IDS.SETTINGS), true)
  assert.equal(isNavLinkActive('/settings/profile', NAV_LINK_IDS.PROFILE), true)
  assert.equal(isNavLinkActive('/settings/profile', NAV_LINK_IDS.SETTINGS), false)
  assert.equal(isNavLinkActive('/settings/account', NAV_LINK_IDS.SETTINGS), false)
})

test('isNavLinkActive ignores action-only links', () => {
  assert.equal(isNavLinkActive('/chores', NAV_LINK_IDS.SEARCH), false)
  assert.equal(isNavLinkActive('/chores', NAV_LINK_IDS.FEEDBACK), false)
})

test('NAV_LINK_PATHS uses absolute app routes', () => {
  assert.equal(NAV_LINK_PATHS[NAV_LINK_IDS.CATEGORIES], '/labels')
  assert.equal(NAV_LINK_PATHS[NAV_LINK_IDS.PROJECTS], '/projects')
})

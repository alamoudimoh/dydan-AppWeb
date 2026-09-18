import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getSearchProviders } from './searchProviders.js'

const provider = id => getSearchProviders().find(item => item.id === id)
const sources = {
  chores: [],
  history: [],
  projects: [],
  labels: [],
  members: [],
  isParent: true,
  choresById: new Map(),
  projectsById: new Map(),
  membersById: new Map(),
}
const allDocuments = () =>
  getSearchProviders().flatMap(item => item.getDocuments(sources))

describe('search provider routing', () => {
  it('indexes Profile at /profile, not /settings/profile', () => {
    const profile = provider('profile')
      .getDocuments({})
      .find(document => document.entityId === 'profile')
    assert.equal(profile.route, '/profile')
  })

  it('presents Profile as its own destination, not Settings', () => {
    const profile = provider('profile')
      .getDocuments({})
      .find(document => document.entityId === 'profile')
    assert.equal(profile.provider, 'profile')
    assert.notEqual(profile.subtitle, 'Settings')
  })

  it('does not list Profile among the settings group', () => {
    const settings = provider('settings').getDocuments({ isParent: true })
    assert.ok(
      !settings.some(document => document.entityId === 'profile'),
      'profile must not appear under the settings provider',
    )
    assert.ok(
      settings.every(document => document.route.startsWith('/settings/')),
    )
  })

  it('no search document routes to the legacy /settings/profile', () => {
    assert.ok(
      !allDocuments().some(document => document.route === '/settings/profile'),
    )
  })

  it('keeps Subscription and other settings on their /settings routes', () => {
    const settings = provider('settings').getDocuments({ isParent: true })
    assert.equal(
      settings.find(document => document.entityId === 'account').route,
      '/settings/account',
    )
    assert.ok(
      settings.every(document => document.route.startsWith('/settings/')),
    )
  })
})

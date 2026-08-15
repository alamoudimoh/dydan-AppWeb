import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildNavSectionPlan,
  hasActiveFamilyCircle,
  NAV_LINK_IDS,
  NAV_SECTION_IDS,
} from './navModel.js'

const ROUTE_REGISTRY = {
  [NAV_LINK_IDS.HOME]: { to: '/' },
  [NAV_LINK_IDS.ALL_TASKS]: { to: '/chores' },
  [NAV_LINK_IDS.CALENDAR]: { to: '/calendar' },
  [NAV_LINK_IDS.FAMILY_PROGRESS]: { to: '/family' },
  [NAV_LINK_IDS.ARCHIVED]: { to: '/archived' },
  [NAV_LINK_IDS.MAINTENANCE]: { to: '/maintenance' },
  [NAV_LINK_IDS.ROUTINES]: { to: '/routines' },
  [NAV_LINK_IDS.CATEGORIES]: { to: 'labels' },
  [NAV_LINK_IDS.PROJECTS]: { to: 'projects' },
  [NAV_LINK_IDS.FILTERS]: { to: 'filters' },
  [NAV_LINK_IDS.ACTIVITIES]: { to: 'activities' },
  [NAV_LINK_IDS.POINTS]: { to: 'points' },
  [NAV_LINK_IDS.REWARDS]: { to: 'rewards' },
  [NAV_LINK_IDS.PROFILE]: { to: '/settings/profile' },
  [NAV_LINK_IDS.SETTINGS]: { to: '/settings' },
}

test('hasActiveFamilyCircle uses profile circle id', () => {
  assert.equal(hasActiveFamilyCircle({ circleID: 3 }), true)
  assert.equal(hasActiveFamilyCircle({ circleId: 5 }), true)
  assert.equal(hasActiveFamilyCircle({ circleID: 0 }), false)
  assert.equal(hasActiveFamilyCircle(null), false)
})

test('buildNavSectionPlan omits family when there is no active circle', () => {
  const sections = buildNavSectionPlan(false)
  assert.equal(
    sections.some(section => section.id === NAV_SECTION_IDS.FAMILY),
    false,
  )
  assert.deepEqual(
    sections.map(section => section.id),
    [
      NAV_SECTION_IDS.DAILY,
      NAV_SECTION_IDS.ORGANIZE,
      NAV_SECTION_IDS.ACCOUNT,
      NAV_SECTION_IDS.SUPPORT,
    ],
  )
})

test('buildNavSectionPlan includes family links when circle is active', () => {
  const sections = buildNavSectionPlan(true)
  const family = sections.find(section => section.id === NAV_SECTION_IDS.FAMILY)
  assert.ok(family)
  assert.deepEqual(family.linkIds, [
    NAV_LINK_IDS.FAMILY_PROGRESS,
    NAV_LINK_IDS.POINTS,
    NAV_LINK_IDS.REWARDS,
    NAV_LINK_IDS.ACTIVITIES,
  ])
})

test('active circle plan preserves legacy feature routes', () => {
  const sections = buildNavSectionPlan(true)
  const routes = sections.flatMap(section =>
    section.linkIds.map(id => ROUTE_REGISTRY[id]?.to).filter(Boolean),
  )
  assert.ok(routes.includes('/'))
  assert.ok(routes.includes('/chores'))
  assert.ok(routes.includes('/family'))
  assert.ok(routes.includes('/settings'))
  assert.ok(routes.includes('/settings/profile'))
})

test('account and support sections stay separate from product navigation', () => {
  const sections = buildNavSectionPlan(false)
  const account = sections.find(
    section => section.id === NAV_SECTION_IDS.ACCOUNT,
  )
  const support = sections.find(
    section => section.id === NAV_SECTION_IDS.SUPPORT,
  )
  const daily = sections.find(section => section.id === NAV_SECTION_IDS.DAILY)
  assert.deepEqual(account?.linkIds, [
    NAV_LINK_IDS.PROFILE,
    NAV_LINK_IDS.SETTINGS,
  ])
  assert.deepEqual(support?.linkIds, [
    NAV_LINK_IDS.FEEDBACK,
    NAV_LINK_IDS.BUG_REPORT,
  ])
  assert.ok(daily?.linkIds.includes(NAV_LINK_IDS.HOME))
  assert.equal(daily?.linkIds.includes(NAV_LINK_IDS.SETTINGS), false)
})

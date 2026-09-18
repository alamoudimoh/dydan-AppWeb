import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildNavSectionPlan,
  FAMILY_CIRCLE_ROUTE_PATHS,
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
  [NAV_LINK_IDS.CATEGORIES]: { to: '/labels' },
  [NAV_LINK_IDS.PROJECTS]: { to: '/projects' },
  [NAV_LINK_IDS.SHOPPING_LISTS]: { to: '/shopping' },
  [NAV_LINK_IDS.FILTERS]: { to: '/filters' },
  [NAV_LINK_IDS.ACTIVITIES]: { to: '/activities' },
  [NAV_LINK_IDS.POINTS]: { to: '/points' },
  [NAV_LINK_IDS.REWARDS]: { to: '/rewards' },
  [NAV_LINK_IDS.PROFILE]: { to: '/profile' },
  [NAV_LINK_IDS.SETTINGS]: { to: '/settings' },
}

const profile = { id: 1, circleID: 3 }
const onlyCurrentUser = [{ userId: 1, isActive: true, role: 'admin' }]
const withPendingMember = [
  { userId: 1, isActive: true, role: 'admin' },
  { userId: 2, isActive: false, role: 'member' },
]
const withInactiveMember = [
  { userId: 1, isActive: true, role: 'admin' },
  { userId: 2, isActive: false, role: 'member' },
]
const withActiveSecondMember = [
  { userId: 1, isActive: true, role: 'admin' },
  { userId: 2, isActive: true, role: 'member' },
]

test('hasActiveFamilyCircle hides family when only the current user is active', () => {
  assert.equal(hasActiveFamilyCircle(profile, onlyCurrentUser), false)
  assert.equal(hasActiveFamilyCircle(profile, { res: onlyCurrentUser }), false)
  assert.equal(
    hasActiveFamilyCircle({ id: 1, circleId: 5 }, onlyCurrentUser),
    false,
  )
})

test('hasActiveFamilyCircle ignores pending circle members', () => {
  assert.equal(hasActiveFamilyCircle(profile, withPendingMember), false)
})

test('hasActiveFamilyCircle ignores inactive circle members', () => {
  assert.equal(hasActiveFamilyCircle(profile, withInactiveMember), false)
})

test('hasActiveFamilyCircle shows family when another active member exists', () => {
  assert.equal(hasActiveFamilyCircle(profile, withActiveSecondMember), true)
  assert.equal(
    hasActiveFamilyCircle(profile, { res: withActiveSecondMember }),
    true,
  )
})

test('hasActiveFamilyCircle returns false without a profile', () => {
  assert.equal(hasActiveFamilyCircle(null, withActiveSecondMember), false)
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

test('family circle routes stay out of navigation without an active circle', () => {
  const sections = buildNavSectionPlan(false)
  const routes = sections.flatMap(section =>
    section.linkIds.map(id => ROUTE_REGISTRY[id]?.to).filter(Boolean),
  )
  for (const path of FAMILY_CIRCLE_ROUTE_PATHS) {
    assert.equal(routes.includes(path), false, `${path} should be hidden`)
  }
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
  assert.ok(routes.includes('/profile'))
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

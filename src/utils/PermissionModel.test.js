import assert from 'node:assert/strict'
import test from 'node:test'

import {
  EFFECTIVE_ROLES,
  hasPermission,
  normalizeCircleMembers,
  PERMISSIONS,
  resolveEffectiveRole,
  SETTINGS_PERMISSIONS,
} from './PermissionModel.js'

const members = [
  { userId: 1, role: 'admin', isActive: true },
  { userId: 2, role: 'manager', isActive: true },
  { userId: 3, role: 'member', isActive: true },
]

test('effective role uses managed-account status before Circle membership', () => {
  assert.equal(
    resolveEffectiveRole({ id: 1, userType: 1, parentUserId: 9 }, members),
    EFFECTIVE_ROLES.CHILD,
  )
  assert.equal(
    resolveEffectiveRole({ id: 1, userType: 0 }, members),
    EFFECTIVE_ROLES.OWNER,
  )
  assert.equal(
    resolveEffectiveRole({ id: 2, userType: 0 }, members),
    EFFECTIVE_ROLES.ADULT,
  )
})

test('resolveEffectiveRole accepts useCircleMembers query payload shape', () => {
  const queryPayload = {
    res: [
      { userId: 7, role: 'admin', isActive: true },
      { userId: 8, role: 'member', isActive: true },
    ],
  }

  assert.deepEqual(normalizeCircleMembers(queryPayload), queryPayload.res)
  assert.equal(
    resolveEffectiveRole({ id: 7, userType: 0 }, queryPayload),
    EFFECTIVE_ROLES.OWNER,
  )
  assert.equal(
    resolveEffectiveRole({ id: 7, userType: 0 }, null),
    EFFECTIVE_ROLES.NONE,
  )
})

test('settings routes and Circle actions share centralized capabilities', () => {
  for (const route of ['account', 'apitokens', 'circle', 'detailed', 'mfa']) {
    assert.equal(SETTINGS_PERMISSIONS[route], PERMISSIONS.MANAGE_ACCOUNT)
  }
  assert.equal(
    hasPermission(EFFECTIVE_ROLES.CHILD, PERMISSIONS.MANAGE_ACCOUNT),
    false,
  )
  assert.equal(
    hasPermission(EFFECTIVE_ROLES.ADULT, PERMISSIONS.MANAGE_CIRCLE),
    false,
  )
  assert.equal(
    hasPermission(EFFECTIVE_ROLES.OWNER, PERMISSIONS.MANAGE_CIRCLE),
    true,
  )
})

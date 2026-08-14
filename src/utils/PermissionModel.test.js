import assert from 'node:assert/strict'
import test from 'node:test'

import {
  EFFECTIVE_ROLES,
  hasPermission,
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

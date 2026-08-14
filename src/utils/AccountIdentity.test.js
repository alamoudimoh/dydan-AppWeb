import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildAccountIdentity,
  formatAuthProviderKey,
  formatEffectiveRoleKey,
  formatIdentityValue,
} from './AccountIdentity.js'
import { EFFECTIVE_ROLES } from './PermissionModel.js'

test('formatAuthProviderKey maps known provider ids', () => {
  assert.equal(formatAuthProviderKey(0), 'password')
  assert.equal(formatAuthProviderKey(2), 'google')
  assert.equal(formatAuthProviderKey(3), 'apple')
})

test('formatEffectiveRoleKey maps effective roles', () => {
  assert.equal(formatEffectiveRoleKey(EFFECTIVE_ROLES.OWNER), 'owner')
  assert.equal(formatEffectiveRoleKey(EFFECTIVE_ROLES.CHILD), 'child')
})

test('buildAccountIdentity prefers username and resolves owner role', () => {
  const profile = {
    id: 1,
    username: 'parent.user',
    email: 'parent@example.com',
    provider: 2,
    userType: 0,
  }
  const members = [{ userId: 1, role: 'admin', isActive: true }]
  const identity = buildAccountIdentity(profile, members)
  assert.equal(identity.loginIdentifier, 'parent.user')
  assert.equal(identity.providerKey, 'google')
  assert.equal(identity.effectiveRoleKey, 'owner')
})

test('formatIdentityValue trims and rejects empty strings', () => {
  assert.equal(formatIdentityValue('  hello '), 'hello')
  assert.equal(formatIdentityValue(''), null)
  assert.equal(formatIdentityValue(null), null)
})

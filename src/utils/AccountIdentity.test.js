import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildAccountIdentity,
  formatAuthProvider,
  formatEffectiveRoleLabel,
  formatIdentityValue,
} from './AccountIdentity.js'
import { EFFECTIVE_ROLES } from './PermissionModel.js'

test('formatAuthProvider maps known provider ids', () => {
  assert.equal(formatAuthProvider(0), 'Email and password')
  assert.equal(formatAuthProvider(2), 'Google')
  assert.equal(formatAuthProvider(3), 'Apple')
})

test('formatEffectiveRoleLabel maps effective roles', () => {
  assert.equal(formatEffectiveRoleLabel(EFFECTIVE_ROLES.OWNER), 'Owner')
  assert.equal(formatEffectiveRoleLabel(EFFECTIVE_ROLES.CHILD), 'Child')
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
  assert.equal(identity.providerLabel, 'Google')
  assert.equal(identity.effectiveRoleLabel, 'Owner')
})

test('formatIdentityValue trims and rejects empty strings', () => {
  assert.equal(formatIdentityValue('  hello '), 'hello')
  assert.equal(formatIdentityValue(''), null)
  assert.equal(formatIdentityValue(null), null)
})

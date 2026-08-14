import { EFFECTIVE_ROLES, resolveEffectiveRole } from './PermissionModel.js'

export const AUTH_PROVIDER_KEYS = Object.freeze({
  0: 'password',
  1: 'sso',
  2: 'google',
  3: 'apple',
})

export const formatAuthProviderKey = provider => {
  const key = Number(provider)
  return AUTH_PROVIDER_KEYS[key] ?? AUTH_PROVIDER_KEYS[0]
}

export const formatEffectiveRoleKey = role => {
  switch (role) {
    case EFFECTIVE_ROLES.OWNER:
      return 'owner'
    case EFFECTIVE_ROLES.ADULT:
      return 'adult'
    case EFFECTIVE_ROLES.CHILD:
      return 'child'
    default:
      return 'none'
  }
}

export const formatIdentityValue = value => {
  if (value == null || String(value).trim() === '') return null
  return String(value).trim()
}

export const buildAccountIdentity = (profile, circleMembers = []) => {
  const effectiveRole = resolveEffectiveRole(profile, circleMembers)
  const username = formatIdentityValue(profile?.username)
  const email = formatIdentityValue(profile?.email)

  return {
    username,
    email,
    loginIdentifier: username || email,
    providerKey: formatAuthProviderKey(profile?.provider),
    effectiveRoleKey: formatEffectiveRoleKey(effectiveRole),
  }
}

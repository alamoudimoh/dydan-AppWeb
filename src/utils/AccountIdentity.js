import { EFFECTIVE_ROLES, resolveEffectiveRole } from './PermissionModel.js'

export const AUTH_PROVIDER_LABELS = Object.freeze({
  0: 'Email and password',
  1: 'SSO',
  2: 'Google',
  3: 'Apple',
})

export const formatAuthProvider = provider => {
  const key = Number(provider)
  return AUTH_PROVIDER_LABELS[key] ?? AUTH_PROVIDER_LABELS[0]
}

export const formatEffectiveRoleLabel = role => {
  switch (role) {
    case EFFECTIVE_ROLES.OWNER:
      return 'Owner'
    case EFFECTIVE_ROLES.ADULT:
      return 'Adult'
    case EFFECTIVE_ROLES.CHILD:
      return 'Child'
    default:
      return 'None'
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
    providerLabel: formatAuthProvider(profile?.provider),
    effectiveRoleLabel: formatEffectiveRoleLabel(effectiveRole),
  }
}

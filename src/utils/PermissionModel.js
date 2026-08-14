export const EFFECTIVE_ROLES = Object.freeze({
  NONE: 'none',
  CHILD: 'child',
  ADULT: 'adult',
  OWNER: 'owner',
})

export const PERMISSIONS = Object.freeze({
  MANAGE_ACCOUNT: 'manage_account',
  MANAGE_CIRCLE: 'manage_circle',
  MANAGE_SUBACCOUNTS: 'manage_subaccounts',
})

export const resolveEffectiveRole = (profile, circleMembers = []) => {
  if (!profile) return EFFECTIVE_ROLES.NONE
  if (profile.userType === 1 || profile.parentUserId != null) {
    return EFFECTIVE_ROLES.CHILD
  }
  const membership = circleMembers.find(
    member => Number(member.userId) === Number(profile.id),
  )
  if (!membership || membership.isActive === false) return EFFECTIVE_ROLES.NONE
  return membership.role === 'admin'
    ? EFFECTIVE_ROLES.OWNER
    : EFFECTIVE_ROLES.ADULT
}

export const hasPermission = (role, permission) => {
  if (permission === PERMISSIONS.MANAGE_CIRCLE) {
    return role === EFFECTIVE_ROLES.OWNER
  }
  if (
    permission === PERMISSIONS.MANAGE_ACCOUNT ||
    permission === PERMISSIONS.MANAGE_SUBACCOUNTS
  ) {
    return role === EFFECTIVE_ROLES.OWNER || role === EFFECTIVE_ROLES.ADULT
  }
  return false
}

export const SETTINGS_PERMISSIONS = Object.freeze({
  account: PERMISSIONS.MANAGE_ACCOUNT,
  apitokens: PERMISSIONS.MANAGE_ACCOUNT,
  circle: PERMISSIONS.MANAGE_ACCOUNT,
  detailed: PERMISSIONS.MANAGE_ACCOUNT,
  mfa: PERMISSIONS.MANAGE_ACCOUNT,
  subaccounts: PERMISSIONS.MANAGE_SUBACCOUNTS,
})

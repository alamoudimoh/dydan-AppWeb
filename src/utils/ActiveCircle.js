const CIRCLE_ID_KEY = 'circleId'

/**
 * The backend session is scoped to one active Circle on the user record
 * (`profile.circleID`). Membership list order is not authoritative.
 */
export const resolveActiveCircle = (circles, activeCircleId) => {
  if (!circles?.length) return null

  const targetId = Number(activeCircleId)
  if (targetId) {
    const match = circles.find(circle => Number(circle.id) === targetId)
    if (match) return match
  }

  if (circles.length === 1) return circles[0]

  // Last resort: keep the app usable while telemetry shows mismatched data.
  return circles[0]
}

export const syncActiveCircleId = circleId => {
  if (circleId == null || circleId === '') {
    try {
      localStorage.removeItem(CIRCLE_ID_KEY)
    } catch {
      // Ignore unavailable storage.
    }
    return
  }
  try {
    localStorage.setItem(CIRCLE_ID_KEY, String(circleId))
  } catch {
    // Ignore unavailable storage.
  }
}

export const getStoredCircleId = () => {
  try {
    return localStorage.getItem(CIRCLE_ID_KEY)
  } catch {
    return null
  }
}

export const profileCircleId = profile =>
  profile?.circleID ?? profile?.circleId ?? null

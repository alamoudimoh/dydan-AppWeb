import { browserTimezone, isValidIanaTimezone } from './SchedulingDate.js'

export const initialProfileForm = profile => {
  if (!profile) return null
  return {
    displayName: profile.displayName || '',
    timezone: isValidIanaTimezone(profile.timezone)
      ? profile.timezone
      : browserTimezone(),
  }
}

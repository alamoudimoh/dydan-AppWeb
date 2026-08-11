const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_KEY = /^(\d{2}):(\d{2})$/

export const isValidIanaTimezone = value => {
  if (typeof value !== 'string' || !value.includes('/')) return value === 'UTC'
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

export const browserTimezone = () => {
  const value = Intl.DateTimeFormat().resolvedOptions().timeZone
  return isValidIanaTimezone(value) ? value : 'UTC'
}

export const supportedTimezones = () => {
  const values =
    typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : ['UTC']
  return values.includes('UTC') ? values : ['UTC', ...values]
}

// Date controls exchange numeric Gregorian YYYY-MM-DD and HH:mm values only.
// Locale strings are deliberately display-only and never cross the API.
export const localDateTimeToISOString = (dateKey, timeKey = '23:59') => {
  const dateMatch = DATE_KEY.exec(dateKey || '')
  const timeMatch = TIME_KEY.exec(timeKey || '')
  if (!dateMatch || !timeMatch)
    throw new Error('The selected date or time is invalid.')
  const [, year, month, day] = dateMatch.map(Number)
  const [, hour, minute] = timeMatch.map(Number)
  const value = new Date(year, month - 1, day, hour, minute, 0, 0)
  if (
    value.getFullYear() !== year ||
    value.getMonth() !== month - 1 ||
    value.getDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    throw new Error('The selected date or time is invalid.')
  }
  return value.toISOString()
}

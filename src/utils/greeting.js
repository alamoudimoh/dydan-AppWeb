// Date#getHours uses the browser's local timezone, not the server's timezone.
export const greetingPeriod = (date = new Date()) => {
  const hour = date.getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

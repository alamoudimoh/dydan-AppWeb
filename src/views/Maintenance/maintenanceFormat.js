export const meterRemaining = schedule => {
  if (!schedule) return null
  const delta = schedule.target - schedule.currentReading
  if (delta === 0) return 'Due now'
  if (delta < 0)
    return `${Math.abs(delta).toLocaleString()} ${schedule.unit} overdue`
  return `${delta.toLocaleString()} ${schedule.unit} remaining`
}

export const timeRemaining = value => {
  if (!value) return null
  const days = Math.ceil((new Date(value).getTime() - Date.now()) / 86400000)
  if (days === 0) return 'Due today'
  if (days < 0) return `${Math.abs(days)} day${days === -1 ? '' : 's'} overdue`
  return `Due in ${days} day${days === 1 ? '' : 's'}`
}

export const dueReason = reason =>
  ({ meter: 'Due by meter', time: 'Due by date', both: 'Due by both' })[
    reason
  ] || 'Upcoming'

export const dateKey = (value, timeZone = 'UTC') => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value))
  const part = type => parts.find(item => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export const addDays = (key, count) => {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + count))
    .toISOString()
    .slice(0, 10)
}

export const monthGrid = (selected, firstDay = 0) => {
  const [year, month] = selected.split('-').map(Number)
  const first = `${year}-${String(month).padStart(2, '0')}-01`
  const weekday = new Date(`${first}T12:00:00Z`).getUTCDay()
  const start = addDays(first, -((weekday - firstDay + 7) % 7))
  return Array.from({ length: 42 }, (_, index) => addDays(start, index))
}

// Convert a Gregorian date key at local midnight in an IANA timezone to an
// instant without relying on the browser's own timezone.
export const zonedMidnight = (key, timeZone) => {
  const [year, month, day] = key.split('-').map(Number)
  let instant = Date.UTC(year, month - 1, day)
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(instant))
    const get = type => Number(parts.find(item => item.type === type)?.value)
    const represented = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
    )
    instant += Date.UTC(year, month - 1, day) - represented
  }
  return new Date(instant).toISOString()
}

export const groupOccurrences = (items, timeZone) =>
  (items || []).reduce((groups, item) => {
    const key = dateKey(item.dueAt, timeZone)
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
    return groups
  }, {})

export const filterOccurrences = (items, filter) => {
  if (filter === 'maintenance')
    return items.filter(item => Boolean(item.meterSchedule))
  if (filter === 'meter')
    return items.filter(item => Boolean(item.meterUpdateReminder))
  if (filter === 'tasks')
    return items.filter(
      item => !item.meterSchedule && !item.meterUpdateReminder,
    )
  return items
}

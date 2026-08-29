const dayKey = (value, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value))
  const get = type => parts.find(part => part.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

const addDays = (key, days) => {
  const [year, month, day] = key.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

export const dashboardBuckets = (
  chores,
  { now = new Date(), range = 7, timeZone = 'UTC' } = {},
) => {
  const todayKey = dayKey(now, timeZone)
  const lastKey = addDays(todayKey, range)
  const sorted = [...(chores || [])].sort((a, b) => {
    if (!a.nextDueDate && !b.nextDueDate) return a.id - b.id
    if (!a.nextDueDate) return 1
    if (!b.nextDueDate) return -1
    return new Date(a.nextDueDate) - new Date(b.nextDueDate) || a.id - b.id
  })
  const overdue = []
  const today = []
  const upcoming = []
  for (const chore of sorted) {
    if (!chore.nextDueDate) continue
    const key = dayKey(chore.nextDueDate, timeZone)
    if (key < todayKey) overdue.push(chore)
    else if (key === todayKey) today.push(chore)
    else if (key <= lastKey) upcoming.push(chore)
  }
  return { overdue, today, upcoming, todayKey }
}

export const groupUpcoming = (chores, timeZone, locale) =>
  chores.reduce((groups, chore) => {
    const key = dayKey(chore.nextDueDate, timeZone)
    const existing = groups.find(group => group.key === key)
    if (existing) existing.chores.push(chore)
    else
      groups.push({
        key,
        label: new Intl.DateTimeFormat(locale, {
          timeZone,
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        }).format(new Date(chore.nextDueDate)),
        chores: [chore],
      })
    return groups
  }, [])

export const maintenanceLabel = (schedule, { locale, t }) => {
  if (!schedule) return null
  const unit = schedule.unit || ''
  if (schedule.dueReason === 'both') return t('homeToday.dueByMeterAndDate')
  if (schedule.dueReason === 'meter') return t('homeToday.dueByMeter')
  if (schedule.dueReason === 'time') return t('homeToday.dueByDate')
  if (schedule.approachingByMeter)
    return t('homeToday.approachingByMeter', {
      remaining: Number(schedule.remaining).toLocaleString(locale),
      unit,
    })
  return null
}

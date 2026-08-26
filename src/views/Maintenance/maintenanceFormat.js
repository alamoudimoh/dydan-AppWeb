export const meterRemaining = (schedule, t) => {
  if (!schedule) return null
  const delta = schedule.target - schedule.currentReading
  if (delta === 0) return t('maintenance.dueNow')
  const values = {
    count: Math.abs(delta).toLocaleString(),
    unit: schedule.unit,
  }
  return delta < 0
    ? t('maintenance.meterOverdue', values)
    : t('maintenance.meterRemaining', values)
}

export const timeRemaining = (value, t, now = Date.now()) => {
  if (!value) return null
  const days = Math.ceil((new Date(value).getTime() - now) / 86400000)
  if (days === 0) return t('maintenance.dueToday')
  if (days < 0) return t('maintenance.overdueDays', { count: Math.abs(days) })
  return t('maintenance.dueInDays', { count: days })
}

export const dueReason = (reason, t) =>
  t(`maintenance.dueReason.${reason || 'upcoming'}`)

export const routineSteps = pack =>
  (pack?.items || []).map(item => item.name || '')

const recurrenceLabel = (item, t) => {
  const labels = {
    once: t('routines.once'),
    daily: t('routines.daily'),
    weekly: t('routines.weekly'),
    monthly: t('routines.monthly'),
    yearly: t('routines.yearly'),
    interval: t('routines.recurrenceInterval', {
      count: item.frequency || 1,
      unit: t(`routines.units.${item.frequencyMetadata?.unit || 'days'}`),
    }),
    days_of_the_week: (item.frequencyMetadata?.days || [])
      .map(day => t(`routines.days.${day}`))
      .join(', '),
    day_of_the_month: t('routines.recurrenceMonthlyOnDay', {
      day: item.frequencyMetadata?.days?.[0] || 1,
    }),
  }
  return labels[item.frequencyType] || item.frequencyType
}

export const routineScheduleLabel = (pack, t) => {
  const items = pack?.items || []
  if (items.length === 0) return null
  const types = new Set(items.map(item => item.frequencyType).filter(Boolean))
  if (types.size !== 1) return null
  return recurrenceLabel(items[0], t)
}

export const routineCountLabel = (pack, t) =>
  t('routines.countTasks', { count: pack?.items?.length || 0 })

export const routineAssignees = (pack, members) => {
  const ids = new Set()
  for (const item of pack?.items || []) {
    for (const id of item.assigneeIds || []) ids.add(id)
  }
  return (members || []).filter(member => ids.has(member.userId))
}

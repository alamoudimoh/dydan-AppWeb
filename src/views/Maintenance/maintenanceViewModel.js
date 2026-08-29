const CATEGORY_EMOJI = {
  vehicle: '🚗',
  appliance: '🔧',
  hvac: '❄️',
  filter: '🧼',
  equipment: '📋',
  other: '🔨',
}

const EMOJI_FALLBACK = ['🔧', '🛠️', '⏲️', '🧰', '🔩', '📅']

const hashOf = value => {
  let hash = 0
  for (const char of String(value || '')) {
    hash = (hash * 31 + char.codePointAt(0)) | 0
  }
  return Math.abs(hash)
}

export const maintenanceEmojiFor = (category = '', name = '') => {
  const key = String(category || '').toLowerCase()
  if (CATEGORY_EMOJI[key]) return CATEGORY_EMOJI[key]
  return EMOJI_FALLBACK[hashOf(name) % EMOJI_FALLBACK.length]
}

export const maintenanceStatusFigma = status => {
  if (status === 'overdue' || status === 'due' || status === 'attention') {
    return 'overdue'
  }
  if (status === 'approaching') return 'due-soon'
  return 'ok'
}

export const maintenanceItemFigma = (item = {}, locale) => {
  const nextDue = item.nextDueDate ? new Date(item.nextDueDate) : null
  const lastDone = item.lastService?.performedAt
    ? new Date(item.lastService.performedAt)
    : null
  return {
    id: item.choreId ?? item.id,
    name: item.name,
    description: item.description || item.assetName,
    icon: maintenanceEmojiFor(item.assetCategory, item.assetName || item.name),
    status: maintenanceStatusFigma(item.status),
    nextDue: nextDue ? toDateKey(nextDue, locale) : null,
    lastDone: lastDone ? toDateKey(lastDone, locale) : null,
    intervalDays:
      Number.isFinite(Number(item.intervalDays)) && item.intervalDays > 0
        ? item.intervalDays
        : null,
    choreId: item.choreId,
    assetId: item.assetId,
  }
}

const toDateKey = (date, locale) =>
  Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(locale || undefined)

export const flattenMaintenance = (data = {}, locale) => [
  ...(data.due || []).map(item =>
    maintenanceItemFigma({ ...item, status: 'overdue' }, locale),
  ),
  ...(data.approaching || []).map(item =>
    maintenanceItemFigma({ ...item, status: 'approaching' }, locale),
  ),
  ...(data.upcoming || []).map(item =>
    maintenanceItemFigma({ ...item, status: 'upcoming' }, locale),
  ),
]

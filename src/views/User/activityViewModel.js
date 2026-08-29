const HISTORY_ACTIONS = {
  0: 'started',
  1: 'completed',
  2: 'skipped',
  3: 'pending',
  4: 'rejected',
  5: 'missed',
  6: 'rescheduled',
}

export const activityActionForHistory = status =>
  HISTORY_ACTIONS[status] || 'updated'

export const activityIconForType = type => {
  if (type === 'completed') return 'check'
  if (type === 'reward') return 'gift'
  if (type === 'goal') return 'star'
  if (type === 'streak') return 'fire'
  if (type === 'assigned') return 'user'
  return 'activity'
}

export const activityColorForType = type => {
  if (type === 'completed') return 'var(--sig-done)'
  if (type === 'reward') return 'var(--brand)'
  if (type === 'goal') return 'var(--accent)'
  if (type === 'streak') return 'var(--sig-flag)'
  if (type === 'points') return 'var(--brand)'
  return 'var(--t-muted)'
}

export const activityCategory = type => {
  if (type === 'completed' || type === 'assigned' || type === 'task') {
    return 'task'
  }
  if (type === 'reward' || type === 'goal' || type === 'streak') return type
  return 'all'
}

export const initialsForActivity = name =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || '?'

export const relativeActivityTime = (timestamp, now = Date.now()) => {
  const value = new Date(timestamp).getTime()
  if (Number.isNaN(value)) return ''
  const minutes = Math.max(0, Math.round((now - value) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export const activityEvents = (history = [], members = [], now) =>
  history
    .map(record => {
      const actorId = record.completedBy || record.assignedTo
      const member = (members || []).find(
        candidate => String(candidate.userId) === String(actorId),
      )
      const name = member?.displayName || member?.name
      const timestamp = record.performedAt || record.updatedAt
      return {
        actor: name
          ? {
              name,
              initials: member.initials || initialsForActivity(name),
              avatarColor: member.avatarColor || 'var(--brand)',
            }
          : null,
        action: activityActionForHistory(record.status),
        category: 'task',
        color: activityColorForType('completed'),
        icon: activityIconForType('completed'),
        id: record.id,
        points: record.points,
        relativeTime: relativeActivityTime(timestamp, now),
        source: record,
        timestamp,
      }
    })
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))

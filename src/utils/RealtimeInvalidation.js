/**
 * Server events are invalidation signals: the API remains authoritative and
 * the approved runtime maps several response shapes into a single UI view.
 */
export const realtimeInvalidationKeys = eventType => {
  if (eventType?.startsWith('chore.') || eventType?.startsWith('subtask.')) {
    return ['chores', 'calendar', 'history', 'notifications']
  }
  if (eventType?.startsWith('reward.')) return ['rewards', 'notifications']
  if (eventType?.startsWith('circle.') || eventType?.startsWith('member.')) {
    return ['circle', 'user', 'notifications']
  }
  return ['notifications']
}

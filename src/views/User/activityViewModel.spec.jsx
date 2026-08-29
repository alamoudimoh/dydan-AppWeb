import { describe, expect, it } from 'vitest'

import {
  activityCategory,
  activityEvents,
  activityIconForType,
  relativeActivityTime,
} from './activityViewModel'

describe('activityIconForType', () => {
  it('uses the supported fire icon for streaks', () => {
    expect(activityIconForType('streak')).toBe('fire')
  })
})

describe('activityCategory', () => {
  it('groups task variants under the Tasks filter', () => {
    expect(activityCategory('completed')).toBe('task')
    expect(activityCategory('assigned')).toBe('task')
  })
})

describe('relativeActivityTime', () => {
  it('returns compact relative timestamps', () => {
    const now = Date.UTC(2026, 0, 15, 12, 0)
    expect(relativeActivityTime(now - 5 * 60000, now)).toBe('5m ago')
    expect(relativeActivityTime(now - 2 * 86400000, now)).toBe('2d ago')
  })
})

describe('activityEvents', () => {
  it('resolves actors and orders newest first', () => {
    const events = activityEvents(
      [
        { id: 1, completedBy: 7, performedAt: '2026-01-14T12:00:00Z' },
        { id: 2, completedBy: 7, performedAt: '2026-01-15T12:00:00Z' },
      ],
      [{ userId: 7, displayName: 'Lina Smith', avatarColor: '#123456' }],
      Date.UTC(2026, 0, 15, 12, 5),
    )

    expect(events.map(event => event.id)).toEqual([2, 1])
    expect(events[0].actor).toMatchObject({
      name: 'Lina Smith',
      initials: 'LS',
    })
  })
})

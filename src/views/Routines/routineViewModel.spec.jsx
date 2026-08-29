import { describe, expect, it } from 'vitest'

import {
  routineAssignees,
  routineCountLabel,
  routineScheduleLabel,
  routineSteps,
} from './routineViewModel'

const t = key => key

describe('routineSteps', () => {
  it('maps item names to step titles', () => {
    expect(
      routineSteps({ items: [{ name: 'Brush teeth' }, { name: 'Make bed' }] }),
    ).toEqual(['Brush teeth', 'Make bed'])
    expect(routineSteps({ items: [] })).toEqual([])
  })
})

describe('routineScheduleLabel', () => {
  it('returns a label when all items share a frequency type', () => {
    expect(
      routineScheduleLabel(
        { items: [{ name: 'A', frequencyType: 'daily' }] },
        t,
      ),
    ).toBe('routines.daily')
  })
  it('returns the interval label with units', () => {
    expect(
      routineScheduleLabel(
        {
          items: [
            {
              name: 'A',
              frequencyType: 'interval',
              frequency: 2,
              frequencyMetadata: { unit: 'weeks' },
            },
          ],
        },
        t,
      ),
    ).toBe('routines.recurrenceInterval')
  })
  it('returns a weekday label for days_of_the_week', () => {
    expect(
      routineScheduleLabel(
        {
          items: [
            {
              name: 'A',
              frequencyType: 'days_of_the_week',
              frequencyMetadata: { days: ['saturday', 'monday'] },
            },
          ],
        },
        t,
      ),
    ).toBe('routines.days.saturday, routines.days.monday')
  })
  it('returns null for mixed or missing frequency types', () => {
    expect(
      routineScheduleLabel(
        {
          items: [
            { name: 'A', frequencyType: 'daily' },
            { name: 'B', frequencyType: 'weekly' },
          ],
        },
        t,
      ),
    ).toBeNull()
    expect(routineScheduleLabel({ items: [] }, t)).toBeNull()
    expect(routineScheduleLabel({ items: [{ name: 'A' }] }, t)).toBeNull()
  })
})

describe('routineCountLabel', () => {
  it('counts items', () => {
    expect(routineCountLabel({ items: [1, 2] }, t)).toBe('routines.countTasks')
  })
})

describe('routineAssignees', () => {
  const members = [
    { userId: 1, displayName: 'Lina' },
    { userId: 2, displayName: 'Sam' },
  ]
  it('collects assignee ids across items', () => {
    expect(
      routineAssignees(
        { items: [{ assigneeIds: [1] }, { assigneeIds: [2, 1] }] },
        members,
      ),
    ).toEqual([members[0], members[1]])
  })
  it('returns no members when unassigned', () => {
    expect(routineAssignees({ items: [] }, members)).toEqual([])
  })
})

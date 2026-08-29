import { describe, expect, it } from 'vitest'

import {
  flattenMaintenance,
  maintenanceEmojiFor,
  maintenanceStatusFigma,
} from './maintenanceViewModel'

describe('maintenanceStatusFigma', () => {
  it('maps production statuses to the Figma status set', () => {
    expect(maintenanceStatusFigma('due')).toBe('overdue')
    expect(maintenanceStatusFigma('approaching')).toBe('due-soon')
    expect(maintenanceStatusFigma('upcoming')).toBe('ok')
  })
})

describe('maintenanceEmojiFor', () => {
  it('uses a stable category icon when one is available', () => {
    expect(maintenanceEmojiFor('Vehicle', 'Car')).toBe('🚗')
    expect(maintenanceEmojiFor('', 'Boiler')).toBe(
      maintenanceEmojiFor('', 'Boiler'),
    )
  })
})

describe('flattenMaintenance', () => {
  it('keeps the source bucket status authoritative', () => {
    const items = flattenMaintenance({
      due: [{ choreId: 1, name: 'Oil change', status: 'upcoming' }],
      approaching: [{ choreId: 2, name: 'Filter', status: 'due' }],
      upcoming: [{ choreId: 3, name: 'Service', status: 'due' }],
    })

    expect(items.map(item => item.status)).toEqual([
      'overdue',
      'due-soon',
      'ok',
    ])
  })
})

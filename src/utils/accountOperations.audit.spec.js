import { describe, expect, it } from 'vitest'

import { parseAccountResponse } from './AccountResponse'
import {
  nativeCapturePath,
  nativeInvitePath,
  nativeTaskPath,
} from './NativeRoutes'
import { realtimeInvalidationKeys } from './RealtimeInvalidation'

const response = (ok, status, body) => ({
  ok,
  status,
  json: async () => body,
})

describe('approved settings operations', () => {
  it('only accepts a real successful account mutation response', async () => {
    await expect(
      parseAccountResponse(response(false, 403, { error: 'Not allowed' })),
    ).rejects.toThrow('Not allowed')

    await expect(
      parseAccountResponse(response(true, 200, { res: { sessions: [] } })),
    ).resolves.toEqual({ sessions: [] })
  })

  it('keeps native deep links inside approved runtime routes', () => {
    expect(nativeTaskPath(12, 'true')).toBe(
      '/all-tasks?task=12&auto_complete=true',
    )
    expect(nativeCapturePath('scan')).toBe('/all-tasks?create=1&mode=scan')
    expect(nativeInvitePath('team code')).toBe(
      '/settings?invite_code=team%20code',
    )
  })

  it('uses server events to invalidate task projections instead of trusting payloads', () => {
    expect(realtimeInvalidationKeys('chore.completed')).toEqual([
      'chores',
      'calendar',
      'history',
      'notifications',
    ])
  })
})

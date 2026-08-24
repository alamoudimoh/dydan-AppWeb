// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('../utils/ApiClient', () => ({
  apiClient: mocks,
}))

vi.mock('../utils/TokenStorage', () => ({
  hasAccessToken: () => true,
}))

import { sessionApi, SessionApiError } from './SessionQueries.jsx'

const response = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: vi.fn().mockResolvedValue(body),
})

describe('sessionApi', () => {
  beforeEach(() => {
    mocks.get.mockReset()
    mocks.delete.mockReset()
    mocks.post.mockReset()
  })

  it('uses the exact Phase 3 list response contract', async () => {
    const sessions = [
      {
        id: 'family-id',
        createdAt: '2026-08-24T05:00:00Z',
        lastActiveAt: '2026-08-24T06:00:00Z',
        expiresAt: '2026-10-24T06:00:00Z',
        current: true,
      },
    ]
    mocks.get.mockResolvedValue(response(200, { res: { sessions } }))

    await expect(sessionApi.list()).resolves.toEqual(sessions)
    expect(mocks.get).toHaveBeenCalledWith('/auth/sessions')
  })

  it('revokes one encoded session family and all other sessions', async () => {
    mocks.delete.mockResolvedValue(response(200, { message: 'ok' }))
    mocks.post.mockResolvedValue(response(200, { message: 'ok' }))

    await sessionApi.revoke('family/with separator')
    await sessionApi.revokeOthers()

    expect(mocks.delete).toHaveBeenCalledWith(
      '/auth/sessions/family%2Fwith%20separator',
    )
    expect(mocks.post).toHaveBeenCalledWith('/auth/sessions/revoke-others')
  })

  it('preserves response status for graceful stale-session handling', async () => {
    mocks.delete.mockResolvedValue(response(404, { error: 'not found' }))

    await expect(sessionApi.revoke('stale')).rejects.toMatchObject({
      name: 'SessionApiError',
      status: 404,
    })
    expect(new SessionApiError(500).status).toBe(500)
  })

  it('rejects malformed success envelopes instead of hiding sessions', async () => {
    mocks.get.mockResolvedValue(response(200, { res: [] }))

    await expect(sessionApi.list()).rejects.toMatchObject({
      name: 'SessionApiError',
      status: 502,
    })
  })

  it.each([
    { label: 'null entry', value: null },
    {
      label: 'non-boolean current marker',
      value: { id: 'broken', current: 'false' },
    },
    {
      label: 'invalid timestamp',
      value: {
        id: 'broken',
        current: false,
        createdAt: 'not-a-date',
        lastActiveAt: '2026-08-24T06:00:00Z',
        expiresAt: '2026-10-24T06:00:00Z',
      },
    },
  ])('rejects a malformed $label', async ({ value }) => {
    mocks.get.mockResolvedValue(response(200, { res: { sessions: [value] } }))

    await expect(sessionApi.list()).rejects.toMatchObject({ status: 502 })
  })

  it('never persists tokens while managing sessions', async () => {
    const localSet = vi.spyOn(window.localStorage, 'setItem')
    const sessionSet = vi.spyOn(window.sessionStorage, 'setItem')
    mocks.get.mockResolvedValue(response(200, { res: { sessions: [] } }))
    mocks.post.mockResolvedValue(response(200, { message: 'ok' }))

    await sessionApi.list()
    await sessionApi.revokeOthers()

    expect(localSet).not.toHaveBeenCalled()
    expect(sessionSet).not.toHaveBeenCalled()
    localSet.mockRestore()
    sessionSet.mockRestore()
  })
})

import { useMutation, useQuery } from '@tanstack/react-query'

import { apiClient } from '../utils/ApiClient'
import { hasAccessToken } from '../utils/TokenStorage'

export class SessionApiError extends Error {
  constructor(status) {
    super('Session request failed')
    this.name = 'SessionApiError'
    this.status = status
  }
}

const parseResponse = async response => {
  if (!response) throw new SessionApiError(401)

  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new SessionApiError(response.status)
  return body
}

const validateSessions = sessions => {
  const ids = new Set()
  let currentCount = 0

  for (const session of sessions) {
    if (
      !session ||
      typeof session.id !== 'string' ||
      !session.id ||
      ids.has(session.id) ||
      typeof session.current !== 'boolean' ||
      !['createdAt', 'lastActiveAt', 'expiresAt'].every(
        key =>
          typeof session[key] === 'string' &&
          Number.isFinite(Date.parse(session[key])),
      )
    ) {
      throw new SessionApiError(502)
    }

    ids.add(session.id)
    if (session.current) currentCount += 1
  }

  if (currentCount > 1) throw new SessionApiError(502)
  return sessions
}

export const sessionApi = {
  list: async () => {
    const body = await apiClient.get('/auth/sessions').then(parseResponse)
    if (!Array.isArray(body?.res?.sessions)) throw new SessionApiError(502)
    return validateSessions(body.res.sessions)
  },
  revoke: sessionId =>
    apiClient
      .delete(`/auth/sessions/${encodeURIComponent(sessionId)}`)
      .then(parseResponse),
  revokeOthers: () =>
    apiClient.post('/auth/sessions/revoke-others').then(parseResponse),
}

export const sessionKeys = {
  all: userId => ['authSessions', userId],
}

export const useSessions = userId =>
  useQuery({
    queryKey: sessionKeys.all(userId),
    queryFn: sessionApi.list,
    enabled: Boolean(userId && hasAccessToken()),
    refetchOnMount: 'always',
  })

export const useRevokeSession = () =>
  useMutation({ mutationFn: sessionApi.revoke })

export const useRevokeOtherSessions = () =>
  useMutation({ mutationFn: sessionApi.revokeOthers })

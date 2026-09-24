import { Capacitor } from '@capacitor/core'
import { useQueryClient } from '@tanstack/react-query'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { useEffect, useRef } from 'react'

import { apiClient } from '../utils/ApiClient'
import { realtimeInvalidationKeys } from '../utils/RealtimeInvalidation'
import { getAccessToken } from '../utils/TokenStorage'
import { KEYS } from './useHousehold'

const keyForPrefix = prefix => {
  const keys = {
    calendar: KEYS.calendar,
    chores: KEYS.chores,
    circle: KEYS.members,
    history: KEYS.history,
    notifications: KEYS.notifications,
    rewards: KEYS.rewards,
    user: KEYS.profile,
  }
  return keys[prefix]
}

/** Synchronize React Query projections from the authenticated server SSE feed. */
export function useRealtimeSync(isAuthenticated: boolean) {
  const queryClient = useQueryClient()
  const sourceRef = useRef<EventSource | EventSourcePolyfill | null>(null)

  useEffect(() => {
    const token = getAccessToken()
    if (!isAuthenticated || !token) return undefined

    let disposed = false
    const close = () => {
      sourceRef.current?.close()
      sourceRef.current = null
    }
    const invalidate = (event: MessageEvent<string>) => {
      let type = ''
      try {
        type = (JSON.parse(event.data) as { type?: string }).type ?? ''
      } catch {
        return
      }
      for (const prefix of realtimeInvalidationKeys(type)) {
        const queryKey = keyForPrefix(prefix)
        if (queryKey) void queryClient.invalidateQueries({ queryKey })
      }
    }
    const connect = async () => {
      const baseURL = apiClient.getApiURL()
      let source: EventSource | EventSourcePolyfill
      if (Capacitor.isNativePlatform()) {
        const response = await apiClient.get('/realtime/sse/ticket')
        const body = await response.json().catch(() => ({}))
        if (!response.ok || typeof body.ticket !== 'string') return
        source = new EventSource(
          `${baseURL}/realtime/sse?ticket=${encodeURIComponent(body.ticket)}`,
        )
      } else {
        source = new EventSourcePolyfill(`${baseURL}/realtime/sse`, {
          headers: { Authorization: `Bearer ${token}` },
          heartbeatTimeout: 45_000,
        })
      }
      if (disposed) {
        source.close()
        return
      }
      sourceRef.current = source
      source.onmessage = invalidate
      source.addEventListener('heartbeat', invalidate)
    }

    // StrictMode intentionally mounts effects twice in development. Delay the
    // connection one tick so its first probe is cleaned up before it reaches
    // the rate-limited server endpoint.
    const connectTimer = window.setTimeout(() => void connect(), 250)
    return () => {
      disposed = true
      window.clearTimeout(connectTimer)
      close()
    }
  }, [isAuthenticated, queryClient])
}

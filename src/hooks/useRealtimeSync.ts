import { Capacitor } from '@capacitor/core'
import { useQueryClient } from '@tanstack/react-query'
import type { Event as PolyfillEvent } from 'event-source-polyfill'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { useEffect, useRef } from 'react'

import { apiClient } from '../utils/ApiClient'
import { realtimeInvalidationKeys } from '../utils/RealtimeInvalidation'
import { getAccessToken } from '../utils/TokenStorage'
import { KEYS } from './useHousehold'

const keyForPrefix = (prefix: string) => {
  const keys = {
    calendar: ['calendar'] as const,
    chores: KEYS.chores,
    circle: KEYS.members,
    history: ['history'] as const,
    notifications: KEYS.notifications,
    rewards: KEYS.rewards,
    user: KEYS.profile,
  }
  return keys[prefix as keyof typeof keys]
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
    const invalidate = (event: { data: string }) => {
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
      // WebKit's EventSource polyfill can drop custom request headers. Obtain
      // the server's short-lived, single-use credential through the regular
      // authenticated API client, then use it for the SSE handshake on every
      // platform. This also keeps the bearer access token out of the URL.
      const response = await apiClient.get('/realtime/sse/ticket')
      const body = await response.json().catch(() => ({}))
      if (!response.ok || typeof body.ticket !== 'string') return
      const sseURL = `${baseURL}/realtime/sse?ticket=${encodeURIComponent(body.ticket)}`
      let source: EventSource | EventSourcePolyfill
      if (Capacitor.isNativePlatform()) {
        source = new EventSource(sseURL)
      } else {
        source = new EventSourcePolyfill(sseURL, {
          heartbeatTimeout: 45_000,
        })
      }
      if (disposed) {
        source.close()
        return
      }
      sourceRef.current = source
      source.onmessage = invalidate
      const onHeartbeat = (event: Event | PolyfillEvent) => {
        if ('data' in event && typeof event.data === 'string') {
          invalidate({ data: event.data })
        }
      }
      // Native and polyfilled EventSource expose incompatible listener overloads.
      if (source instanceof EventSourcePolyfill) {
        source.addEventListener('heartbeat', onHeartbeat)
      } else {
        source.addEventListener('heartbeat', onHeartbeat)
      }
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

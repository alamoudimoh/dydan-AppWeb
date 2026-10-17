import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import type { AppCtx } from '../App'
import { Icon } from '../ui/Icon'

/**
 * A network probe against the API origin rather than `navigator.onLine`.
 *
 * `navigator.onLine` only reports whether the device has *a* network
 * interface; it stays `true` behind a captive portal or when the dydan server
 * itself is unreachable, so trusting it would let "Try again" claim a
 * reconnection that never happened. HEAD is used because every dydan API
 * rejects it cheaply during the auth middleware without touching the database.
 */
async function probeApi(): Promise<boolean> {
  try {
    const response = await fetch('/api/v1/users/profile', {
      method: 'HEAD',
      cache: 'no-store',
    })
    // Any HTTP status proves the server answered; 401 is a healthy response to
    // an unauthenticated probe and is exactly what we expect here.
    return response.status < 500
  } catch {
    return false
  }
}

export function OfflineScreen({ ctx }: { ctx: AppCtx }) {
  const queryClient = useQueryClient()
  const [checking, setChecking] = useState(false)
  const [stillOffline, setStillOffline] = useState(false)

  /**
   * Re-probes the API and, only on a real answer, invalidates the live queries
   * so the screens the user lands on reload from the server. Nothing is claimed
   * about queued or locally-saved writes: the client has no offline mutation
   * queue, so a change made while disconnected is genuinely not stored.
   */
  const tryAgain = async () => {
    if (checking) return
    setChecking(true)
    setStillOffline(false)
    try {
      const reachable = await probeApi()
      if (!reachable) {
        setStillOffline(true)
        return
      }
      await queryClient.invalidateQueries()
      ctx.navigate('home')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div
      className='flex flex-col items-center justify-center px-4'
      style={{ height: 'calc(100vh - 140px)' }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Icon name='wifi_off' size={32} style={{ color: 'var(--t-muted)' }} />
      </div>
      <h2
        className='text-primary font-bold'
        style={{ fontSize: 20, marginBottom: 8, textAlign: 'center' }}
      >
        You're offline
      </h2>
      <p
        className='text-muted'
        style={{
          fontSize: 14,
          textAlign: 'center',
          maxWidth: 340,
          marginBottom: 24,
          lineHeight: 1.5,
        }}
      >
        dydan can't reach the server from this device. Changes you make while
        disconnected can't be saved — reconnect, then use Try again to reload
        your data.
      </p>
      {stillOffline && (
        <div
          className='badge mb-4'
          role='status'
          style={{ background: 'var(--sig-over-bg)', color: 'var(--sig-over)' }}
        >
          Still can't reach the server
        </div>
      )}
      <div className='flex gap-3'>
        <button
          className='btn btn-secondary'
          onClick={() => ctx.navigate('home')}
          disabled={checking}
        >
          Go to Home
        </button>
        <button
          className='btn btn-primary'
          onClick={() => void tryAgain()}
          disabled={checking}
        >
          <Icon name='refresh' size={14} />
          {checking ? 'Checking…' : 'Try again'}
        </button>
      </div>
    </div>
  )
}

export function UnavailableScreen({ ctx }: { ctx: AppCtx }) {
  const queryClient = useQueryClient()
  const isFetching = useIsFetching()
  const [retried, setRetried] = useState(false)

  /**
   * Retries the queries that failed to load instead of navigating away and
   * leaving the user to discover a still-broken dashboard.
   */
  const retry = async () => {
    setRetried(true)
    await queryClient.refetchQueries({
      predicate: query => query.state.status === 'error',
    })
  }

  return (
    <div
      className='flex flex-col items-center justify-center px-4'
      style={{ height: 'calc(100vh - 140px)' }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Icon name='database' size={32} style={{ color: 'var(--t-muted)' }} />
      </div>
      <h2
        className='text-primary font-bold'
        style={{ fontSize: 20, marginBottom: 8, textAlign: 'center' }}
      >
        Data unavailable
      </h2>
      <p
        className='text-muted'
        style={{
          fontSize: 14,
          textAlign: 'center',
          maxWidth: 340,
          marginBottom: 24,
          lineHeight: 1.5,
        }}
      >
        We couldn't load this content right now. Retry re-requests the data from
        the server; if it still fails, the problem is on the server rather than
        in this browser.
      </p>
      <div className='flex gap-3'>
        <button
          className='btn btn-secondary'
          onClick={() => ctx.navigate('home')}
        >
          Go to Home
        </button>
        <button
          className='btn btn-primary'
          onClick={() => void retry()}
          disabled={isFetching > 0}
        >
          <Icon name='refresh' size={14} />
          {isFetching > 0 ? 'Retrying…' : 'Retry'}
        </button>
      </div>
      {retried && isFetching === 0 && (
        <div className='text-faint mt-4' style={{ fontSize: 12 }} role='status'>
          The server could not return this data. Try again in a moment.
        </div>
      )}
    </div>
  )
}

export function PermissionDeniedScreen({ ctx }: { ctx: AppCtx }) {
  return (
    <div
      className='flex flex-col items-center justify-center px-4'
      style={{ height: 'calc(100vh - 140px)' }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--sig-over-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Icon name='lock' size={32} style={{ color: 'var(--sig-over)' }} />
      </div>
      <h2
        className='text-primary font-bold'
        style={{ fontSize: 20, marginBottom: 8, textAlign: 'center' }}
      >
        Access restricted
      </h2>
      <p
        className='text-muted'
        style={{
          fontSize: 14,
          textAlign: 'center',
          maxWidth: 300,
          marginBottom: 24,
          lineHeight: 1.5,
        }}
      >
        You don't have permission to view this content. This area is reserved
        for household admins.
      </p>
      <button className='btn btn-primary' onClick={() => ctx.navigate('home')}>
        Return to Home
      </button>
    </div>
  )
}

// @vitest-environment jsdom

import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sentryMock = vi.hoisted(() => ({
  init: vi.fn(),
  ErrorBoundary: ({ children }) => children,
}))

vi.mock('@sentry/react', () => sentryMock)

import {
  initSentry,
  parseSampleRate,
  readSentryConfig,
  sanitizeSentryEvent,
  SentryBoundary,
} from './sentry.jsx'

const DSN = 'https://example@o0.ingest.sentry.io/0'

describe('Sentry baseline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('does not initialize Sentry without a DSN', () => {
    vi.stubEnv('VITE_SENTRY_DSN', '')
    expect(initSentry()).toBe(false)
    expect(sentryMock.init).not.toHaveBeenCalled()
  })

  it('does not send events in smoke/test environments without a DSN', () => {
    vi.stubEnv('MODE', 'smoke')
    vi.stubEnv('VITE_SENTRY_DSN', '')
    expect(initSentry()).toBe(false)
    expect(sentryMock.init).not.toHaveBeenCalled()
  })

  it('initializes with the expected configuration when a DSN is present', () => {
    vi.stubEnv('VITE_SENTRY_DSN', DSN)
    vi.stubEnv('VITE_SENTRY_ENVIRONMENT', 'production')
    vi.stubEnv('VITE_SENTRY_TRACES_SAMPLE_RATE', '0')
    expect(initSentry()).toBe(true)
    expect(sentryMock.init).toHaveBeenCalledTimes(1)
    expect(sentryMock.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: DSN,
        environment: 'production',
        tracesSampleRate: 0,
        beforeSend: sanitizeSentryEvent,
      }),
    )
  })

  it('defaults traces sample rate to 0', () => {
    vi.stubEnv('VITE_SENTRY_DSN', DSN)
    vi.stubEnv('VITE_SENTRY_TRACES_SAMPLE_RATE', '')
    expect(readSentryConfig().tracesSampleRate).toBe(0)
  })

  it('parses a configured traces sample rate', () => {
    expect(parseSampleRate('0.25')).toBe(0.25)
  })

  it.each(['abc', '-1', '2', 'NaN', '0.5.5'])(
    'falls back to 0 for malformed sample rate %s',
    value => {
      expect(parseSampleRate(value)).toBe(0)
    },
  )

  it('removes sensitive fields from headers, extras, and contexts', () => {
    const event = {
      message: 'boom',
      user: { id: '123' },
      request: {
        url: 'https://daydan.example/auth/oauth2?code=secret&state=secret-state&safe=1',
        headers: {
          authorization: 'Bearer secret',
          cookie: 'a=b',
          'content-type': 'application/json',
        },
      },
      extra: {
        safe: 'keep',
        token: 'abc',
        nested: { password: 'hunter2', name: 'ok' },
      },
      contexts: {
        runtime: { name: 'browser' },
        auth: { accessToken: 'x' },
      },
    }
    const scrubbed = sanitizeSentryEvent(event)
    expect(scrubbed.user).toBeNull()
    expect(scrubbed.request.headers.authorization).toBeUndefined()
    expect(scrubbed.request.headers.cookie).toBeUndefined()
    expect(scrubbed.request.headers['content-type']).toBe('application/json')
    expect(scrubbed.request.url).toContain('safe=1')
    expect(scrubbed.request.url).not.toContain('secret')
    expect(scrubbed.extra.safe).toBe('keep')
    expect(scrubbed.extra.token).toBeUndefined()
    expect(scrubbed.extra.nested.password).toBeUndefined()
    expect(scrubbed.extra.nested.name).toBe('ok')
    expect(scrubbed.contexts.auth.accessToken).toBeUndefined()
    expect(scrubbed.contexts.runtime.name).toBe('browser')
  })

  it('scrubs OAuth URLs without request headers and in breadcrumbs', () => {
    const secretUrl =
      'https://daydan.example/auth/oauth2?code=secret&state=secret-state'
    const scrubbed = sanitizeSentryEvent({
      request: { url: secretUrl },
      breadcrumbs: [
        {
          data: { from: secretUrl, to: secretUrl, url: secretUrl },
        },
      ],
    })
    expect(scrubbed.request.url).not.toContain('secret')
    expect(scrubbed.breadcrumbs[0].data.url).not.toContain('secret')
    expect(scrubbed.breadcrumbs[0].data.from).not.toContain('secret')
    expect(scrubbed.breadcrumbs[0].data.to).not.toContain('secret')
  })

  it('renders children directly when Sentry is disabled', () => {
    vi.stubEnv('VITE_SENTRY_DSN', '')
    const { getByText } = render(
      <SentryBoundary>
        <div>child</div>
      </SentryBoundary>,
    )
    expect(getByText('child')).toBeTruthy()
  })
})

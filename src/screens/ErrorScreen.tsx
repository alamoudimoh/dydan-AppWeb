import { useMemo, useState } from 'react'

import { AppCtx, Icon } from '../App'
import { useLiveData } from '../model/liveData'
import { parseAccountResponse } from '../utils/AccountResponse'
import * as Fetcher from '../utils/Fetcher'
import { getAccessToken } from '../utils/TokenStorage'

type ReportState = 'idle' | 'sending' | 'sent' | 'failed'

/**
 * The approved error screen is a real reporting surface, not a static mock.
 *
 * Every field below is read from the live runtime at render time — there are no
 * hardcoded timestamps, build ids, or error codes — and "Report this problem"
 * POSTs that text to `POST /users/error-reports`, which stamps the
 * authenticated user, circle, user agent, and request path server-side.
 */
export default function ErrorScreen({ ctx }: { ctx: AppCtx }) {
  const { profile } = useLiveData()
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [reportState, setReportState] = useState<ReportState>('idle')
  const [reportError, setReportError] = useState<string | null>(null)

  // A fresh report describes the moment the screen is opened, so it is
  // captured once per visit rather than recomputed on every render.
  const capturedAt = useMemo(() => new Date(), [])

  const report = useMemo(() => {
    const lines = [
      'dydan error report',
      '-------------------',
      `Captured: ${capturedAt.toISOString()}`,
      `User: ${profile?.email ?? 'signed out'}`,
      `Circle: ${profile?.circleID ?? 'unknown'}`,
      `Page: ${typeof window === 'undefined' ? 'unknown' : window.location.pathname}`,
      `Network: ${typeof navigator === 'undefined' || navigator.onLine ? 'browser reports online' : 'browser reports offline'}`,
      `Session: ${getAccessToken() ? 'authenticated' : 'no access token'}`,
    ]
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      lines.push(`User agent: ${navigator.userAgent}`)
    }
    lines.push(
      '',
      'The report contains the fields above only. No passwords, tokens,',
      'payment data, or message content are included.',
    )
    return lines.join('\n')
  }, [capturedAt, profile?.email, profile?.circleID])

  /**
   * Copies the diagnostic and only reports "Copied" once the clipboard has
   * actually accepted the write; a rejected or unavailable clipboard surfaces
   * an error instead of a false confirmation.
   */
  const copyReport = async () => {
    setCopyError(null)
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('This browser blocked clipboard access.')
      }
      await navigator.clipboard.writeText(report)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setCopied(false)
      setCopyError(
        err instanceof Error ? err.message : 'Could not copy to the clipboard.',
      )
    }
  }

  const submitReport = async () => {
    if (reportState === 'sending' || reportState === 'sent') return
    setReportState('sending')
    setReportError(null)
    try {
      await parseAccountResponse(
        Fetcher.ReportError({
          summary: `Client error on ${typeof window === 'undefined' ? 'unknown' : window.location.pathname}`,
          details: report,
          screen: 'error',
        }),
      )
      setReportState('sent')
    } catch (err) {
      setReportState('failed')
      setReportError(
        err instanceof Error ? err.message : 'Could not submit this report.',
      )
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 60px' }}>
      <div className='px-4 md:px-7 pt-6'>
        {/* Error card */}
        <div
          className='card p-6 mb-5'
          style={{
            border: '1px solid var(--sig-over)',
            borderRadius: 'var(--r-xl)',
          }}
        >
          <div className='flex items-start gap-4'>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--r-lg)',
                background: 'var(--sig-over-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon
                name='error'
                size={24}
                style={{ color: 'var(--sig-over)' }}
              />
            </div>
            <div>
              <h2
                className='font-bold text-primary mb-1'
                style={{ fontSize: 18 }}
              >
                Something went wrong
              </h2>
              <div
                className='text-muted'
                style={{ fontSize: 13, lineHeight: 1.5 }}
              >
                dydan hit an unexpected error while loading this page. Reloading
                usually recovers it; if it keeps happening, send the report
                below so an administrator can investigate.
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex flex-col gap-3 mb-5'>
          <button
            className='btn btn-primary'
            style={{ justifyContent: 'center' }}
            onClick={() => window.location.reload()}
          >
            <Icon name='refresh' size={16} />
            Retry
          </button>
          <button
            className='btn btn-secondary'
            style={{ justifyContent: 'center' }}
            onClick={() => ctx.navigate('home')}
          >
            Dismiss and continue
          </button>
        </div>

        {/* Report section */}
        <div className='card overflow-hidden'>
          <button
            className='w-full flex items-center justify-between px-5 py-4'
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
            }}
            aria-expanded={showDetails}
            onClick={() => setShowDetails(!showDetails)}
          >
            <div className='flex items-center gap-3'>
              <Icon name='info' size={16} style={{ color: 'var(--t-muted)' }} />
              <span
                className='font-medium text-primary'
                style={{ fontSize: 14 }}
              >
                Report this problem
              </span>
            </div>
            <Icon
              name='chevron_down'
              size={16}
              style={{
                color: 'var(--t-faint)',
                transform: showDetails ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </button>

          {showDetails && (
            <div
              className='border-t border-line px-5 py-4 flex flex-col gap-4'
              style={{ borderColor: 'var(--line)' }}
            >
              <div
                className='rounded-lg p-4 overflow-x-auto'
                style={{
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--r-md)',
                }}
              >
                <pre
                  className='text-primary'
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    lineHeight: 1.6,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {report}
                </pre>
              </div>

              <div className='flex gap-2'>
                <button
                  className='btn btn-secondary flex-1'
                  style={{ justifyContent: 'center' }}
                  onClick={() => void copyReport()}
                  title='Copy to clipboard'
                >
                  <Icon name={copied ? 'check' : 'copy'} size={14} />
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  className='btn btn-primary flex-1'
                  style={{ justifyContent: 'center' }}
                  onClick={() => void submitReport()}
                  disabled={reportState === 'sending' || reportState === 'sent'}
                >
                  <Icon
                    name={reportState === 'sent' ? 'check' : 'info'}
                    size={14}
                  />
                  {reportState === 'sending'
                    ? 'Sending…'
                    : reportState === 'sent'
                      ? 'Report sent'
                      : 'Send report'}
                </button>
              </div>

              {copyError && (
                <div
                  className='text-sm'
                  role='alert'
                  style={{ color: 'var(--sig-over)' }}
                >
                  {copyError}
                </div>
              )}

              {reportState === 'failed' && (
                <div
                  className='text-sm'
                  role='alert'
                  style={{ color: 'var(--sig-over)' }}
                >
                  {reportError ??
                    'The server could not record this report. Copy the details and share them with your administrator instead.'}
                </div>
              )}

              {reportState === 'sent' && (
                <div
                  className='text-sm'
                  role='status'
                  style={{ color: 'var(--sig-done)' }}
                >
                  Your administrator can now see this report.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

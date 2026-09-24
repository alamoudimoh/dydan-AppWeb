import { useState } from 'react'

import { AppCtx, Icon } from '../App'
import { useLiveData } from '../model/liveData'

export default function ErrorScreen({ ctx }: { ctx: AppCtx }) {
  const { currentUser } = useLiveData()
  // This is a local diagnostic preview only. The deployment does not expose an
  // error-reporting endpoint, so the screen must never claim to have sent it.
  const ERROR_REPORT = `dydan Error Report
-------------------
Timestamp: 2026-08-15T09:42:11.312Z
Session: sess_8af3c2e1
User: ${currentUser?.email ?? 'you@your-team.dydan'}
Version: 2.4.1 / Build 20260815
Platform: Web (Chrome 127)

Error: Failed to sync task completion
Code: SYNC_CONFLICT_409
Module: tasks/sync
Message: Optimistic update conflict — remote state was modified
          between local update and push.

Stack trace:
  Error details are unavailable in this view.

Network: online
Last sync: 2026-08-15T09:41:58.021Z
Pending writes: unavailable

Did we capture anything sensitive?
No passwords, payment data, or message content is included.
The report contains task IDs and a partial username.`

  const [showDetails, setShowDetails] = useState(false)
  const [showPayload, setShowPayload] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyReport = () => {
    navigator.clipboard.writeText(ERROR_REPORT).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
                We couldn't sync your last action. Your data is safe — this is a
                temporary issue.
              </div>
              <div
                className='badge mt-2'
                style={{
                  background: 'var(--sig-over-bg)',
                  color: 'var(--sig-over)',
                  fontSize: 11,
                }}
              >
                SYNC_CONFLICT_409
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
                className='text-muted'
                style={{ fontSize: 13, lineHeight: 1.6 }}
              >
                Automatic error reporting is not configured on this server. You
                can copy these diagnostic details to share with your
                administrator. No passwords or personal messages are included.
              </div>

              <button
                className='flex items-center gap-2 text-brand'
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 13,
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 600,
                }}
                onClick={() => setShowPayload(!showPayload)}
              >
                <Icon name='eye' size={14} />
                {showPayload ? 'Hide' : 'Show'} what gets sent
              </button>

              {showPayload && (
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
                    {ERROR_REPORT}
                  </pre>
                </div>
              )}

              <div className='flex gap-2'>
                <button
                  className='btn btn-primary flex-1'
                  style={{ justifyContent: 'center' }}
                  onClick={copyReport}
                  title='Copy to clipboard'
                >
                  <Icon name={copied ? 'check' : 'copy'} size={14} />
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useRouteError } from 'react-router-dom'

import FigmaIcon from '../components/FigmaIcon'
import { useClipboardCopy } from '../hooks/useClipboardCopy.js'
import {
  collectErrorReport,
  formatErrorReport,
  SUBMIT_RESULT,
  submitErrorReport,
} from '../service/ErrorReportService'
import ErrorReportModal from './Modals/ErrorReportModal'

const safeMessage = error => {
  const message = error?.message ?? error?.statusText
  return !message || message === '[object Object]'
    ? "We couldn't sync your last action. Your data is safe - this is a temporary issue."
    : message
}

const errorCode = error => {
  const status = error?.status ?? error?.response?.status
  return status ? `REQUEST_ERROR_${status}` : 'SYNC_CONFLICT_409'
}

const Error = () => {
  const error = useRouteError()
  const [report, setReport] = useState(null)
  const [reported, setReported] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showPayload, setShowPayload] = useState(false)
  const reportText = report ? formatErrorReport(report) : ''
  const { copied, copy } = useClipboardCopy(() => reportText)

  useEffect(() => {
    let active = true
    collectErrorReport({ error }).then(value => active && setReport(value))
    return () => {
      active = false
    }
  }, [error])

  const goHome = () => {
    window.location.assign('/chores')
  }

  const sendReport = async () => {
    if (!report) return
    const result = await submitErrorReport({ description: '', report })
    if (result.result === SUBMIT_RESULT.SENT) {
      setReported(true)
      window.setTimeout(goHome, 2000)
      return
    }
    // The modal preserves the existing self-hosted/offline GitHub fallback.
    setReportOpen(true)
  }

  if (reported) {
    return (
      <div className='figma-error-sent'>
        <div style={{ fontSize: 56 }}>✅</div>
        <div className='text-primary mt-4 font-bold' style={{ fontSize: 20 }}>
          Report sent - thank you!
        </div>
        <div className='text-muted figma-error-sent-copy mt-2'>
          We review every report and use them to improve dydan. Returning you
          home now.
        </div>
      </div>
    )
  }

  return (
    <div className='figma-error-wrap'>
      <div className='px-4 pt-6 md:px-7'>
        <div className='card figma-error-card mb-5 p-6'>
          <div className='flex items-start gap-4'>
            <div className='figma-error-icon'>
              <FigmaIcon
                name='error'
                size={24}
                style={{ color: 'var(--sig-over)' }}
              />
            </div>
            <div>
              <h2
                className='text-primary mb-1 font-bold'
                style={{ fontSize: 18 }}
              >
                Something went wrong
              </h2>
              <div className='text-muted figma-error-message'>
                {safeMessage(error)}
              </div>
              <div className='badge figma-error-badge mt-2'>
                {errorCode(error)}
              </div>
            </div>
          </div>
        </div>

        <div className='mb-5 flex flex-col gap-3'>
          <button
            className='btn btn-primary figma-error-action'
            onClick={() => window.location.reload()}
            type='button'
          >
            <FigmaIcon name='repeat' size={16} />
            Retry
          </button>
          <button
            className='btn btn-secondary figma-error-action'
            onClick={goHome}
            type='button'
          >
            Dismiss and continue
          </button>
        </div>

        <div className='card overflow-hidden'>
          <button
            className='figma-error-report-toggle'
            onClick={() => setShowDetails(value => !value)}
            type='button'
          >
            <span className='flex items-center gap-3'>
              <FigmaIcon
                name='info'
                size={16}
                style={{ color: 'var(--t-muted)' }}
              />
              <span
                className='text-primary font-medium'
                style={{ fontSize: 14 }}
              >
                Report this problem
              </span>
            </span>
            <FigmaIcon
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
            <div className='figma-error-report-body'>
              <div className='text-muted figma-error-report-copy'>
                Sending a report helps us fix this faster. The report contains
                diagnostic details - no passwords or personal messages.
              </div>
              <button
                className='figma-error-payload-button'
                onClick={() => setShowPayload(value => !value)}
                type='button'
              >
                <FigmaIcon name='search' size={14} />
                {showPayload ? 'Hide' : 'Show'} what gets sent
              </button>
              {showPayload && (
                <div className='figma-error-payload'>
                  <pre>{reportText || 'Collecting diagnostics...'}</pre>
                </div>
              )}
              <div className='flex gap-2'>
                <button
                  className='btn btn-primary figma-error-action flex-1'
                  disabled={!report}
                  onClick={sendReport}
                  type='button'
                >
                  Send report
                </button>
                <button
                  className='btn btn-secondary'
                  disabled={!report}
                  onClick={copy}
                  title='Copy to clipboard'
                  type='button'
                >
                  <FigmaIcon name={copied ? 'check' : 'copy'} size={14} />
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ErrorReportModal
        error={error}
        onClose={() => setReportOpen(false)}
        open={reportOpen}
      />
    </div>
  )
}

export default Error

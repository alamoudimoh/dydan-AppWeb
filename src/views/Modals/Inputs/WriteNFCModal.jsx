import { Capacitor } from '@capacitor/core'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import ModalActions from '../../../components/common/ModalActions'
import FigmaIcon from '../../../components/FigmaIcon'
import { useResponsiveModal } from '../../../hooks/useResponsiveModal'
import { startNativeNFCWrite } from '../../../service/NFCWriter'

const pulseKeyframes = `
  @keyframes nfc-pulse {
    0% { transform: scale(1); opacity: 0.6; }
    70% { transform: scale(1.6); opacity: 0; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes nfc-pulse-2 {
    0% { transform: scale(1); opacity: 0.4; }
    70% { transform: scale(2.1); opacity: 0; }
    100% { transform: scale(2.1); opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    [data-nfc-pulse] { animation: none !important; }
  }
`

function NFCGlyph({ size = 40, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      style={style}
      aria-hidden='true'
    >
      <path d='M5 4v16M9 4v16M15 4v16M19 4v16M12 6v12' />
    </svg>
  )
}

function NFCIcon({ status }) {
  const isWaiting = status === 'waiting_for_tag'
  const isSuccess = status === 'success'
  const isError = status === 'error'
  const statusBackground = isSuccess
    ? 'var(--sig-done-bg)'
    : isError
      ? 'var(--sig-over-bg)'
      : isWaiting
        ? 'var(--brand-faint)'
        : 'var(--surface-2)'
  const statusColor = isSuccess
    ? 'var(--sig-done)'
    : isError
      ? 'var(--sig-over)'
      : isWaiting
        ? 'var(--brand)'
        : 'var(--t-muted)'

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 96,
        height: 96,
        margin: '0 auto 24px',
      }}
    >
      {isWaiting && (
        <>
          <span
            aria-hidden='true'
            data-nfc-pulse
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid var(--brand)',
              animation: 'nfc-pulse 1.8s ease-out infinite',
            }}
          />
          <span
            aria-hidden='true'
            data-nfc-pulse
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid var(--accent)',
              animation: 'nfc-pulse-2 1.8s ease-out infinite 0.4s',
            }}
          />
        </>
      )}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: statusBackground,
          transition: 'background-color 0.25s ease',
        }}
      >
        {isSuccess ? (
          <FigmaIcon name='check' size={40} style={{ color: statusColor }} />
        ) : isError ? (
          <FigmaIcon name='error' size={40} style={{ color: statusColor }} />
        ) : (
          <NFCGlyph
            size={40}
            style={{
              color: statusColor,
              transition: 'color 0.25s ease',
            }}
          />
        )}
      </div>
    </div>
  )
}

function WriteNFCModal({ config }) {
  const { t } = useTranslation('common')
  const { ResponsiveModal } = useResponsiveModal()
  const [nfcStatus, setNfcStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isAutoCompleteWhenScan, setIsAutoCompleteWhenScan] = useState(false)
  const [copied, setCopied] = useState(false)
  const cancelScanRef = useRef(null)
  const isNative = Capacitor.isNativePlatform()

  const getURL = () => {
    let url = config.url
    if (isAutoCompleteWhenScan) url += '?auto_complete=true'
    return url
  }

  const handleClose = async () => {
    if (cancelScanRef.current) {
      await cancelScanRef.current()
      cancelScanRef.current = null
    }
    config.onClose()
    setNfcStatus('idle')
    setErrorMessage('')
  }

  const handleCancel = async () => {
    if (cancelScanRef.current) {
      await cancelScanRef.current()
      cancelScanRef.current = null
    }
    setNfcStatus('idle')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(getURL())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const writeToNFC = async () => {
    const url = getURL()

    if (isNative) {
      setNfcStatus('writing')
      const cancel = await startNativeNFCWrite(url, {
        onWaiting: () => setNfcStatus('waiting_for_tag'),
        onSuccess: () => {
          cancelScanRef.current = null
          setNfcStatus('success')
        },
        onError: msg => {
          cancelScanRef.current = null
          setNfcStatus('error')
          setErrorMessage(msg)
        },
      })
      cancelScanRef.current = cancel
    } else {
      if ('NDEFReader' in window) {
        try {
          setNfcStatus('writing')
          const ndef = new window.NDEFReader()
          await ndef.write({ records: [{ recordType: 'url', data: url }] })
          setNfcStatus('success')
        } catch (error) {
          console.error('Error writing to NFC tag:', error)
          setNfcStatus('error')
          setErrorMessage('Error writing to NFC tag. Please try again.')
        }
      } else {
        setNfcStatus('error')
        setErrorMessage(
          'NFC is not supported by this browser. Copy the URL and write it to an NFC tag using a compatible device.',
        )
      }
    }
  }

  const isWaiting = nfcStatus === 'waiting_for_tag' || nfcStatus === 'writing'
  const isSuccess = nfcStatus === 'success'
  const isError = nfcStatus === 'error'

  const title = isSuccess
    ? 'Tag written!'
    : isError
      ? t('errors.title')
      : isWaiting
        ? 'Hold near NFC tag'
        : 'Write to NFC'

  const subtitle = isSuccess
    ? 'Your NFC tag is ready to use.'
    : isError
      ? errorMessage
      : isWaiting
        ? 'Keep your device near the tag until complete.'
        : 'Encode this task link onto any NFC tag.'

  return (
    <>
      <style>{pulseKeyframes}</style>
      <ResponsiveModal
        open={config?.isOpen}
        onClose={handleClose}
        title={title}
        description={subtitle}
        closeOnBackdrop={!isWaiting}
        closeOnEscape={!isWaiting}
        footer={
          isSuccess ? (
            <ModalActions primary={{ label: 'Done', onClick: handleClose }} />
          ) : isWaiting ? (
            <ModalActions
              secondary={{ label: 'Cancel', onClick: handleCancel }}
            />
          ) : (
            <ModalActions
              secondary={{ label: 'Cancel', onClick: handleClose }}
              primary={{
                label: nfcStatus === 'writing' ? 'Starting…' : 'Write tag',
                onClick: writeToNFC,
                disabled: nfcStatus === 'writing',
                startDecorator: <NFCGlyph size={18} />,
              }}
            />
          )
        }
      >
        <div style={{ padding: '0 4px 8px' }}>
          {/* Icon */}
          <NFCIcon status={nfcStatus} />

          {/* Idle / Error: URL + toggle + CTA */}
          {!isWaiting && !isSuccess && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor='nfc-tag-url'
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--t-muted)',
                  }}
                >
                  Tag URL
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id='nfc-tag-url'
                    className='input'
                    value={getURL()}
                    readOnly
                    style={{
                      paddingRight: 40,
                      background: 'var(--surface-2)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                    }}
                  />
                  <button
                    type='button'
                    className='btn btn-ghost btn-icon'
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: 4,
                      width: 28,
                      minHeight: 28,
                      height: 28,
                      padding: 6,
                      transform: 'translateY(-50%)',
                      color: copied ? 'var(--sig-done)' : 'var(--t-muted)',
                    }}
                    aria-label='Copy tag URL'
                    onClick={handleCopy}
                    title='Copy URL'
                  >
                    <FigmaIcon name='copy' size={16} />
                  </button>
                </div>
                {copied && (
                  <p
                    role='status'
                    style={{
                      margin: '4px 0 0',
                      color: 'var(--sig-done)',
                      fontSize: 12,
                      textAlign: 'right',
                    }}
                  >
                    Copied!
                  </p>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--surface-2)',
                  marginBottom: 24,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    Auto-complete on scan
                  </div>
                  <p
                    style={{
                      margin: '4px 0 0',
                      color: 'var(--t-muted)',
                      fontSize: 12,
                    }}
                  >
                    Mark task done when tag is tapped
                  </p>
                </div>
                <button
                  type='button'
                  className={`figma-settings-toggle ${isAutoCompleteWhenScan ? 'on' : ''}`}
                  role='switch'
                  aria-checked={isAutoCompleteWhenScan}
                  aria-label='Auto-complete on scan'
                  onClick={() =>
                    setIsAutoCompleteWhenScan(!isAutoCompleteWhenScan)
                  }
                >
                  <span />
                </button>
              </div>
            </>
          )}
        </div>
      </ResponsiveModal>
    </>
  )
}

export default WriteNFCModal

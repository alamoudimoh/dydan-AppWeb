import { useCallback, useEffect, useMemo, useState } from 'react'

import FigmaIcon from '../../../components/FigmaIcon'
import { useScanToTask } from './useScanToTask'

const CameraIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z' />
    <circle cx='12' cy='13' r='4' />
  </svg>
)

const ScannerIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M3 7V5a2 2 0 0 1 2-2h2' />
    <path d='M17 3h2a2 2 0 0 1 2 2v2' />
    <path d='M21 17v2a2 2 0 0 1-2 2h-2' />
    <path d='M7 21H5a2 2 0 0 1-2-2v-2' />
    <path d='M7 12h10' />
  </svg>
)

const PhotoIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
    <circle cx='8.5' cy='8.5' r='1.5' />
    <path d='M21 15l-5-5L5 21' />
  </svg>
)

/**
 * Inline scan-to-task panel. Mounts inside AddTaskModal — no second modal.
 *
 * Flow: capture → (auto) processing → done [calls onTaskExtracted + onClose]
 *                                   → error  [retake or cancel]
 *
 * The primary action (Capture / Scan Document / Retake) lives in the modal
 * footer alongside Cancel — the panel reports it up through onStateChange
 * rather than rendering its own button row. Upload stays inline because it
 * belongs to the capture surface and drives a hidden input in this subtree.
 */
const ScanPanel = ({
  autoCapture,
  canKeepImage = false,
  initialImageUrl,
  onClose,
  onStateChange,
  onTaskExtracted,
  open,
}) => {
  const {
    activate,
    cameraAvailable,
    canvasRef,
    capture,
    capturedImage,
    errorMsg,
    fileInputRef,
    handleFileSelect,
    handleNativeScan,
    isNativeScanner,
    ocrProgress,
    phase,
    reset,
    retake,
    startCamera,
    stopCamera,
    taskResult,
    videoRef,
  } = useScanToTask()

  // The scanned page is usually the task's source of truth (the bill, the
  // notice), so keeping it is the default — the OCR text alone loses it.
  const [keepImage, setKeepImage] = useState(false)

  // Start/stop based on open state
  useEffect(() => {
    if (open) {
      activate(initialImageUrl)
      if (autoCapture && isNativeScanner && !initialImageUrl) {
        handleNativeScan()
      }
    } else {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialImageUrl])

  // Start camera when entering capture phase on web
  useEffect(() => {
    if (phase === 'capture' && !isNativeScanner) {
      startCamera()
    }
    if (phase !== 'capture') {
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isNativeScanner])

  // Auto-close and populate when done
  useEffect(() => {
    if (phase === 'done' && taskResult) {
      onTaskExtracted({
        ...taskResult,
        attachmentImage: canKeepImage && keepImage ? capturedImage : null,
      })
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, taskResult])

  const openFilePicker = useCallback(
    () => fileInputRef.current?.click(),
    [fileInputRef],
  )

  // The one action the footer renders for the current phase; null while
  // processing (nothing to do but wait) and when done (the panel closes)
  const primaryAction = useMemo(() => {
    if (phase === 'capture') {
      if (isNativeScanner) {
        return {
          label: 'Scan Document',
          icon: <ScannerIcon size={18} />,
          onClick: handleNativeScan,
        }
      }
      if (cameraAvailable) {
        return {
          label: 'Capture',
          icon: <CameraIcon size={18} />,
          onClick: capture,
        }
      }
      // No camera on this device — Upload is the only way forward, so it
      // graduates from the inline secondary to the footer's primary
      return {
        label: 'Upload Photo',
        icon: <PhotoIcon size={18} />,
        onClick: openFilePicker,
      }
    }
    if (phase === 'error') {
      return {
        label: 'Retake',
        icon: <FigmaIcon name='repeat' size={18} />,
        onClick: retake,
      }
    }
    return null
  }, [
    phase,
    isNativeScanner,
    cameraAvailable,
    capture,
    handleNativeScan,
    retake,
    openFilePicker,
  ])

  useEffect(() => {
    onStateChange?.({ phase, primaryAction })
  }, [phase, primaryAction, onStateChange])

  if (!open) return null

  const isProcessing = phase === 'processing'

  // Attachments are a Plus feature; without it the upload would only ever
  // surface an upgrade error, so the choice isn't offered at all.
  const keepImageToggle = !canKeepImage ? null : (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        color: 'var(--t-primary)',
        font: '13px var(--font-ui)',
        cursor: 'pointer',
      }}
    >
      <input
        type='checkbox'
        checked={keepImage}
        onChange={e => setKeepImage(e.target.checked)}
        style={{
          width: 18,
          height: 18,
          accentColor: 'var(--brand)',
          cursor: 'pointer',
        }}
      />
      <span>Keep photo as attachment</span>
    </label>
  )

  return (
    <div className='scan-panel'>
      {/* ── Capture phase ── */}
      {phase === 'capture' && (
        <>
          <div
            style={{
              position: 'relative',
              width: '100%',
              minHeight: 200,
              maxHeight: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#1a1a1a',
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
            }}
          >
            {isNativeScanner && (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <ScannerIcon size={56} />
                <p
                  style={{
                    margin: '12px 0 0',
                    color: '#fff',
                    opacity: 0.6,
                    font: '13px var(--font-ui)',
                  }}
                >
                  Tap &quot;Scan Document&quot; to open the scanner
                </p>
              </div>
            )}

            {!isNativeScanner && cameraAvailable && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  display: 'block',
                  maxHeight: 300,
                  objectFit: 'cover',
                }}
              />
            )}

            {!isNativeScanner && !cameraAvailable && (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <CameraIcon size={48} />
                <p
                  style={{
                    margin: '12px 0 0',
                    color: '#fff',
                    opacity: 0.6,
                    font: '13px var(--font-ui)',
                  }}
                >
                  Camera not available — use Upload instead
                </p>
              </div>
            )}
          </div>

          <div
            style={{
              padding: '8px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {/* Hidden when Upload is already the footer's primary action */}
            {(isNativeScanner || cameraAvailable) && (
              <button
                type='button'
                className='btn btn-ghost btn-sm'
                onClick={openFilePicker}
              >
                <PhotoIcon size={14} />
                Upload
              </button>
            )}
            {keepImageToggle}
          </div>
        </>
      )}

      {/* ── Processing phase ── */}
      {isProcessing && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: '20px 0',
          }}
        >
          {capturedImage && (
            <div
              style={{
                position: 'relative',
                width: '100%',
                borderRadius: 'var(--r-sm)',
                overflow: 'hidden',
              }}
            >
              <img
                src={capturedImage}
                alt='Processing'
                style={{
                  width: '100%',
                  display: 'block',
                  maxHeight: 180,
                  objectFit: 'contain',
                  opacity: 0.45,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  aria-label='Processing'
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '3px solid var(--line)',
                    borderTopColor: 'var(--brand)',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              </div>
            </div>
          )}

          <p
            style={{
              margin: 0,
              color: 'var(--t-muted)',
              font: '13px var(--font-ui)',
            }}
          >
            {ocrProgress > 0 && ocrProgress < 100
              ? `Reading text… ${ocrProgress}%`
              : ocrProgress >= 100
                ? 'Identifying task with AI…'
                : 'Starting…'}
          </p>

          {ocrProgress > 0 && ocrProgress < 100 && (
            <div
              role='progressbar'
              aria-valuenow={ocrProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{
                width: '100%',
                height: 6,
                background: 'var(--surface-2)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${ocrProgress}%`,
                  background: 'var(--brand)',
                  borderRadius: 'inherit',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          )}

          {/* Still editable here — the choice is only read once the task lands */}
          {keepImageToggle}
        </div>
      )}

      {/* ── Error phase ── */}
      {phase === 'error' && (
        <div style={{ padding: '16px 0' }}>
          {capturedImage && (
            <img
              src={capturedImage}
              alt='Failed scan'
              style={{
                width: '100%',
                display: 'block',
                borderRadius: 8,
                maxHeight: 160,
                objectFit: 'contain',
                opacity: 0.4,
                marginBottom: 12,
              }}
            />
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <FigmaIcon
              name='error'
              size={24}
              style={{ marginTop: 2, flexShrink: 0, color: 'var(--sig-due)' }}
            />
            <p
              style={{
                margin: 0,
                color: 'var(--t-primary)',
                font: '14px var(--font-ui)',
              }}
            >
              {errorMsg}
            </p>
          </div>
        </div>
      )}

      {/* Kept outside the phase branches so the footer's Upload action can
          reach it even when no capture surface is rendered */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default ScanPanel

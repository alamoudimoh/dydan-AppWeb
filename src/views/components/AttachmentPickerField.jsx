import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import FigmaIcon from '../../components/FigmaIcon'
import { useDocumentScanner } from '../../hooks/useDocumentScanner'
import { useFileUpload } from '../../hooks/useFileUpload'
import { useNotification } from '../../service/NotificationProvider'
import { DeleteDraftAttachment } from '../../utils/Fetcher'
import { imageSourceToFile } from '../../utils/FileConvert'

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']

const isImageAttachment = attachment => {
  const ext = (attachment?.name || '').split('.').pop()?.toLowerCase()
  return IMAGE_EXTENSIONS.includes(ext)
}

const AttachmentPickerField = ({
  attachments = [],
  draftId,
  emptyDisplay = 'icon-text',
  entityId,
  entityType = 'chore_attachment',
  onChange,
  onClear,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [menuPosition, setMenuPosition] = useState(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const menuId = useId()
  const { uploadFile } = useFileUpload({ entityType, entityId, draftId })
  const { isNativeScanner, scanDocument } = useDocumentScanner()
  const { showError } = useNotification()

  // Without a native scanner, `capture` asks a phone for its camera directly.
  // Desktop browsers ignore it and fall back to the file picker, which would
  // duplicate "Image", so the button only appears on touch devices.
  const canTakePhoto = isNativeScanner || navigator.maxTouchPoints > 0

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = e => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = event => {
      if (
        !buttonRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const positionMenu = () => {
      const button = buttonRef.current
      const menu = menuRef.current
      if (!button || !menu) return

      const triggerRect = button.getBoundingClientRect()
      const maxWidth = Math.min(320, window.innerWidth - 16)
      const menuWidth = Math.min(menu.offsetWidth || 240, maxWidth)
      const menuHeight = menu.offsetHeight || 120
      const top =
        triggerRect.top - menuHeight - 8 >= 8
          ? triggerRect.top - menuHeight - 8
          : triggerRect.bottom + 8

      setMenuPosition({
        left: Math.max(
          8,
          Math.min(triggerRect.left, window.innerWidth - menuWidth - 8),
        ),
        top,
      })
    }

    positionMenu()
    window.addEventListener('resize', positionMenu)
    window.addEventListener('scroll', positionMenu, true)
    return () => {
      window.removeEventListener('resize', positionMenu)
      window.removeEventListener('scroll', positionMenu, true)
    }
  }, [attachments.length, isOpen, isUploading])

  const upload = async file => {
    setIsUploading(true)
    try {
      const uploaded = await uploadFile(file)
      if (uploaded) {
        onChange([
          ...attachments,
          { url: uploaded.url, path: uploaded.path, name: uploaded.fileName },
        ])
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handlePickFile = ({ accept, capture } = {}) => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    if (accept) input.setAttribute('accept', accept)
    if (capture) input.setAttribute('capture', capture)
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) upload(file)
    }
    input.click()
  }

  // Native builds get the OS document scanner (edge detection + perspective
  // correction); everywhere else "take photo" is the camera roll shortcut.
  const handleScan = async () => {
    if (!isNativeScanner) {
      handlePickFile({ accept: 'image/*', capture: 'environment' })
      return
    }
    const { cancelled, error, image } = await scanDocument()
    if (cancelled) return
    if (error || !image) {
      showError({
        title: 'Scan Failed',
        message: error || 'Could not scan the document.',
      })
      return
    }
    setIsUploading(true)
    const file = await imageSourceToFile(image, `scan-${Date.now()}.jpg`)
    setIsUploading(false)
    if (!file) {
      showError({
        title: 'Scan Failed',
        message: 'Could not read the scanned image.',
      })
      return
    }
    await upload(file)
  }

  const handleRemove = async index => {
    const attachment = attachments[index]
    // Draft uploads exist server-side too — delete there so they are not
    // promoted onto the chore when it is created.
    if (attachment?.path) {
      try {
        await DeleteDraftAttachment(attachment.path)
      } catch {
        // file may already be gone; still drop it from the list
      }
    }
    const updated = attachments.filter((_, i) => i !== index)
    onChange(updated)
    if (updated.length === 0) setIsOpen(false)
  }

  const handleClear = e => {
    e.stopPropagation()
    onClear?.()
    setIsOpen(false)
  }

  const handleToggle = () => {
    if (!isOpen) setMenuPosition(null)
    setIsOpen(!isOpen)
  }

  const isEmpty = attachments.length === 0
  const shouldShowLabel = !isEmpty || emptyDisplay === 'icon-text'

  return (
    <>
      <div
        style={{ alignItems: 'center', display: 'flex', position: 'relative' }}
      >
        <button
          ref={buttonRef}
          aria-controls={isOpen ? menuId : undefined}
          aria-expanded={isOpen}
          aria-haspopup='dialog'
          aria-label={
            isUploading
              ? 'Uploading attachment'
              : isEmpty
                ? 'Add attachments'
                : `${attachments.length} attachments`
          }
          className='btn btn-secondary'
          onClick={handleToggle}
          style={{
            alignItems: 'center',
            background: isEmpty ? 'var(--surface)' : 'var(--surface-2)',
            borderRadius: 'var(--r-full)',
            display: 'inline-flex',
            gap: shouldShowLabel ? 8 : 0,
            justifyContent: 'flex-start',
            minHeight: 40,
            minWidth: 'min-content',
            padding: shouldShowLabel ? '8px 10px' : '8px 6px',
            transition: 'all 0.25s ease-in-out',
            whiteSpace: 'nowrap',
          }}
          type='button'
        >
          {isUploading ? (
            <span
              aria-label='Uploading attachment'
              role='status'
              style={{
                animation: 'spin 0.7s linear infinite',
                border: '2px solid currentColor',
                borderRightColor: 'transparent',
                borderRadius: '50%',
                display: 'inline-block',
                height: 16,
                width: 16,
              }}
            />
          ) : (
            <FigmaIcon name='archive' size={20} />
          )}
          <span
            aria-hidden='true'
            style={{
              font: '14px var(--font-ui)',
              maxWidth: shouldShowLabel ? 180 : 0,
              opacity: shouldShowLabel ? 1 : 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transform: shouldShowLabel ? 'translateX(0)' : 'translateX(-4px)',
              transition:
                'max-width 0.25s ease-in-out, opacity 0.2s ease-in-out, transform 0.25s ease-in-out',
              whiteSpace: 'nowrap',
            }}
          >
            {isEmpty
              ? 'Attachments'
              : `${attachments.length} file${attachments.length !== 1 ? 's' : ''}`}
          </span>
        </button>
        {!isEmpty && onClear && (
          <button
            aria-label='Clear attachments'
            className='btn btn-danger btn-icon'
            onClick={handleClear}
            style={{
              borderRadius: '50%',
              height: 30,
              padding: 6,
              position: 'absolute',
              right: -18,
              top: -18,
              width: 30,
              zIndex: 10,
            }}
            type='button'
          >
            <FigmaIcon name='x' size={18} />
          </button>
        )}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role='dialog'
            aria-label='Attachments'
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)',
              boxShadow: 'var(--shadow-sm)',
              left: menuPosition?.left ?? 8,
              maxWidth: 'calc(100vw - 16px)',
              minWidth: 240,
              padding: 8,
              position: 'fixed',
              top: menuPosition?.top ?? 8,
              visibility: menuPosition ? 'visible' : 'hidden',
              width: 320,
              zIndex: 2101,
            }}
          >
            {attachments.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  marginBottom: 8,
                }}
              >
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      gap: 8,
                      padding: 4,
                    }}
                  >
                    {isImageAttachment(attachment) && (
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        style={{
                          background: 'var(--surface-2)',
                          borderRadius: 'var(--r-sm)',
                          flexShrink: 0,
                          height: 36,
                          objectFit: 'cover',
                          width: 36,
                        }}
                        onError={e => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    )}
                    <div
                      style={{
                        display: isImageAttachment(attachment)
                          ? 'none'
                          : 'flex',
                        width: 36,
                        height: 36,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--surface-2)',
                        flexShrink: 0,
                      }}
                    >
                      <FigmaIcon name='archive' size={20} />
                    </div>
                    <span
                      style={{
                        flex: 1,
                        font: '12px var(--font-ui)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {attachment.name}
                    </span>
                    <button
                      aria-label={`Remove ${attachment.name || 'attachment'}`}
                      className='btn btn-danger btn-icon'
                      onClick={() => handleRemove(index)}
                      style={{
                        borderRadius: 'var(--r-sm)',
                        flexShrink: 0,
                        minHeight: 30,
                        padding: 5,
                      }}
                      type='button'
                    >
                      <FigmaIcon name='trash' size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isUploading ? (
              <button
                aria-busy='true'
                className='btn btn-secondary btn-sm'
                disabled
                style={{ justifyContent: 'center', width: '100%' }}
                type='button'
              >
                Uploading…
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 4 }}>
                {canTakePhoto && (
                  <button
                    className='btn btn-secondary btn-sm'
                    onClick={handleScan}
                    style={{ flex: 1, justifyContent: 'center' }}
                    type='button'
                  >
                    {isNativeScanner ? 'Scan' : 'Photo'}
                  </button>
                )}
                <button
                  className='btn btn-secondary btn-sm'
                  onClick={() => handlePickFile({ accept: 'image/*' })}
                  style={{ flex: 1, justifyContent: 'center' }}
                  type='button'
                >
                  Image
                </button>
                <button
                  className='btn btn-secondary btn-sm'
                  onClick={() => handlePickFile()}
                  style={{ flex: 1, justifyContent: 'center' }}
                  type='button'
                >
                  File
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}

export default AttachmentPickerField

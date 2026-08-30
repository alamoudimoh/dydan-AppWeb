import PropTypes from 'prop-types'
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

import { Z_INDEX } from '../../constants/zIndex'
import { sxToStyle } from '../../theme/sxToStyle'
import FigmaIcon from '../FigmaIcon'

const WIDTH_BY_SIZE = {
  sm: 400,
  md: 520,
  lg: 680,
  xl: 840,
}

const isNarrowViewport = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(max-width:599.95px)').matches

/**
 * The app's modal primitive, rendered with the Figma `.modal-overlay` /
 * `.modal-panel` vocabulary. It owns modal layout, spacing, accessibility,
 * responsive presentation, and motion so feature components only own content.
 */
const AppModal = forwardRef(
  (
    {
      backdropBlur = true,
      children,
      closeOnBackdrop = true,
      closeOnEscape = true,
      contentSx,
      description,
      footer,
      footerSx,
      fullWidth = true,
      isMobile: isMobileProp,
      keepMounted = false,
      maxHeight = '90dvh',
      mobilePresentation = 'sheet',
      onClose,
      open,
      role = 'dialog',
      showCloseButton = true,
      showHandle = false,
      size = 'md',
      sx,
      title,
    },
    ref,
  ) => {
    const generatedId = useId()
    const [detectedMobile, setDetectedMobile] = useState(isNarrowViewport)
    const panelRef = useRef(null)
    const isMobile = isMobileProp ?? detectedMobile
    const titleId = title ? `${generatedId}-title` : undefined
    const descriptionId = description ? `${generatedId}-description` : undefined
    const isSheet = isMobile && mobilePresentation === 'sheet'
    const isFullscreen = isMobile && mobilePresentation === 'fullscreen'
    const isOpen = Boolean(open)

    useEffect(() => {
      if (typeof window.matchMedia !== 'function') return undefined
      const mql = window.matchMedia('(max-width:599.95px)')
      const onChange = event => setDetectedMobile(event.matches)
      mql.addEventListener?.('change', onChange)
      return () => mql.removeEventListener?.('change', onChange)
    }, [])

    // Scroll lock + focus management while open.
    useEffect(() => {
      if (!isOpen) return undefined
      const previousOverflow = document.body.style.overflow
      const previousActive = document.activeElement
      document.body.style.overflow = 'hidden'
      const panel = panelRef.current
      if (panel) panel.focus?.()
      return () => {
        document.body.style.overflow = previousOverflow
        if (previousActive && typeof previousActive.focus === 'function') {
          previousActive.focus?.()
        }
      }
    }, [isOpen])

    const handleClose = useCallback(
      (event, reason) => {
        if (reason === 'backdropClick' && !closeOnBackdrop) return
        if (reason === 'escapeKeyDown' && !closeOnEscape) return
        onClose?.(event, reason)
      },
      [closeOnBackdrop, closeOnEscape, onClose],
    )

    // Escape handling.
    useEffect(() => {
      if (!isOpen) return undefined
      const onKeyDown = event => {
        if (event.key === 'Escape') handleClose(event, 'escapeKeyDown')
      }
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    }, [isOpen, handleClose])

    const setRefs = useCallback(
      node => {
        panelRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )

    const panel = (
      <div
        ref={setRefs}
        className='modal-overlay'
        role='presentation'
        data-open={isOpen || undefined}
        hidden={!isOpen && keepMounted}
        onClick={event => {
          if (event.target === event.currentTarget) {
            handleClose(event, 'backdropClick')
          }
        }}
        style={{
          zIndex: Z_INDEX.MODAL_BACKDROP,
          alignItems: isSheet ? 'flex-end' : 'center',
          padding: isMobile ? 0 : 16,
          backdropFilter: backdropBlur ? 'blur(3px)' : 'none',
        }}
      >
        <div
          className={`modal-panel${isSheet ? ' appmodal-sheet' : ''}${
            isFullscreen ? ' appmodal-fullscreen' : ''
          }`}
          role={role}
          aria-modal='true'
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          style={{
            zIndex: Z_INDEX.MODAL_CONTENT,
            width: isFullscreen
              ? '100%'
              : fullWidth
                ? `min(calc(100vw - 32px), ${WIDTH_BY_SIZE[size] || WIDTH_BY_SIZE.md}px)`
                : 'auto',
            maxWidth: isMobile
              ? 'none'
              : WIDTH_BY_SIZE[size] || WIDTH_BY_SIZE.md,
            height: isFullscreen ? '100dvh' : 'auto',
            maxHeight: isFullscreen ? '100dvh' : maxHeight,
            borderRadius: isFullscreen
              ? 0
              : isSheet
                ? 'var(--r-lg) var(--r-lg) 0 0'
                : 'var(--r-2xl)',
            paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0,
            animation: isOpen
              ? `${isSheet ? 'appSheetEnter' : 'appModalEnter'} 180ms cubic-bezier(0.2, 0.8, 0.2, 1)`
              : undefined,
          }}
        >
          {isSheet && showHandle && (
            <div
              aria-hidden='true'
              className='flex justify-center'
              style={{ paddingTop: 10 }}
            >
              <div
                className='rounded-full'
                style={{
                  width: 36,
                  height: 4,
                  background: 'var(--line-strong)',
                  opacity: 0.4,
                }}
              />
            </div>
          )}

          {(title || description || showCloseButton) && (
            <header
              className='relative flex-shrink-0'
              style={{
                paddingInlineStart:
                  sxToStyle(sx)?.paddingInlineStart ?? (isMobile ? 16 : 24),
                paddingInlineEnd: showCloseButton
                  ? isMobile
                    ? 40
                    : 64
                  : isMobile
                    ? 16
                    : 24,
                paddingTop: isSheet && showHandle ? 10 : isMobile ? 16 : 20,
                paddingBottom: description ? 12 : 16,
                ...sxToStyle(sx),
              }}
            >
              {title && (
                <h2
                  id={titleId}
                  className='text-primary'
                  style={{ fontSize: 18, fontWeight: 700, margin: 0 }}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id={descriptionId}
                  className='text-faint text-sm'
                  style={{ margin: '4px 0 0' }}
                >
                  {description}
                </p>
              )}
              {showCloseButton && (
                <button
                  type='button'
                  aria-label='Close dialog'
                  className='btn btn-ghost btn-icon'
                  onClick={event => handleClose(event)}
                  style={{
                    position: 'absolute',
                    top: isSheet && showHandle ? 6 : 12,
                    insetInlineEnd: isMobile ? 8 : 16,
                  }}
                >
                  <FigmaIcon name='x' size={18} />
                </button>
              )}
            </header>
          )}

          <div
            className='min-h-0 flex-1'
            style={{
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              paddingInlineStart: isMobile ? 16 : 24,
              paddingInlineEnd: isMobile ? 16 : 24,
              paddingBlockEnd: isMobile ? 20 : 24,
              ...sxToStyle(contentSx),
            }}
          >
            {children}
          </div>

          {footer && (
            <footer
              className='shrink-0'
              style={{
                borderTop: '1px solid var(--line)',
                padding: '16px 24px',
                background: 'var(--surface)',
                paddingInlineStart: isMobile ? 16 : 24,
                paddingInlineEnd: isMobile ? 16 : 24,
                ...sxToStyle(footerSx),
              }}
            >
              {footer}
            </footer>
          )}
        </div>
      </div>
    )

    if (!isOpen && !keepMounted) return null
    return createPortal(panel, document.body)
  },
)

AppModal.displayName = 'AppModal'

AppModal.propTypes = {
  backdropBlur: PropTypes.bool,
  children: PropTypes.node,
  closeOnBackdrop: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  contentSx: PropTypes.object,
  description: PropTypes.node,
  footer: PropTypes.node,
  footerSx: PropTypes.object,
  fullWidth: PropTypes.bool,
  isMobile: PropTypes.bool,
  keepMounted: PropTypes.bool,
  maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  mobilePresentation: PropTypes.oneOf(['sheet', 'fullscreen', 'dialog']),
  onClose: PropTypes.func,
  open: PropTypes.bool.isRequired,
  role: PropTypes.string,
  showCloseButton: PropTypes.bool,
  showHandle: PropTypes.bool,
  size: PropTypes.oneOf(Object.keys(WIDTH_BY_SIZE)),
  sx: PropTypes.object,
  title: PropTypes.node,
}

export default AppModal

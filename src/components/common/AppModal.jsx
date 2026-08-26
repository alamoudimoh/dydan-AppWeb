import { Close } from '@mui/icons-material'
import { Box, Divider, IconButton, Modal, Sheet, Typography } from '@mui/joy'
import useMediaQuery from '@mui/material/useMediaQuery'
import PropTypes from 'prop-types'
import { forwardRef, useId } from 'react'

import { Z_INDEX } from '../../constants/zIndex'

const WIDTH_BY_SIZE = {
  sm: 400,
  md: 520,
  lg: 680,
  xl: 840,
}

/**
 * The app's modal primitive. It owns modal layout, spacing, accessibility,
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
      unmountDelay = 180,
      ...modalProps
    },
    ref,
  ) => {
    const generatedId = useId()
    const detectedMobile = useMediaQuery('(max-width:599.95px)')
    const isMobile = isMobileProp ?? detectedMobile
    const titleId = title ? `${generatedId}-title` : undefined
    const descriptionId = description ? `${generatedId}-description` : undefined
    const isSheet = isMobile && mobilePresentation === 'sheet'
    const isFullscreen = isMobile && mobilePresentation === 'fullscreen'
    const enterAnimation = isSheet ? 'appSheetEnter' : 'appModalEnter'

    const handleClose = (event, reason) => {
      if (reason === 'backdropClick' && !closeOnBackdrop) return
      if (reason === 'escapeKeyDown' && !closeOnEscape) return
      onClose?.(event, reason)
    }

    return (
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        keepMounted
        sx={{
          zIndex: Z_INDEX.MODAL_BACKDROP,
          display: 'flex',
          alignItems: isSheet ? 'flex-end' : 'center',
          justifyContent: 'center',
          p: isMobile ? 0 : 2,
          '& .MuiModal-backdrop': {
            backgroundColor: 'var(--joy-palette-background-backdrop)',
            backdropFilter: backdropBlur ? 'blur(4px)' : 'none',
          },
        }}
        {...modalProps}
      >
        <Sheet
          ref={ref}
          role={role}
          aria-modal='true'
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          variant='outlined'
          sx={{
            zIndex: Z_INDEX.MODAL_CONTENT,
            display: 'flex',
            flexDirection: 'column',
            width: isFullscreen
              ? '100%'
              : isSheet
                ? '100%'
                : fullWidth
                  ? `min(calc(100vw - 32px), ${WIDTH_BY_SIZE[size] || WIDTH_BY_SIZE.md}px)`
                  : 'auto',
            maxWidth: isMobile
              ? 'none'
              : WIDTH_BY_SIZE[size] || WIDTH_BY_SIZE.md,
            height: isFullscreen ? '100dvh' : 'auto',
            maxHeight: isFullscreen ? '100dvh' : maxHeight,
            overflow: 'hidden',
            borderRadius: isFullscreen
              ? 0
              : isSheet
                ? 'var(--product-radius-card) var(--product-radius-card) 0 0'
                : 'var(--product-radius-card)',
            borderBottom: isSheet ? 0 : undefined,
            boxShadow: 'lg',
            outline: 0,
            pb: isMobile ? 'env(safe-area-inset-bottom)' : 0,
            animation: open
              ? `${enterAnimation} ${Math.min(
                  unmountDelay,
                  300,
                )}ms cubic-bezier(0.2, 0.8, 0.2, 1)`
              : undefined,
            '@keyframes appModalEnter': {
              from: { opacity: 0, transform: 'translateY(8px) scale(0.99)' },
              to: { opacity: 1, transform: 'translateY(0) scale(1)' },
            },
            '@keyframes appSheetEnter': {
              from: { transform: 'translateY(24px)' },
              to: { transform: 'translateY(0)' },
            },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
            },
            ...sx,
          }}
        >
          {isSheet && showHandle && (
            <Box
              aria-hidden='true'
              sx={{ display: 'flex', justifyContent: 'center', pt: 1.25 }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 4,
                  borderRadius: 999,
                  bgcolor: 'neutral.300',
                }}
              />
            </Box>
          )}

          {(title || description || showCloseButton) && (
            <Box
              component='header'
              sx={{
                position: 'relative',
                flexShrink: 0,
                px: { xs: 2, sm: 3 },
                pt: isSheet && showHandle ? 1.25 : { xs: 2, sm: 2.5 },
                pb: description ? 1.5 : 2,
                paddingInlineEnd: showCloseButton
                  ? { xs: 7, sm: 8 }
                  : { xs: 2, sm: 3 },
              }}
            >
              {title && (
                <Typography
                  id={titleId}
                  level='title-lg'
                  sx={{ fontWeight: 650 }}
                >
                  {title}
                </Typography>
              )}
              {description && (
                <Typography
                  id={descriptionId}
                  level='body-sm'
                  sx={{ color: 'text.tertiary', mt: 0.5 }}
                >
                  {description}
                </Typography>
              )}
              {showCloseButton && (
                <IconButton
                  aria-label='Close dialog'
                  variant='plain'
                  color='neutral'
                  onClick={handleClose}
                  sx={{
                    position: 'absolute',
                    top: isSheet && showHandle ? 6 : 12,
                    insetInlineEnd: { xs: 10, sm: 16 },
                    borderRadius: '50%',
                  }}
                >
                  <Close />
                </IconButton>
              )}
            </Box>
          )}

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              px: { xs: 2, sm: 3 },
              pb: { xs: 2.5, sm: 3 },
              ...contentSx,
            }}
          >
            {children}
          </Box>

          {footer && (
            <>
              <Divider />
              <Box
                component='footer'
                sx={{
                  flexShrink: 0,
                  px: { xs: 2, sm: 3 },
                  py: 2,
                  bgcolor: 'background.surface',
                  ...footerSx,
                }}
              >
                {footer}
              </Box>
            </>
          )}
        </Sheet>
      </Modal>
    )
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
  unmountDelay: PropTypes.number,
}

export default AppModal

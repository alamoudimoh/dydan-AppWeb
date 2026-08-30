import PropTypes from 'prop-types'
import { useCallback, useEffect, useRef, useState } from 'react'

import KeyboardShortcutHint from '../../../components/common/KeyboardShortcutHint'
import ModalActions from '../../../components/common/ModalActions'
import { useResponsiveModal } from '../../../hooks/useResponsiveModal'

function ConfirmationModal({ config }) {
  const { ResponsiveModal } = useResponsiveModal()
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const cancelButtonRef = useRef(null)
  const isDestructive = config?.color === 'danger'

  const handleAction = useCallback(
    isConfirmed => {
      config.onClose(isConfirmed)
    },
    [config],
  )

  useEffect(() => {
    if (config?.isOpen && isDestructive) cancelButtonRef.current?.focus()
  }, [config?.isOpen, isDestructive])

  useEffect(() => {
    const handleKeyDown = event => {
      if (!config?.isOpen) return

      if (event.ctrlKey || event.metaKey) setShowKeyboardShortcuts(true)

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === 'y' &&
        config?.color !== 'danger'
      ) {
        event.preventDefault()
        handleAction(true)
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
        event.preventDefault()
        handleAction(false)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        handleAction(false)
      } else if (event.key === 'Enter' && config?.color !== 'danger') {
        event.preventDefault()
        handleAction(true)
      }
    }

    const handleKeyUp = event => {
      if (!event.ctrlKey && !event.metaKey) setShowKeyboardShortcuts(false)
    }

    if (config?.isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('keyup', handleKeyUp)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [config?.isOpen, config?.color, handleAction])

  return (
    <ResponsiveModal
      open={config?.isOpen}
      onClose={() => handleAction(false)}
      size='sm'
      role={isDestructive ? 'alertdialog' : 'dialog'}
      title={config?.title}
      showCloseButton={false}
      closeOnBackdrop={!isDestructive}
      footer={
        <ModalActions
          stackOnMobile
          secondary={{
            label: config?.cancelText,
            ref: cancelButtonRef,
            onClick: () => handleAction(false),
            endDecorator: showKeyboardShortcuts ? (
              <KeyboardShortcutHint shortcut='X' />
            ) : undefined,
          }}
          primary={{
            label: config?.confirmText,
            color: config?.color || 'primary',
            onClick: () => handleAction(true),
            endDecorator:
              showKeyboardShortcuts && !isDestructive ? (
                <KeyboardShortcutHint shortcut='Y' />
              ) : undefined,
          }}
        />
      }
    >
      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{config?.message}</p>
    </ResponsiveModal>
  )
}

ConfirmationModal.propTypes = {
  config: PropTypes.shape({
    cancelText: PropTypes.node,
    color: PropTypes.string,
    confirmText: PropTypes.node,
    isOpen: PropTypes.bool,
    message: PropTypes.node,
    onClose: PropTypes.func,
    title: PropTypes.node,
  }).isRequired,
}

export default ConfirmationModal

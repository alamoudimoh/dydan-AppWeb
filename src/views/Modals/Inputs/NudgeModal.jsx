import { useCallback, useEffect, useState } from 'react'

import KeyboardShortcutHint from '../../../components/common/KeyboardShortcutHint'
import ModalActions from '../../../components/common/ModalActions'
import { useResponsiveModal } from '../../../hooks/useResponsiveModal'
import { isOfficialDydanInstanceSync } from '../../../utils/FeatureToggle'

function NudgeModal({ config }) {
  const { ResponsiveModal } = useResponsiveModal()
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [message, setMessage] = useState('')
  const [notifyAllAssignees, setNotifyAllAssignees] = useState(false)
  const [isOfficialInstance, setIsOfficialInstance] = useState(false)

  const handleAction = useCallback(
    isConfirmed => {
      if (isConfirmed) {
        config.onConfirm({
          choreId: config.choreId,
          message,
          notifyAllAssignees,
        })
      } else {
        config.onClose()
      }
    },
    [config, message, notifyAllAssignees],
  )

  // Reset form when modal opens
  useEffect(() => {
    if (config?.isOpen) {
      setMessage('')
      setNotifyAllAssignees(false)

      // Check whether this build configured an official hosted instance.
      try {
        setIsOfficialInstance(isOfficialDydanInstanceSync())
      } catch (error) {
        console.warn('Error checking instance type:', error)
        setIsOfficialInstance(false)
      }
    }
  }, [config?.isOpen])

  // Keyboard shortcuts for nudge modal
  useEffect(() => {
    const handleKeyDown = event => {
      if (!config?.isOpen) return

      // Show keyboard shortcuts when Ctrl/Cmd is pressed
      if (event.ctrlKey || event.metaKey) {
        setShowKeyboardShortcuts(true)
      }

      // Ctrl/Cmd + Y for confirm
      if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
        event.preventDefault()
        handleAction(true)
        return
      }

      // Ctrl/Cmd + X for cancel
      if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
        event.preventDefault()
        handleAction(false)
        return
      }

      // Escape key for cancel
      if (event.key === 'Escape') {
        event.preventDefault()
        handleAction(false)
        return
      }
    }

    const handleKeyUp = event => {
      if (!event.ctrlKey && !event.metaKey) {
        setShowKeyboardShortcuts(false)
      }
    }

    if (config?.isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('keyup', handleKeyUp)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [config?.isOpen, handleAction])

  return (
    <ResponsiveModal
      open={config?.isOpen}
      onClose={config?.onClose}
      size='lg'
      fullWidth={true}
      unmountDelay={250}
      title='Send Nudge'
      description='Send a gentle reminder to the people assigned to this task.'
      footer={
        <ModalActions
          secondary={{
            label: 'Cancel',
            onClick: () => handleAction(false),
            endDecorator: showKeyboardShortcuts ? (
              <KeyboardShortcutHint shortcut='X' />
            ) : undefined,
          }}
          primary={{
            label: 'Send Nudge',
            onClick: () => handleAction(true),
            disabled: !isOfficialInstance,
            endDecorator: showKeyboardShortcuts ? (
              <KeyboardShortcutHint shortcut='Y' />
            ) : undefined,
          }}
        />
      }
    >
      {!isOfficialInstance && (
        <div
          role='alert'
          className='card'
          style={{
            marginBottom: 16,
            background: 'var(--sig-due-bg)',
            borderColor: 'var(--sig-due)',
            color: 'var(--sig-due)',
          }}
        >
          <p style={{ margin: 0, fontSize: 14 }}>
            <strong>Heads up!</strong>This feature is available on dydan Cloud!
            Since you&apos;re using a self-hosted instance, nudges will requires
            you to setup Google cloud account and Firebase Cloud Messaging
            (FCM). and build the Android or the iOS app by yourself.
            <br />
            Will update if we come up with a solution to make this easier for to
            configure. for selfhosters
          </p>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label
          htmlFor='nudge-message'
          style={{
            display: 'block',
            marginBottom: 6,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Custom Message (optional)
        </label>
        <textarea
          id='nudge-message'
          className='input'
          placeholder='Add a personal message with your nudge...'
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <label
            htmlFor='nudge-notify-all'
            style={{ display: 'block', fontWeight: 600 }}
          >
            Notify All Assignees
          </label>
          <p
            style={{ margin: '4px 0 0', color: 'var(--t-muted)', fontSize: 14 }}
          >
            If enabled, all members who can see this task will be notified.
            Otherwise, only the assigned person will receive the nudge.
          </p>
        </div>
        <input
          id='nudge-notify-all'
          type='checkbox'
          checked={notifyAllAssignees}
          onChange={e => setNotifyAllAssignees(e.target.checked)}
          style={{ accentColor: 'var(--brand)', blockSize: 18, inlineSize: 18 }}
        />
      </div>
    </ResponsiveModal>
  )
}

export default NudgeModal

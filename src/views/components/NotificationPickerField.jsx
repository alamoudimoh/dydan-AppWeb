import { useEffect, useRef, useState } from 'react'

import ModalActions from '../../components/common/ModalActions'
import FigmaIcon from '../../components/FigmaIcon'
import NotificationTemplate from '../../components/NotificationTemplate'
import { useResponsiveModal } from '../../hooks/useResponsiveModal'

const getDisplayLabel = templates => {
  if (!templates || templates.length === 0) return 'Remind'
  const count = templates.length
  if (count === 1) {
    const n = templates[0]
    const numericValue = Number(n.value)
    if (numericValue === 0) return 'On due date'
    const unitName = n.unit === 'm' ? 'min' : n.unit === 'h' ? 'hr' : 'day'
    const absValue = Math.abs(numericValue)
    const plural = absValue !== 1 ? 's' : ''
    return `${absValue} ${unitName}${plural} ${numericValue < 0 ? 'before' : 'after'}`
  }
  return `${count} reminders`
}

const NotificationPickerField = ({
  emptyDisplay = 'icon-text',
  onChange,
  onClear,
  size = 'sm',
  value,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const latestTemplatesRef = useRef(value?.templates || [])
  const { ResponsiveModal } = useResponsiveModal()

  useEffect(() => {
    if (isOpen) {
      latestTemplatesRef.current = value?.templates || []
    }
  }, [isOpen, value])

  const templates = value?.templates || []
  const hasNotifications = templates.length > 0
  const shouldShowLabel = hasNotifications || emptyDisplay === 'icon-text'
  const displayLabel = getDisplayLabel(templates)

  const handleSave = () => {
    onChange({ ...value, templates: latestTemplatesRef.current })
    setIsOpen(false)
  }

  const footer = (
    <ModalActions
      tertiary={
        hasNotifications
          ? {
              label: 'Remove all',
              color: 'danger',
              onClick: () => {
                onClear?.()
                setIsOpen(false)
              },
            }
          : undefined
      }
      secondary={{ label: 'Cancel', onClick: () => setIsOpen(false) }}
      primary={{ label: 'Apply', onClick: handleSave }}
    />
  )

  return (
    <>
      <div
        style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
      >
        <button
          aria-expanded={isOpen}
          aria-label={displayLabel}
          className='btn btn-secondary'
          onClick={() => setIsOpen(true)}
          style={{
            alignItems: 'center',
            background: hasNotifications ? 'var(--brand-faint)' : undefined,
            borderColor: hasNotifications ? 'var(--brand)' : undefined,
            color: hasNotifications ? 'var(--brand)' : undefined,
            display: 'inline-flex',
            fontSize: size === 'lg' ? 15 : size === 'sm' ? 12 : 14,
            gap: shouldShowLabel ? 8 : 0,
            justifyContent: 'flex-start',
            minHeight: 40,
            minWidth: 'min-content',
            padding: shouldShowLabel ? '8px 10px' : '8px 6px',
            borderRadius: 'var(--r-sm)',
            transition: 'all 0.25s ease-in-out',
            whiteSpace: 'nowrap',
          }}
          type='button'
        >
          <FigmaIcon name='bell' size={20} />
          <span
            style={{
              color: 'var(--t-primary)',
              font: '14px var(--font-ui)',
              maxWidth: shouldShowLabel ? 220 : 0,
              opacity: shouldShowLabel ? 1 : 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transform: shouldShowLabel ? 'translateX(0)' : 'translateX(-4px)',
              transition:
                'max-width 0.25s ease-in-out, opacity 0.2s ease-in-out, transform 0.25s ease-in-out',
              whiteSpace: 'nowrap',
            }}
          >
            {displayLabel}
          </span>
        </button>

        {hasNotifications && onClear && (
          <button
            aria-label='Remove reminders'
            className='btn btn-danger'
            onClick={e => {
              e.stopPropagation()
              onClear?.()
            }}
            style={{
              alignItems: 'center',
              borderRadius: '50%',
              display: 'inline-flex',
              height: 32,
              justifyContent: 'center',
              padding: 0,
              position: 'absolute',
              right: -18,
              top: -18,
              zIndex: 10,
              width: 32,
            }}
            type='button'
          >
            <FigmaIcon name='x' size={18} />
          </button>
        )}
      </div>

      <ResponsiveModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title='Reminders'
        footer={footer}
      >
        <NotificationTemplate
          value={value}
          minNotifications={0}
          onChange={({ notifications }) => {
            latestTemplatesRef.current = notifications
          }}
          showTimeline={false}
        />
      </ResponsiveModal>
    </>
  )
}

export default NotificationPickerField

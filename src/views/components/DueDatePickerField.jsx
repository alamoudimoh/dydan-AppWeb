import moment from 'moment'
import { useMemo, useState } from 'react'

import FigmaIcon from '../../components/FigmaIcon'
import DueDatePickerModal from './DueDatePickerModal'

const DueDatePickerField = ({
  dueDateOnly,
  dueTime,
  emptyDisplay = 'icon-text',
  onClear,
  onDueDateChange,
  onDueTimeChange,
  onUseCustomTimeChange,
  size = 'sm',
  useCustomTime,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = ({
    dueDateOnly: nextDate,
    dueTime: nextTime,
    useCustomTime: nextUseCustomTime,
  }) => {
    onDueDateChange?.({ target: { value: nextDate || '' } })
    onUseCustomTimeChange?.(nextUseCustomTime)
    onDueTimeChange?.({
      target: { value: nextUseCustomTime && nextTime ? nextTime : '' },
    })
    setIsOpen(false)
  }

  const hasDueDate = Boolean(dueDateOnly)
  const shouldShowLabel = hasDueDate || emptyDisplay === 'icon-text'

  const dueDateLabel = useMemo(() => {
    if (!dueDateOnly) {
      return 'Due'
    }

    const formattedDate = moment(dueDateOnly).format('MMM D')
    if (useCustomTime && dueTime) {
      return `${formattedDate}, ${dueTime}`
    }

    return formattedDate
  }, [dueDateOnly, dueTime, useCustomTime])

  return (
    <>
      <div
        style={{ alignItems: 'center', display: 'flex', position: 'relative' }}
      >
        <button
          aria-expanded={isOpen}
          aria-haspopup='dialog'
          aria-label={hasDueDate ? `Due date: ${dueDateLabel}` : 'Set due date'}
          className={`btn btn-ghost ${size === 'lg' ? 'btn-lg' : size === 'sm' ? 'btn-sm' : ''}`}
          onClick={() => setIsOpen(true)}
          style={{
            background: hasDueDate ? 'var(--surface-2)' : 'var(--surface)',
            border: `1px solid ${hasDueDate ? 'transparent' : 'var(--line)'}`,
            borderRadius: 'var(--r-full)',
            color: 'var(--t-primary)',
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
          <FigmaIcon name='calendar' size={20} />
          <span
            aria-hidden='true'
            style={{
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
            {dueDateLabel}
          </span>
        </button>
        {hasDueDate && onClear && (
          <button
            aria-label='Clear due date'
            className='btn btn-danger btn-icon'
            onClick={e => {
              e.stopPropagation()
              onClear?.()
            }}
            style={{
              borderRadius: '50%',
              insetInlineEnd: -18,
              minHeight: 30,
              padding: 6,
              position: 'absolute',
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

      <DueDatePickerModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        dueDateOnly={dueDateOnly}
        dueTime={dueTime}
        useCustomTime={useCustomTime}
        onApply={handleSave}
        onRemove={
          onClear
            ? () => {
                onClear()
                setIsOpen(false)
              }
            : undefined
        }
      />
    </>
  )
}

export default DueDatePickerField

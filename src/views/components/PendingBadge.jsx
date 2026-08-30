import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import ModalActions from '../../components/common/ModalActions'
import FigmaIcon from '../../components/FigmaIcon'
import { useResponsiveModal } from '../../hooks/useResponsiveModal'
import { commandQueue } from '../../utils/CommandQueue'

const LABELS = {
  complete_chore: 'Complete pending',
  skip_chore: 'Skip pending',
  update_chore: 'Update pending',
  create_chore: 'Create pending',
  delete_chore: 'Delete pending',
  update_chore_history: 'Edit history pending',
  delete_chore_history: 'Delete history pending',
  reschedule_chore: 'Reschedule pending',
  archive_chore: 'Archive pending',
  unarchive_chore: 'Restore pending',
  start_chore: 'Start pending',
  pause_chore: 'Pause pending',
}

const formatCommandLabel = commandType => {
  return (
    LABELS[commandType] ||
    commandType
      ?.replace(/_/g, ' ')
      ?.replace(/\b\w/g, letter => letter.toUpperCase()) ||
    'Pending action'
  )
}

const spacing = value => `${value * 0.25}rem`

const CloudSyncIcon = ({ size = 16 }) => (
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
    <path d='M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25' />
    <path d='M8 16h8' />
    <path d='m8 16 3-3' />
    <path d='m8 16 3 3' />
  </svg>
)

function PendingBadge({ commands, size = 'sm', sx = {} }) {
  const { ResponsiveModal } = useResponsiveModal()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [cancelingIds, setCancelingIds] = useState({})
  const [isCancelingAll, setIsCancelingAll] = useState(false)

  const pendingSyncLabel = `${commands?.length || 0} pending action${commands?.length === 1 ? '' : 's'} to sync`

  if (!commands || commands.length === 0) return null

  const stopEvent = e => {
    e.stopPropagation()
  }

  const marginStyle = () => {
    const style = {}
    if (sx.mt !== undefined) style.marginTop = spacing(sx.mt)
    if (sx.me !== undefined) style.marginInlineEnd = spacing(sx.me)
    if (sx.ms !== undefined) style.marginInlineStart = spacing(sx.ms)
    if (sx.mb !== undefined) style.marginBottom = spacing(sx.mb)
    return style
  }

  const invalidatePending = async () => {
    await queryClient.invalidateQueries({ queryKey: ['pendingCommands'] })
    await queryClient.invalidateQueries({ queryKey: ['chores'] })
    await queryClient.invalidateQueries({ queryKey: ['choreHistory'] })
  }

  const handleUndo = async (e, cmdId) => {
    e.stopPropagation()
    setCancelingIds(prev => ({ ...prev, [cmdId]: true }))

    try {
      await commandQueue.cancel(cmdId)
      await invalidatePending()
    } finally {
      setCancelingIds(prev => {
        const next = { ...prev }
        delete next[cmdId]
        return next
      })
    }
  }

  const handleCancelAll = async e => {
    e.stopPropagation()
    if (commands.length === 0) return

    setIsCancelingAll(true)
    try {
      await Promise.all(commands.map(cmd => commandQueue.cancel(cmd.id)))
      await invalidatePending()
      setIsOpen(false)
    } finally {
      setIsCancelingAll(false)
      setCancelingIds({})
    }
  }

  const handleOpen = e => {
    e.stopPropagation()
    setIsOpen(true)
  }

  const handleClose = e => {
    if (e?.stopPropagation) {
      e.stopPropagation()
    }
    setIsOpen(false)
  }

  const isXs = size === 'xs'

  return (
    <div
      data-no-chore-nav='true'
      style={isXs ? { ...marginStyle(), marginTop: 0 } : marginStyle()}
    >
      <button
        type='button'
        className='btn btn-icon'
        onClick={handleOpen}
        onMouseDown={stopEvent}
        onPointerDown={stopEvent}
        aria-label={pendingSyncLabel}
        title={pendingSyncLabel}
        style={{
          borderRadius: '50%',
          minWidth: isXs ? 18 : 28,
          minHeight: isXs ? 18 : 28,
          width: isXs ? 18 : 28,
          height: isXs ? 18 : 28,
          padding: isXs ? 1 : 4,
          background: 'var(--sig-due-bg)',
          color: 'var(--sig-due)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <CloudSyncIcon size={isXs ? 14 : 16} />
      </button>

      <ResponsiveModal
        open={isOpen}
        onClose={handleClose}
        size='sm'
        title='Pending actions'
        footer={
          <ModalActions
            secondary={{ label: 'Close', onClick: handleClose }}
            primary={{
              label: 'Cancel all',
              color: 'danger',
              onClick: handleCancelAll,
              loading: isCancelingAll,
              disabled: commands.length === 0,
            }}
          />
        }
      >
        <p
          style={{
            margin: 0,
            marginBottom: spacing(1.5),
            color: 'var(--t-muted)',
            fontSize: 13,
          }}
        >
          {commands.length} action{commands.length > 1 ? 's' : ''} waiting to be
          synced.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing(0.5),
            marginBottom: spacing(1),
          }}
        >
          {commands.map(cmd => (
            <div
              key={cmd.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing(1),
                padding: spacing(1),
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-md)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                  {formatCommandLabel(cmd.commandType)}
                </p>
                <span style={{ fontSize: 11, color: 'var(--t-muted)' }}>
                  {new Date(cmd.createdAt).toLocaleString()}
                </span>
              </div>

              <button
                type='button'
                className='btn btn-ghost btn-icon'
                aria-label={`Cancel ${formatCommandLabel(cmd.commandType)}`}
                onClick={e => handleUndo(e, cmd.id)}
                disabled={Boolean(cancelingIds[cmd.id]) || isCancelingAll}
                style={{ color: 'var(--sig-over)' }}
              >
                <FigmaIcon name='x' size={14} />
              </button>
            </div>
          ))}
        </div>
      </ResponsiveModal>
    </div>
  )
}

export default PendingBadge

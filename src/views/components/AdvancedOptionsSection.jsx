import { useId } from 'react'

import FigmaIcon from '../../components/FigmaIcon'

const STRATEGY_OPTIONS = [
  { value: 'keep_last_assigned', label: 'Keep same assignee' },
  { value: 'random', label: 'Random' },
  { value: 'least_completed', label: 'Least completed' },
  { value: 'round_robin', label: 'Round robin' },
]

const FieldRow = ({ children, description, label, onLabelClick }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      padding: '6px 0',
    }}
  >
    {onLabelClick ? (
      <button
        type='button'
        onClick={onLabelClick}
        style={{
          minWidth: 0,
          flex: '1 1 auto',
          padding: 0,
          border: 0,
          background: 'transparent',
          color: 'inherit',
          cursor: 'pointer',
          font: 'inherit',
          textAlign: 'start',
        }}
      >
        <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>
          {label}
        </span>
        {description && (
          <span
            className='text-muted'
            style={{ display: 'block', marginTop: 2, fontSize: 12 }}
          >
            {description}
          </span>
        )}
      </button>
    ) : (
      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>
          {label}
        </span>
        {description && (
          <span
            className='text-muted'
            style={{ display: 'block', marginTop: 2, fontSize: 12 }}
          >
            {description}
          </span>
        )}
      </div>
    )}
    <div
      style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 8 }}
    >
      {children}
    </div>
  </div>
)

// Trigger button - place this inside the chip/action row
export const AdvancedOptionsTrigger = ({
  activeCount = 0,
  emptyDisplay = 'icon-text',
  onToggle,
  open,
}) => {
  const showLabel = emptyDisplay === 'icon-text' || open || activeCount > 0
  const isActive = open || activeCount > 0

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <button
        type='button'
        className='btn btn-secondary'
        onClick={onToggle}
        aria-expanded={open}
        style={{
          minHeight: 40,
          padding: showLabel ? '8px 10px' : '8px 6px',
          borderRadius: 'var(--r-sm)',
          gap: showLabel ? 8 : 0,
          background: isActive ? 'var(--brand-faint)' : undefined,
          borderColor: isActive ? 'var(--brand)' : undefined,
          transition: 'all 0.25s ease-in-out',
        }}
      >
        <span aria-hidden='true' style={{ fontSize: 20, lineHeight: 1 }}>
          ...
        </span>
        <span
          style={{
            maxWidth: showLabel ? 120 : 0,
            overflow: 'hidden',
            opacity: showLabel ? 1 : 0,
            transform: showLabel ? 'translateX(0)' : 'translateX(-4px)',
            transition:
              'max-width 0.25s ease-in-out, opacity 0.2s ease-in-out, transform 0.25s ease-in-out',
            whiteSpace: 'nowrap',
          }}
        >
          More
        </span>
      </button>

      {activeCount > 0 && (
        <span
          className='badge'
          style={{
            position: 'absolute',
            top: -6,
            right: -8,
            display: 'flex',
            width: 16,
            height: 16,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            borderRadius: '50%',
            background: 'var(--brand)',
            color: 'var(--brand-contrast)',
            fontSize: 10,
            fontWeight: 700,
            pointerEvents: 'none',
          }}
        >
          {activeCount}
        </span>
      )}
    </div>
  )
}

// Panel - place this as a sibling below the description/subtask sections
const AdvancedOptionsSection = ({
  assignStrategy,
  completionWindow,
  deadlineOffset,
  hasAssignees,
  hasDueDate,
  hasMultipleAssignees,
  isPrivate,
  onAssignStrategyChange,
  onCompletionWindowChange,
  onDeadlineOffsetChange,
  onIsPrivateChange,
  onPointsChange,
  onRequireApprovalChange,
  open,
  points,
  requireApproval,
}) => {
  const id = useId()
  const displayPoints = points <= 0 ? 0 : points

  const handleDecrement = () => {
    const next = Math.max(0, displayPoints - 1)
    onPointsChange(next === 0 ? -1 : next)
  }

  const handleIncrement = () => {
    onPointsChange(displayPoints + 1)
  }

  const handlePointsInput = e => {
    const v = parseInt(e.target.value)
    if (isNaN(v) || v <= 0) {
      onPointsChange(-1)
    } else {
      onPointsChange(Math.min(v, 9999))
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        opacity: open ? 1 : 0,
        transition:
          'grid-template-rows 0.25s ease-in-out, opacity 0.2s ease-in-out',
      }}
    >
      <div style={{ overflow: 'hidden' }}>
        <div
          className='card'
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 16,
            padding: '8px 16px',
            background: 'var(--surface-2)',
            boxShadow: 'none',
          }}
        >
          {/* Points */}
          <FieldRow
            label='Points'
            description='Award points for completing this task'
          >
            <button
              type='button'
              className='btn btn-secondary btn-icon btn-sm'
              onClick={handleDecrement}
              disabled={displayPoints === 0}
              aria-label='Decrease points'
              style={{ opacity: displayPoints === 0 ? 0.5 : 1 }}
            >
              <span aria-hidden='true'>-</span>
            </button>
            <input
              id={`${id}-points`}
              className='input'
              type='number'
              value={displayPoints === 0 ? '' : displayPoints}
              placeholder='0'
              min={0}
              max={9999}
              aria-label='Points'
              onChange={handlePointsInput}
              style={{ width: 64, padding: '5px 8px', textAlign: 'center' }}
            />
            <button
              type='button'
              className='btn btn-secondary btn-icon btn-sm'
              onClick={handleIncrement}
              aria-label='Increase points'
            >
              <FigmaIcon name='plus' size={16} />
            </button>
          </FieldRow>

          {/* Require approval */}
          <FieldRow
            label='Require approval'
            description='Task needs admin sign-off before it can be closed'
            onLabelClick={() => onRequireApprovalChange(!requireApproval)}
          >
            <input
              id={`${id}-require-approval`}
              type='checkbox'
              role='switch'
              checked={requireApproval}
              onChange={e => onRequireApprovalChange(e.target.checked)}
              aria-label='Require approval'
              style={{ width: 32, height: 18, accentColor: 'var(--brand)' }}
            />
          </FieldRow>

          {/* Privacy */}
          <FieldRow
            label='Limited visibility'
            description={
              !hasAssignees
                ? 'Assign someone to enable limited visibility'
                : 'Only you and assignees can see this task'
            }
            onLabelClick={
              hasAssignees ? () => onIsPrivateChange(!isPrivate) : undefined
            }
          >
            <input
              id={`${id}-limited-visibility`}
              type='checkbox'
              role='switch'
              checked={isPrivate}
              disabled={!hasAssignees}
              onChange={e => onIsPrivateChange(e.target.checked)}
              aria-label='Limited visibility'
              style={{ width: 32, height: 18, accentColor: 'var(--brand)' }}
            />
          </FieldRow>

          {/* Assignment strategy - only shown when there are multiple assignees */}
          {hasMultipleAssignees && (
            <FieldRow
              label='Assign strategy'
              description='How to pick the next assignee each recurrence'
            >
              <select
                id={`${id}-assign-strategy`}
                className='input'
                value={assignStrategy}
                aria-label='Assign strategy'
                onChange={e => onAssignStrategyChange(e.target.value)}
                style={{ minWidth: 190, padding: '5px 8px' }}
              >
                {STRATEGY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FieldRow>
          )}

          {/* Completion window and deadline - only when due date set */}
          {hasDueDate ? (
            <>
              <FieldRow
                label='Available from'
                description='Hours before the due date the task becomes available'
              >
                <div style={{ position: 'relative', width: 96 }}>
                  <input
                    id={`${id}-completion-window`}
                    className='input'
                    type='number'
                    placeholder='-'
                    value={completionWindow > -1 ? completionWindow : ''}
                    min={0}
                    aria-label='Hours before due date'
                    onChange={e => {
                      const v = parseInt(e.target.value)
                      onCompletionWindowChange(isNaN(v) ? -1 : Math.max(0, v))
                    }}
                    style={{ padding: '5px 30px 5px 8px' }}
                  />
                  <span
                    className='text-muted'
                    aria-hidden='true'
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: 8,
                      fontSize: 12,
                      pointerEvents: 'none',
                      transform: 'translateY(-50%)',
                    }}
                  >
                    hrs
                  </span>
                </div>
              </FieldRow>

              <FieldRow
                label='Expires after'
                description='Hours after the due date when the task can no longer be completed'
              >
                <div style={{ position: 'relative', width: 96 }}>
                  <input
                    id={`${id}-deadline-offset`}
                    className='input'
                    type='number'
                    placeholder='-'
                    value={deadlineOffset > -1 ? deadlineOffset : ''}
                    min={0}
                    aria-label='Hours after due date'
                    onChange={e => {
                      const v = parseInt(e.target.value)
                      onDeadlineOffsetChange(isNaN(v) ? -1 : Math.max(0, v))
                    }}
                    style={{ padding: '5px 30px 5px 8px' }}
                  />
                  <span
                    className='text-muted'
                    aria-hidden='true'
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: 8,
                      fontSize: 12,
                      pointerEvents: 'none',
                      transform: 'translateY(-50%)',
                    }}
                  >
                    hrs
                  </span>
                </div>
              </FieldRow>
            </>
          ) : (
            <p
              className='text-muted'
              style={{ margin: '4px 0', fontSize: 12, fontStyle: 'italic' }}
            >
              Set a due date to configure completion window and deadline.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdvancedOptionsSection

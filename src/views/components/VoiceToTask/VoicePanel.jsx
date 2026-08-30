import './VoicePanel.css'

import moment from 'moment'
import { useEffect, useMemo, useRef, useState } from 'react'

import FigmaIcon from '../../../components/FigmaIcon'
import { TASK_COLOR } from '../../../utils/Colors'
import { isPlusAccount } from '../../../utils/Helpers'
import AssigneePickerField from '../AssigneePickerField'
import DueDatePickerField from '../DueDatePickerField'
import LabelsPickerField from '../LabelsPickerField'
import NotificationPickerField from '../NotificationPickerField'
import PriorityPickerField from '../PriorityPickerField'
import RepeatPickerField from '../RepeatPickerField'
import { parseVoiceTask } from './parseVoiceTask'
import { useVoiceToTask } from './useVoiceToTask'

const HIGHLIGHT_CLASS = {
  repeat: 'highlight-repeat',
  priority: 'highlight-priority',
  points: 'highlight-points',
  assignee: 'highlight-assignee',
  label: 'highlight-label',
  dueDate: 'highlight-date',
}

const PRIORITY_COLORS = {
  0: TASK_COLOR.NO_PRIORITY,
  1: TASK_COLOR.PRIORITY_1,
  2: TASK_COLOR.PRIORITY_2,
  3: TASK_COLOR.PRIORITY_3,
  4: TASK_COLOR.PRIORITY_4,
}

const PRIORITY_LABELS = {
  0: '--',
  1: 'P1',
  2: 'P2',
  3: 'P3',
  4: 'P4',
}

const renderTranscript = (text, highlights) => {
  const parts = []
  let lastIndex = 0
  for (const h of highlights) {
    if (h.start > lastIndex) parts.push(text.substring(lastIndex, h.start))
    parts.push(
      <span
        key={h.start}
        className={HIGHLIGHT_CLASS[h.type]}
        style={{
          textDecoration: 'underline',
          textDecorationThickness: '2px',
          textDecorationStyle: 'dashed',
        }}
      >
        {text.substring(h.start, h.end)}
      </span>,
    )
    lastIndex = h.end
  }
  if (lastIndex < text.length) parts.push(text.substring(lastIndex))
  return parts
}

const formatDue = dueDate => {
  const m = moment(dueDate)
  return m.format('HH:mm') === '23:59'
    ? m.format('MMM D')
    : m.format('MMM D, h:mm A')
}

// Compact description for picker-overridden frequencies where the parser's
// human name no longer applies
const describeFrequency = f => {
  if (!f) return null
  if (f.frequencyType === 'interval') {
    const unit = f.frequencyMetadata?.unit || 'days'
    return f.frequency > 1
      ? `Every ${f.frequency} ${unit}`
      : `Every ${unit.replace(/s$/, '')}`
  }
  const names = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    days_of_the_week: 'Custom days',
    day_of_the_month: 'Monthly',
  }
  return names[f.frequencyType] || 'Repeats'
}

const buildChips = (
  effective,
  frequencyLabel,
  { canRemind, currentUserId, members },
) => {
  const chips = []
  if (effective.dueDate) {
    chips.push({
      key: 'due',
      color: 'warning',
      icon: <FigmaIcon name='calendar' size={12} />,
      label: formatDue(effective.dueDate),
    })
  }
  if (frequencyLabel) {
    chips.push({
      key: 'repeat',
      color: 'success',
      icon: <FigmaIcon name='repeat' size={12} />,
      label: frequencyLabel,
    })
  }
  if (effective.priority > 0) {
    chips.push({
      key: 'priority',
      color: 'danger',
      icon: <FigmaIcon name='flag' size={12} />,
      label: `P${effective.priority}`,
    })
  }
  // Mirrors buildChorePayload: reminders only reach the backend for Plus
  // accounts on a task that has something to remind against
  const reminderCount = effective.notificationMetadata?.templates?.length || 0
  if (
    canRemind &&
    reminderCount > 0 &&
    (effective.dueDate || effective.frequency)
  ) {
    chips.push({
      key: 'reminders',
      color: 'neutral',
      icon: <FigmaIcon name='bell' size={12} />,
      label: reminderCount > 1 ? `${reminderCount} reminders` : '1 reminder',
    })
  }
  if (effective.points != null) {
    chips.push({
      key: 'points',
      color: 'primary',
      icon: <TollIcon size={12} />,
      label: `${effective.points} pts`,
    })
  }
  effective.labelNames.forEach(name => {
    chips.push({
      key: `label-${name}`,
      color: 'primary',
      icon: <FigmaIcon name='tag' size={12} />,
      label: name,
    })
  })
  if (effective.isAnyone) {
    chips.push({
      key: 'assignee',
      color: 'neutral',
      icon: <FigmaIcon name='user' size={12} />,
      label: 'Anyone',
    })
  } else if (
    effective.assignees.length > 0 &&
    effective.assignees[0].userId !== currentUserId
  ) {
    const member = members.find(m => m.userId === effective.assignees[0].userId)
    if (member) {
      chips.push({
        key: 'assignee',
        color: 'neutral',
        icon: <FigmaIcon name='user' size={12} />,
        label: member.displayName,
      })
    }
  }
  return chips
}

const MicIcon = ({ size = 20 }) => (
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
    <path d='M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' />
    <path d='M19 10v2a7 7 0 0 1-14 0v-2' />
    <path d='M12 19v4' />
  </svg>
)

const GraphicEqIcon = ({ size = 16 }) => (
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
    <path d='M4 20v-6' />
    <path d='M10 20V4' />
    <path d='M16 20v-8' />
    <path d='M20 20v-4' />
  </svg>
)

const TollIcon = ({ size = 16 }) => (
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
    <circle cx='12' cy='12' r='9' />
    <path d='M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' />
  </svg>
)

const TaskPreviewCard = ({
  onPatch,
  onRemove,
  onUpdate,
  parseCtx,
  segment,
}) => {
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState(segment.text)
  const dueEditRef = useRef(null)

  const parsed = useMemo(
    () => parseVoiceTask(segment.text, parseCtx),
    [segment.text, parseCtx],
  )
  const overrides = useMemo(() => segment.overrides || {}, [segment.overrides])
  // The parser has no notion of reminders, so the account default stands in
  // until the card overrides it — same fallback buildChorePayload applies
  const effective = useMemo(
    () => ({
      ...parsed,
      notificationMetadata: {
        templates: parseCtx.defaultNotificationTemplates || [],
      },
      ...overrides,
    }),
    [parsed, overrides, parseCtx.defaultNotificationTemplates],
  )

  const frequencyLabel =
    'frequency' in overrides
      ? describeFrequency(effective.frequency)
      : parsed.frequencyName
  const chips = useMemo(
    () => buildChips(effective, frequencyLabel, parseCtx),
    [effective, frequencyLabel, parseCtx],
  )

  const due = effective.dueDate ? moment(effective.dueDate) : null
  const dueDateOnly = due ? due.format('YYYY-MM-DD') : null
  const hasCustomTime = !!due && due.format('HH:mm') !== '23:59'
  const dueTime = hasCustomTime ? due.format('HH:mm') : null

  // DueDatePickerField's Apply fires date/custom-time/time callbacks in
  // sequence; collect them in one microtask so they land as a single patch
  const queueDuePatch = patch => {
    if (!dueEditRef.current) {
      dueEditRef.current = {
        date: dueDateOnly,
        time: dueTime,
        custom: hasCustomTime,
      }
      queueMicrotask(() => {
        const { custom, date, time } = dueEditRef.current
        dueEditRef.current = null
        if (!date) {
          onPatch({ dueDate: null })
        } else {
          onPatch({
            dueDate:
              custom && time
                ? moment(`${date}T${time}`).format('YYYY-MM-DDTHH:mm:00')
                : moment(date).endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
          })
        }
      })
    }
    Object.assign(dueEditRef.current, patch)
  }

  const commitText = () => {
    if (draft.trim() !== segment.text) onUpdate(draft)
  }

  return (
    <div
      className='voice-task-card'
      style={{
        borderRadius: 'var(--r-md)',
        border: '1px solid',
        borderColor: expanded ? 'var(--brand)' : 'var(--line)',
        background: 'var(--surface)',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        {expanded ? (
          <input
            className='input'
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitText()
              if (e.key === 'Escape') setDraft(segment.text)
            }}
            onBlur={commitText}
            style={{ flex: 1 }}
          />
        ) : (
          <span
            role='button'
            tabIndex={0}
            style={{
              flex: 1,
              cursor: 'pointer',
              wordBreak: 'break-word',
              color: 'var(--t-primary)',
              fontWeight: 700,
              fontSize: '14px',
              lineHeight: 1.4,
              fontFamily: 'var(--font-ui)',
            }}
            onClick={() => {
              setDraft(segment.text)
              setExpanded(true)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setDraft(segment.text)
                setExpanded(true)
              }
            }}
          >
            {parsed.title || segment.text}
          </span>
        )}
        {expanded && (
          <button
            type='button'
            aria-label='Confirm edited text'
            className='btn btn-sm'
            onClick={() => {
              commitText()
              setExpanded(false)
            }}
            style={{
              flexShrink: 0,
              width: 28,
              height: 28,
              minHeight: 28,
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--brand)',
              color: 'var(--brand-contrast)',
              borderColor: 'var(--brand)',
            }}
          >
            <FigmaIcon name='check' size={16} />
          </button>
        )}
        <button
          type='button'
          aria-label='Remove task'
          onClick={onRemove}
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            minHeight: 28,
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            color: 'var(--t-muted)',
            cursor: 'pointer',
          }}
        >
          <FigmaIcon name='x' size={16} />
        </button>
      </div>

      {!expanded && chips.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            cursor: 'pointer',
          }}
          onClick={() => {
            setDraft(segment.text)
            setExpanded(true)
          }}
        >
          {chips.map(chip => (
            <span
              key={chip.key}
              className='badge'
              style={chipStyle(chip.color)}
            >
              {chip.icon}
              {chip.label}
            </span>
          ))}
        </div>
      )}

      {expanded && (
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            flexDirection: 'row',
            gap: '8px',
            overflowX: 'auto',
            paddingTop: '4px',
            scrollbarWidth: 'none',
          }}
        >
          <DueDatePickerField
            emptyDisplay='icon'
            dueDateOnly={dueDateOnly}
            dueTime={dueTime}
            useCustomTime={hasCustomTime}
            onDueDateChange={e =>
              queueDuePatch({ date: e.target.value || null })
            }
            onDueTimeChange={e =>
              queueDuePatch({ time: e.target.value || null })
            }
            onUseCustomTimeChange={checked =>
              queueDuePatch({ custom: checked })
            }
            onClear={() => onPatch({ dueDate: null })}
          />
          <RepeatPickerField
            emptyDisplay='icon'
            value={effective.frequency}
            onChange={f => onPatch({ frequency: f })}
            onClear={() => onPatch({ frequency: null })}
          />
          <PriorityPickerField
            emptyDisplay='icon'
            value={effective.priority}
            onChange={p => onPatch({ priority: p })}
            onClear={() => onPatch({ priority: 0 })}
            priorityColors={PRIORITY_COLORS}
            priorityLabels={PRIORITY_LABELS}
          />
          <AssigneePickerField
            emptyDisplay='icon'
            values={effective.assignees.map(a => a.userId)}
            isAnyone={effective.isAnyone}
            onChange={userIds => {
              if (userIds.includes('anyone')) {
                onPatch({ isAnyone: true, assignees: [] })
              } else {
                onPatch({
                  isAnyone: false,
                  assignees: userIds.map(userId => ({ userId })),
                })
              }
            }}
            onClear={() => onPatch({ isAnyone: false, assignees: [] })}
            currentUserId={parseCtx.currentUserId}
            members={parseCtx.members}
          />
          <LabelsPickerField
            emptyDisplay='icon'
            values={effective.labelIds}
            onChange={ids => onPatch({ labelIds: ids })}
            onClear={() => onPatch({ labelIds: [] })}
            labels={parseCtx.userLabels}
          />
          {parseCtx.canRemind && (
            <NotificationPickerField
              emptyDisplay='icon'
              value={effective.notificationMetadata}
              onChange={metadata => onPatch({ notificationMetadata: metadata })}
              onClear={() =>
                onPatch({ notificationMetadata: { templates: [] } })
              }
            />
          )}
        </div>
      )}
    </div>
  )
}

const chipStyle = color => {
  const palette = {
    primary: { background: 'var(--brand-faint)', color: 'var(--brand)' },
    neutral: { background: 'var(--surface-2)', color: 'var(--t-muted)' },
    success: { background: 'var(--sig-done-bg)', color: 'var(--sig-done)' },
    warning: { background: 'var(--sig-due-bg)', color: 'var(--sig-due)' },
    danger: { background: 'var(--sig-over-bg)', color: 'var(--sig-over)' },
  }
  return palette[color] || palette.neutral
}

/**
 * Inline voice-to-task panel. Mounts inside AddTaskModal — no second modal.
 *
 * Mounted only while voice capture is active, and opens straight into
 * hands-free listening. Pauses and spoken separators ("also") split the
 * transcript into task cards; tapping a card opens inline pickers whose edits
 * override the parsed values. The confirm action lives in the modal footer
 * alongside Cancel — this panel only reports its state up through
 * onStateChange so the modal can label and enable that button.
 */
const VoicePanel = ({
  defaultNotificationTemplates = [],
  members = [],
  onStateChange,
  userLabels = [],
  userProfile,
}) => {
  const {
    isLocked,
    isNative,
    micPressDown,
    micPressUp,
    partialText,
    patchSegment,
    phase,
    removeSegment,
    segments,
    startHandsFree,
    updateSegment,
  } = useVoiceToTask({ members, userLabels })
  const segmentsScrollRef = useRef(null)

  const parseCtx = useMemo(
    () => ({
      userLabels,
      members,
      currentUserId: userProfile?.id,
      canRemind: isPlusAccount(userProfile),
      defaultNotificationTemplates,
    }),
    [userLabels, members, userProfile, defaultNotificationTemplates],
  )

  const partialParsed = useMemo(
    () => (partialText ? parseVoiceTask(partialText, parseCtx) : null),
    [partialText, parseCtx],
  )

  // Start capturing the moment the panel mounts — the mic tap that opened it
  // is the only tap needed. startHandsFree no-ops if already listening.
  useEffect(() => {
    startHandsFree()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the newest captured task visible as more are added
  useEffect(() => {
    const el = segmentsScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [segments.length])

  const isListening = phase === 'listening'

  // The confirm action lives in the modal footer, so report the raw segments
  // and whether the mic is live — that's all it needs to label and enable the
  // button. It parses the segments itself when the user confirms.
  useEffect(() => {
    onStateChange?.({ segments, isListening })
  }, [segments, isListening, onStateChange])

  const micCaption = isListening
    ? isLocked
      ? 'Listening — tap to stop'
      : 'Release to finish · quick tap locks hands-free'
    : segments.length > 0
      ? 'Hold to add another task'
      : 'Hold to speak · quick tap for hands-free'

  return (
    <div>
      {/* ── Header ── */}
      <div
        style={{
          paddingTop: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ color: 'var(--brand)', lineHeight: 0 }}>
          <GraphicEqIcon size={16} />
        </span>
        <span
          style={{
            color: 'var(--t-primary)',
            fontWeight: 700,
            fontSize: '14px',
            fontFamily: 'var(--font-ui)',
          }}
        >
          Speak your tasks
        </span>
        {isNative && (
          <span
            className='badge'
            style={{
              marginInlineStart: 'auto',
              ...chipStyle('success'),
            }}
          >
            <FigmaIcon name='lock' size={12} />
            On-device
          </span>
        )}
      </div>

      {/* ── Permission denied ── */}
      {phase === 'denied' && (
        <div style={{ padding: '16px 0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                color: 'var(--sig-over)',
                marginTop: '2px',
                flexShrink: 0,
                lineHeight: 0,
              }}
            >
              <FigmaIcon name='error' size={16} />
            </span>
            <span
              style={{
                color: 'var(--t-muted)',
                fontSize: '13px',
                lineHeight: 1.4,
                fontFamily: 'var(--font-ui)',
              }}
            >
              Microphone access is needed for voice capture. Enable it in your
              device settings and try again.
            </span>
          </div>
          <button
            type='button'
            className='btn btn-secondary btn-sm'
            onClick={startHandsFree}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── Captured task cards ── */}
      {segments.length > 0 && (
        <div
          ref={segmentsScrollRef}
          style={{
            paddingTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: 300,
            overflowY: 'auto',
          }}
        >
          {segments.map(segment => (
            <TaskPreviewCard
              key={segment.id}
              segment={segment}
              parseCtx={parseCtx}
              onRemove={() => removeSegment(segment.id)}
              onUpdate={text => updateSegment(segment.id, text)}
              onPatch={patch => patchSegment(segment.id, patch)}
            />
          ))}
        </div>
      )}

      {/* ── Live transcript ── */}
      {isListening && (
        <div style={{ paddingTop: '10px' }}>
          <div
            style={{
              minHeight: 44,
              borderRadius: 'var(--r-md)',
              border: '1px dashed var(--line)',
              padding: '8px 10px',
            }}
          >
            {partialText ? (
              <span
                style={{
                  color: 'var(--t-primary)',
                  fontSize: '15px',
                  lineHeight: 1.4,
                  fontFamily: 'var(--font-ui)',
                  wordBreak: 'break-word',
                }}
              >
                {renderTranscript(partialText, partialParsed?.highlights || [])}
              </span>
            ) : (
              <span
                style={{
                  color: 'var(--t-muted)',
                  opacity: 0.5,
                  fontSize: '13px',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                Listening…
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Mic stage ── */}
      {phase !== 'denied' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 0',
            gap: '10px',
          }}
        >
          <div className='voice-eq' style={{ opacity: isListening ? 1 : 0 }}>
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <button
            type='button'
            aria-label={isListening ? 'Stop listening' : 'Start voice capture'}
            className={`voice-mic-btn${isListening ? ' listening' : ''}`}
            onPointerDown={e => {
              e.preventDefault()
              e.currentTarget.setPointerCapture?.(e.pointerId)
              micPressDown()
            }}
            onPointerUp={micPressUp}
            onPointerCancel={micPressUp}
            onContextMenu={e => e.preventDefault()}
          >
            <span className='voice-pulse-ring' />
            <span className='voice-pulse-ring' />
            <span style={{ lineHeight: 0, position: 'relative', zIndex: 1 }}>
              <MicIcon size={32} />
            </span>
          </button>
          <span
            style={{
              color: 'var(--t-muted)',
              opacity: 0.7,
              fontSize: '12px',
              fontFamily: 'var(--font-ui)',
            }}
          >
            {micCaption}
          </span>
          <span
            style={{
              color: 'var(--t-muted)',
              opacity: 0.5,
              paddingInline: '16px',
              textAlign: 'center',
              fontSize: '12px',
              fontFamily: 'var(--font-ui)',
            }}
          >
            Pause between tasks &middot; say &ldquo;scratch that&rdquo; to
            remove the last one
          </span>
        </div>
      )}
    </div>
  )
}

export default VoicePanel

import moment from 'moment'
import { useEffect, useState } from 'react'
import Calendar from 'react-calendar'

import ModalActions from '../../components/common/ModalActions'
import FigmaIcon from '../../components/FigmaIcon'
import { useLocalization } from '../../contexts/LocalizationContext'
import { useResponsiveModal } from '../../hooks/useResponsiveModal'

const sectionLabelStyle = {
  color: 'var(--t-muted)',
  font: '700 11px/1.2 var(--font-ui)',
  letterSpacing: '0.05em',
  margin: '0 0 6px',
  textTransform: 'uppercase',
}

const quickOptionStyle = selected => ({
  alignItems: 'center',
  background: selected ? 'var(--brand-faint)' : 'var(--surface-2)',
  border: `1px solid ${selected ? 'var(--brand)' : 'var(--line)'}`,
  borderRadius: 'var(--r-full)',
  color: selected ? 'var(--brand)' : 'var(--t-primary)',
  cursor: 'pointer',
  display: 'inline-flex',
  font: '700 12px var(--font-ui)',
  gap: 4,
  minHeight: 32,
  padding: '5px 10px',
})

const toggleStyle = selected => ({
  background: selected ? 'var(--brand-faint)' : 'transparent',
  border: `1px solid ${selected ? 'var(--brand)' : 'transparent'}`,
  borderRadius: 'var(--r-sm)',
  color: selected ? 'var(--brand)' : 'var(--t-muted)',
  cursor: 'pointer',
  font: '700 12px var(--font-ui)',
  minHeight: 30,
  padding: '5px 11px',
})

const calendarStyles = `
  [data-due-date-calendar] .react-calendar {
    display: flex;
    flex: 1;
    flex-direction: column;
  }
  [data-due-date-calendar] .react-calendar__viewContainer {
    display: flex;
    flex: 1;
    flex-direction: column;
  }
  [data-due-date-calendar] .react-calendar__month-view,
  [data-due-date-calendar] .react-calendar__year-view,
  [data-due-date-calendar] .react-calendar__decade-view,
  [data-due-date-calendar] .react-calendar__century-view {
    flex: 1;
  }
  [data-due-date-calendar] .react-calendar__navigation {
    align-items: center;
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
  }
  [data-due-date-calendar] .react-calendar__navigation button {
    align-items: center;
    background: none;
    border: 0;
    border-radius: var(--r-sm);
    color: var(--t-primary);
    cursor: pointer;
    display: flex;
    font: 600 14px var(--font-ui);
    justify-content: center;
    min-height: 40px;
    min-width: 40px;
    padding: 0 8px;
  }
  [data-due-date-calendar] .react-calendar__navigation button:hover {
    background: var(--surface-2);
  }
  [data-due-date-calendar] .react-calendar__navigation button:disabled {
    cursor: default;
    opacity: 0.35;
  }
  [data-due-date-calendar] .react-calendar__navigation__label {
    flex: 1;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.01em;
  }
  [data-due-date-calendar] .react-calendar__navigation__prev-button,
  [data-due-date-calendar] .react-calendar__navigation__next-button {
    font-size: 28px;
  }
  [data-due-date-calendar] .react-calendar__navigation__prev2-button,
  [data-due-date-calendar] .react-calendar__navigation__next2-button {
    font-size: 22px;
  }
  [data-due-date-calendar] .react-calendar__month-view__weekdays__weekday {
    color: var(--t-muted);
    font: 600 11px var(--font-ui);
    letter-spacing: 0.04em;
    padding: 4px 0;
    text-align: center;
    text-transform: uppercase;
  }
  [data-due-date-calendar] .react-calendar__month-view__weekdays__weekday abbr {
    text-decoration: none;
  }
  [data-due-date-calendar] .react-calendar__tile {
    align-items: center;
    background: none;
    border: 0;
    color: var(--t-primary);
    cursor: pointer;
    display: flex;
    font: 13px var(--font-ui);
    justify-content: center;
  }
  [data-due-date-calendar] .react-calendar__tile:hover {
    background: var(--surface-2);
  }
  [data-due-date-calendar] .react-calendar__month-view__days .react-calendar__tile {
    aspect-ratio: 1;
    border-radius: 50%;
  }
  [data-due-date-calendar] .react-calendar__year-view .react-calendar__tile,
  [data-due-date-calendar] .react-calendar__decade-view .react-calendar__tile,
  [data-due-date-calendar] .react-calendar__century-view .react-calendar__tile {
    border-radius: var(--r-sm);
    font-size: 14px;
    padding: 10px 4px;
  }
  [data-due-date-calendar] .react-calendar__tile--now {
    background: none !important;
    border: 1.5px solid var(--brand) !important;
    color: var(--brand) !important;
    font-weight: 700;
  }
  [data-due-date-calendar] .react-calendar__tile--active,
  [data-due-date-calendar] .react-calendar__tile--active:hover {
    background: var(--brand) !important;
    color: var(--brand-contrast) !important;
    font-weight: 700;
  }
  [data-due-date-calendar] .react-calendar__month-view__days__day--neighboringMonth {
    color: var(--t-faint);
  }
  [data-due-date-calendar] .react-calendar__month-view__days,
  [data-due-date-calendar] .react-calendar__month-view__weekdays {
    display: grid !important;
    grid-template-columns: repeat(7, 1fr) !important;
  }
`

// Split a date-ish value (ISO string / Date) into the parts this picker edits.
export const splitDueDate = value => {
  if (!value) {
    return { dueDateOnly: null, dueTime: null, useCustomTime: false }
  }
  const m = moment(value)
  if (!m.isValid()) {
    return { dueDateOnly: null, dueTime: null, useCustomTime: false }
  }
  const time = m.format('HH:mm')
  return {
    dueDateOnly: m.format('YYYY-MM-DD'),
    dueTime: time,
    // Midnight is how a date-only value round-trips, so treat it as "anytime"
    useCustomTime: time !== '00:00',
  }
}

// Inverse of splitDueDate — returns a Date, or null when there is no due date.
export const combineDueDate = ({ dueDateOnly, dueTime, useCustomTime }) => {
  if (!dueDateOnly) return null
  const time = useCustomTime && dueTime ? dueTime : '00:00'
  return moment(`${dueDateOnly} ${time}`, 'YYYY-MM-DD HH:mm').toDate()
}

export const getQuickScheduleDate = option => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (option) {
    case 'today':
      return today
    case 'tomorrow': {
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      return tomorrow
    }
    case 'weekend': {
      const weekend = new Date(today)
      const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7
      weekend.setDate(today.getDate() + daysUntilSaturday)
      return weekend
    }
    case 'next-week': {
      const nextWeek = new Date(today)
      const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7
      nextWeek.setDate(today.getDate() + daysUntilMonday)
      return nextWeek
    }
    case 'next-month': {
      const nextMonth = new Date(today)
      nextMonth.setMonth(today.getMonth() + 1)
      return nextMonth
    }
    default:
      return today
  }
}

const toDateKey = date => moment(date).format('YYYY-MM-DD')

/**
 * The shared due-date picker UI (quick dates, quick times, calendar, custom
 * time). Used both by DueDatePickerField and by anything that needs to
 * reschedule a task — task cards, swipe actions, action menus.
 */
const DueDatePickerModal = ({
  applyLabel = 'Apply',
  dueDateOnly,
  dueTime,
  onApply,
  onClose,
  onRemove,
  open,
  title = 'Due Date',
  useCustomTime,
}) => {
  const { ResponsiveModal } = useResponsiveModal()
  const { firstDayOfWeek } = useLocalization()

  // Local buffered state — only committed on Apply
  const [localDueDateOnly, setLocalDueDateOnly] = useState(dueDateOnly)
  const [localDueTime, setLocalDueTime] = useState(dueTime)
  const [localUseCustomTime, setLocalUseCustomTime] = useState(useCustomTime)

  // Sync local state from props whenever the modal opens
  useEffect(() => {
    if (open) {
      setLocalDueDateOnly(dueDateOnly)
      setLocalDueTime(dueTime)
      setLocalUseCustomTime(useCustomTime)
    }
  }, [open, dueDateOnly, dueTime, useCustomTime])

  const calendarType =
    firstDayOfWeek === 1
      ? 'iso8601'
      : firstDayOfWeek === 6
        ? 'islamic'
        : 'gregory'

  const handleQuickSchedule = option => {
    setLocalDueDateOnly(toDateKey(getQuickScheduleDate(option)))
  }

  const handleQuickTime = timeStr => {
    // Tap the active chip again to deselect it
    if (localUseCustomTime && localDueTime === timeStr) {
      setLocalUseCustomTime(false)
      setLocalDueTime(null)
      return
    }
    if (!localDueDateOnly) {
      setLocalDueDateOnly(toDateKey(new Date()))
    }
    setLocalUseCustomTime(true)
    setLocalDueTime(timeStr)
  }

  const handleCalendarChange = selected => {
    if (!selected || Array.isArray(selected)) return
    setLocalDueDateOnly(moment(selected).format('YYYY-MM-DD'))
  }

  const handleLocalTimeInputChange = e => {
    setLocalUseCustomTime(true)
    setLocalDueTime(e.target.value)
  }

  const handleSave = () => {
    onApply?.({
      dueDateOnly: localDueDateOnly || null,
      dueTime: localUseCustomTime ? localDueTime || null : null,
      useCustomTime: Boolean(localUseCustomTime && localDueTime),
    })
  }

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title={title}
      fullWidth={false}
      footer={
        <ModalActions
          tertiary={
            onRemove && dueDateOnly
              ? {
                  label: 'Remove',
                  color: 'danger',
                  onClick: onRemove,
                }
              : undefined
          }
          secondary={{ label: 'Cancel', onClick: onClose }}
          primary={{ label: applyLabel, onClick: handleSave }}
        />
      }
    >
      <div style={{ fontFamily: 'var(--font-ui)', maxWidth: 360 }}>
        {/* Date shortcuts */}
        <p style={sectionLabelStyle}>Quick date</p>
        <div
          aria-label='Quick date'
          role='group'
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 12,
          }}
        >
          {[
            {
              key: 'today',
              label: 'Today',
              icon: 'today',
            },
            {
              key: 'tomorrow',
              label: 'Tomorrow',
              icon: 'today',
            },
            {
              key: 'weekend',
              label: 'Weekend',
              icon: 'home',
            },
            {
              key: 'next-week',
              label: 'Next week',
              icon: 'calendar',
            },
            {
              key: 'next-month',
              label: 'Next month',
              icon: 'calendar',
            },
          ].map(opt => {
            const dateStr = toDateKey(getQuickScheduleDate(opt.key))
            return (
              <button
                aria-pressed={localDueDateOnly === dateStr}
                key={opt.key}
                onClick={() => handleQuickSchedule(opt.key)}
                style={quickOptionStyle(localDueDateOnly === dateStr)}
                type='button'
              >
                <FigmaIcon name={opt.icon} size={14} />
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Time shortcuts */}
        <p style={sectionLabelStyle}>Quick time</p>
        <div
          aria-label='Quick time'
          role='group'
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 12,
          }}
        >
          {[
            {
              time: '09:00',
              label: 'Morning',
              icon: 'today',
            },
            {
              time: '12:00',
              label: 'Noon',
              icon: 'today',
            },
            {
              time: '15:00',
              label: 'Afternoon',
              icon: 'today',
            },
            {
              time: '18:00',
              label: 'Evening',
              icon: 'home',
            },
            {
              time: '22:00',
              label: 'Night',
              icon: 'home',
            },
          ].map(opt => (
            <button
              aria-pressed={localUseCustomTime && localDueTime === opt.time}
              key={opt.time}
              onClick={() => handleQuickTime(opt.time)}
              style={quickOptionStyle(
                localUseCustomTime && localDueTime === opt.time,
              )}
              type='button'
            >
              <FigmaIcon name={opt.icon} size={14} />
              {opt.label}
            </button>
          ))}
        </div>

        <style>{calendarStyles}</style>
        <div
          data-due-date-calendar
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-md)',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: 12,
            minHeight: 300,
            padding: 8,
          }}
        >
          <Calendar
            value={
              localDueDateOnly ? new Date(`${localDueDateOnly}T00:00:00`) : null
            }
            calendarType={calendarType}
            onChange={handleCalendarChange}
            formatShortWeekday={(locale, date) =>
              ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][date.getDay()]
            }
            formatMonth={(locale, date) =>
              [
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec',
              ][date.getMonth()]
            }
          />
        </div>
        <p style={sectionLabelStyle}>Custom time</p>
        <input
          aria-label='Custom time'
          disabled={!localDueDateOnly}
          onChange={handleLocalTimeInputChange}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--t-primary)',
            font: '14px var(--font-ui)',
            marginBottom: 8,
            maxWidth: 200,
            minHeight: 32,
            padding: '4px 8px',
          }}
          type='time'
          value={localUseCustomTime ? localDueTime || '' : ''}
        />
        <div
          aria-label='Time precision'
          role='group'
          style={{ display: 'flex', gap: 6, marginBottom: 4 }}
        >
          <button
            aria-pressed={!localUseCustomTime}
            disabled={!localDueDateOnly}
            onClick={() => setLocalUseCustomTime(false)}
            style={toggleStyle(!localUseCustomTime)}
            type='button'
          >
            Anytime
          </button>
          <button
            aria-pressed={localUseCustomTime}
            disabled={!localDueDateOnly}
            onClick={() => setLocalUseCustomTime(true)}
            style={toggleStyle(localUseCustomTime)}
            type='button'
          >
            Specific time
          </button>
        </div>
      </div>
    </ResponsiveModal>
  )
}

export default DueDatePickerModal

import { useState } from 'react'

import { AppCtx, Icon } from '../App'
import { EmptyState, PageSection, PageShell } from '../components/page'
import PageHeader from '../components/PageHeader'
import type { Task } from '../data'
import { formatDate } from '../data'
import { useLiveData } from '../model/liveData'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const dayStart = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())
const addDays = (date: Date, n: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + n)
const mondayOf = (date: Date) => addDays(date, -((date.getDay() + 6) % 7))
const iso = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
const monthTitle = (date: Date) =>
  `${MONTHS[date.getMonth()]} ${date.getFullYear()}`

export default function CalendarScreen({
  ctx,
  tasks,
}: {
  ctx: AppCtx
  tasks: Task[]
}) {
  const { calendarEvents, memberById } = useLiveData()
  const [selectedDate, setSelectedDate] = useState(() => dayStart(new Date()))
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const today = dayStart(new Date())
  const selectedDateStr = iso(selectedDate)
  const selectedEvents = calendarEvents.filter(e => e.date === selectedDateStr)
  const selectedTasks = tasks.filter(t => t.dueDate === selectedDateStr)
  const getEvents = (date: Date) => {
    const dateStr = iso(date)
    const events = calendarEvents.filter(e => e.date === dateStr)
    const extraTasks = tasks.filter(
      t => t.dueDate === dateStr && !events.some(e => e.title === t.title),
    )
    return { events, extraTasks }
  }

  const start =
    viewMode === 'week'
      ? mondayOf(selectedDate)
      : mondayOf(
          new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
        )
  const cells =
    viewMode === 'week'
      ? 7
      : Math.ceil(
          (((new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            1,
          ).getDay() +
            6) %
            7) +
            new Date(
              selectedDate.getFullYear(),
              selectedDate.getMonth() + 1,
              0,
            ).getDate()) /
            7,
        ) * 7
  const displayedDays = Array.from({ length: cells }, (_, i) =>
    addDays(start, i),
  )
  const end = displayedDays[displayedDays.length - 1]
  const heading =
    viewMode === 'month'
      ? monthTitle(selectedDate)
      : `${start.getDate()} ${MONTHS[start.getMonth()].slice(0, 3)}${start.getFullYear() !== end.getFullYear() ? ` ${start.getFullYear()}` : ''} – ${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`

  const navigatePeriod = (amount: number) => {
    if (viewMode === 'week') {
      setSelectedDate(d => addDays(d, amount * 7))
    } else {
      setSelectedDate(d => {
        const monthStart = new Date(d.getFullYear(), d.getMonth() + amount, 1)
        const last = new Date(
          monthStart.getFullYear(),
          monthStart.getMonth() + 1,
          0,
        ).getDate()
        return new Date(
          monthStart.getFullYear(),
          monthStart.getMonth(),
          Math.min(d.getDate(), last),
        )
      })
    }
  }

  return (
    <PageShell
      testId='calendar-page'
      header={
        <PageHeader
          title='Calendar'
          subtitle='Scheduled tasks and events'
          actions={
            <div className='flex gap-2 flex-wrap'>
              <div
                className='view-toggle'
                style={{ width: 'auto' }}
                role='group'
                aria-label='Calendar view'
              >
                <button
                  className={`view-toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
                  aria-pressed={viewMode === 'month'}
                  onClick={() => setViewMode('month')}
                >
                  Month
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
                  aria-pressed={viewMode === 'week'}
                  onClick={() => setViewMode('week')}
                >
                  Week
                </button>
              </div>
            </div>
          }
        />
      }
    >
      <div className='grid gap-5 calendar-layout'>
        <div className='card overflow-hidden'>
          <div
            className='flex items-center justify-between px-5 py-4 border-b border-line'
            style={{ borderColor: 'var(--line)' }}
          >
            <button
              className='btn btn-ghost btn-icon'
              aria-label={
                viewMode === 'week' ? 'Previous week' : 'Previous month'
              }
              onClick={() => navigatePeriod(-1)}
            >
              <Icon
                name='chevron_right'
                size={16}
                style={{ transform: 'rotate(180deg)' }}
              />
            </button>
            <div
              className='font-bold text-primary text-center'
              style={{ fontSize: 16 }}
            >
              {heading}
            </div>
            <button
              className='btn btn-ghost btn-icon'
              aria-label={viewMode === 'week' ? 'Next week' : 'Next month'}
              onClick={() => navigatePeriod(1)}
            >
              <Icon name='chevron_right' size={16} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              borderBottom: '1px solid var(--line)',
            }}
          >
            {DAYS.map(d => (
              <div
                key={d}
                className='text-faint text-center py-2'
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {d}
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            }}
          >
            {displayedDays.map((date, i) => {
              const dateStr = iso(date)
              const isOutside =
                viewMode === 'month' &&
                date.getMonth() !== selectedDate.getMonth()
              const isToday = dateStr === iso(today)
              const isSelected = dateStr === selectedDateStr
              const { events, extraTasks } = getEvents(date)
              const total = events.length + extraTasks.length
              const previewLimit = viewMode === 'week' ? 1 : 2
              return (
                <button
                  key={dateStr}
                  type='button'
                  aria-label={date.toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  aria-pressed={isSelected}
                  className='p-1.5 border-b border-line text-start calendar-day'
                  style={{
                    borderColor: 'var(--line)',
                    borderRight:
                      (i + 1) % 7 !== 0 ? '1px solid var(--line)' : 'none',
                    height: viewMode === 'week' ? 112 : 106,
                    minWidth: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    justifyContent: 'flex-start',
                    background: isSelected
                      ? 'var(--brand-faint)'
                      : 'var(--surface)',
                    opacity: isOutside ? 0.55 : 1,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-ui)',
                    verticalAlign: 'top',
                  }}
                  onClick={() => setSelectedDate(date)}
                >
                  <div
                    className='flex items-center justify-center'
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: isSelected
                        ? 'var(--selected-bg)'
                        : isToday
                          ? 'var(--brand)'
                          : 'transparent',
                      color: isSelected
                        ? 'var(--selected-text)'
                        : isToday
                          ? 'var(--brand-contrast)'
                          : 'var(--t-primary)',
                      fontSize: 13,
                      fontWeight: isToday || isSelected ? 800 : 500,
                    }}
                  >
                    {date.getDate()}
                  </div>
                  <div className='flex flex-col gap-0.5 mt-1'>
                    {events.slice(0, previewLimit).map(e => (
                      <div
                        key={e.id}
                        className='calendar-event-preview rounded px-1'
                        title={e.title}
                        style={{
                          background: 'var(--surface-2)',
                          borderInlineStart: '2px solid var(--line-strong)',
                          fontSize: 10,
                          fontWeight: 600,
                          color: 'var(--t-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {e.title}
                      </div>
                    ))}
                    {extraTasks
                      .slice(0, Math.max(0, previewLimit - events.length))
                      .map(t => (
                        <div
                          key={t.id}
                          className='calendar-event-preview rounded px-1'
                          title={t.title}
                          style={{
                            background: 'var(--surface-2)',
                            borderInlineStart: '2px solid var(--brand)',
                            fontSize: 10,
                            color: 'var(--t-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {t.title}
                        </div>
                      ))}
                    {total > previewLimit && (
                      <div
                        className='text-faint'
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          lineHeight: '17px',
                        }}
                        aria-label={`${total - previewLimit} more items; select day for details`}
                      >
                        +{total - previewLimit} more
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className='flex flex-col gap-3' style={{ minWidth: 0 }}>
          <div className='card p-4'>
            <div
              className='font-bold text-primary mb-3'
              style={{ fontSize: 15 }}
            >
              {selectedDate.toLocaleDateString(undefined, {
                weekday: 'short',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
            {selectedEvents.length === 0 && selectedTasks.length === 0 ? (
              <EmptyState
                testId='calendar-zero'
                icon={<span aria-hidden='true'>📅</span>}
                title='Nothing scheduled'
              />
            ) : (
              <div className='flex flex-col gap-2'>
                {selectedEvents.map(e => {
                  const assignee = e.assigneeId
                    ? memberById(e.assigneeId)
                    : null
                  return (
                    <div
                      key={e.id}
                      className='flex items-start gap-2 p-2 rounded-lg'
                      style={{
                        background: 'var(--surface-2)',
                        borderInlineStart: '3px solid var(--line-strong)',
                        borderRadius: 'var(--r-sm)',
                      }}
                    >
                      <div className='flex-1 min-w-0'>
                        <div
                          className='font-semibold text-primary'
                          style={{ fontSize: 12 }}
                        >
                          {e.title}
                        </div>
                        {e.time && (
                          <div className='text-faint' style={{ fontSize: 10 }}>
                            {e.time}
                          </div>
                        )}
                      </div>
                      {assignee && (
                        <div
                          className='avatar'
                          style={{
                            width: 18,
                            height: 18,
                            background: assignee.avatarColor,
                            fontSize: 7,
                          }}
                        >
                          {assignee.initials}
                        </div>
                      )}
                    </div>
                  )
                })}
                {selectedTasks
                  .filter(t => !selectedEvents.some(e => e.title === t.title))
                  .map(t => (
                    <button
                      key={t.id}
                      className='flex items-center gap-2 p-2 rounded-lg cursor-pointer w-full text-start'
                      style={{
                        background: 'var(--surface-2)',
                        border: 'none',
                        borderRadius: 'var(--r-sm)',
                        fontFamily: 'var(--font-ui)',
                      }}
                      onClick={() => ctx.openTask(t)}
                    >
                      <span
                        className='task-check'
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          borderColor:
                            t.status === 'done'
                              ? 'var(--sig-done)'
                              : 'var(--line-strong)',
                          background:
                            t.status === 'done'
                              ? 'var(--sig-done-bg)'
                              : 'transparent',
                        }}
                      >
                        {t.status === 'done' && (
                          <Icon
                            name='check'
                            size={9}
                            style={{ color: 'var(--sig-done)' }}
                          />
                        )}
                      </span>
                      <span
                        className='text-primary'
                        style={{
                          fontSize: 12,
                          textDecoration:
                            t.status === 'done' ? 'line-through' : 'none',
                        }}
                      >
                        {t.title}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          <PageSection title='Upcoming events'>
            <div className='card p-4'>
              {calendarEvents
                .filter(e => e.date >= selectedDateStr)
                .slice(0, 5)
                .map(e => (
                  <div
                    key={e.id}
                    className='flex items-center gap-2 py-2 border-b border-line'
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--brand)',
                        flexShrink: 0,
                      }}
                    />
                    <div className='flex-1 min-w-0'>
                      <div
                        className='text-primary truncate'
                        style={{ fontSize: 12 }}
                      >
                        {e.title}
                      </div>
                      <div className='text-faint' style={{ fontSize: 10 }}>
                        {formatDate(e.date)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </PageSection>
        </div>
      </div>
    </PageShell>
  )
}

import { useEffect, useRef, useState } from 'react'

import { Icon } from '../App'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const iso = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
const fromIso = (value: string) => {
  const match = /^(\d{4})-(\d\d)-(\d\d)$/.exec(value)
  if (!match) return new Date()
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  )
  return Number.isNaN(date.getTime()) ? new Date() : date
}

export default function DateField({
  allowClear = false,
  label = 'Due date',
  onChange,
  value,
}: {
  value: string
  onChange: (date: string) => void
  label?: string
  allowClear?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => {
    const date = fromIso(value)
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })
  const root = useRef<HTMLDivElement>(null)
  const selected = value ? fromIso(value) : null
  const firstWeekday = (month.getDay() + 6) % 7
  const monthDays = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate()
  const today = iso(new Date())
  const dates = Array.from({ length: firstWeekday + monthDays }, (_, index) =>
    index < firstWeekday ? null : index - firstWeekday + 1,
  )

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const toggle = () => {
    if (!open) {
      const date = fromIso(value)
      setMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    }
    setOpen(previous => !previous)
  }

  const choose = (day: number) => {
    onChange(iso(new Date(month.getFullYear(), month.getMonth(), day)))
    setOpen(false)
  }

  return (
    <div className='theme-field' ref={root}>
      <button
        type='button'
        className='input themed-trigger'
        aria-label={label}
        aria-expanded={open}
        aria-haspopup='dialog'
        onClick={toggle}
      >
        <span className={value ? 'text-primary' : 'text-muted'}>
          {selected
            ? selected.toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : 'Choose a date'}
        </span>
        <Icon name='calendar' size={16} style={{ color: 'var(--t-muted)' }} />
      </button>
      {open && (
        <div
          role='dialog'
          aria-modal='false'
          aria-label='Choose date'
          className='theme-popover date-popover'
          onKeyDown={event => {
            if (event.key === 'Escape') {
              event.preventDefault()
              setOpen(false)
            }
          }}
        >
          <div className='flex items-center justify-between gap-2 mb-3'>
            <button
              type='button'
              className='btn btn-ghost btn-icon'
              aria-label='Previous month'
              onClick={() =>
                setMonth(
                  previous =>
                    new Date(
                      previous.getFullYear(),
                      previous.getMonth() - 1,
                      1,
                    ),
                )
              }
            >
              <Icon
                name='chevron_right'
                size={15}
                style={{ transform: 'rotate(180deg)' }}
              />
            </button>
            <div
              className='font-semibold text-primary'
              style={{ fontSize: 13 }}
            >
              {month.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </div>
            <button
              type='button'
              className='btn btn-ghost btn-icon'
              aria-label='Next month'
              onClick={() =>
                setMonth(
                  previous =>
                    new Date(
                      previous.getFullYear(),
                      previous.getMonth() + 1,
                      1,
                    ),
                )
              }
            >
              <Icon name='chevron_right' size={15} />
            </button>
          </div>
          <div
            className='date-grid'
            role='grid'
            aria-label={month.toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
            })}
          >
            {WEEKDAYS.map((day, index) => (
              <div key={index} className='date-weekday' aria-hidden='true'>
                {day}
              </div>
            ))}
            {dates.map((day, index) => {
              if (day == null)
                return <span key={'empty-' + index} aria-hidden='true' />
              const date = iso(
                new Date(month.getFullYear(), month.getMonth(), day),
              )
              const isSelected = date === value
              return (
                <button
                  key={date}
                  type='button'
                  className='date-cell'
                  aria-label={new Date(
                    month.getFullYear(),
                    month.getMonth(),
                    day,
                  ).toLocaleDateString(undefined, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  aria-selected={isSelected}
                  role='gridcell'
                  data-today={date === today}
                  onClick={() => choose(day)}
                >
                  {day}
                </button>
              )
            })}
          </div>
          <div className='flex justify-between gap-2 mt-3'>
            <button
              type='button'
              className='btn btn-ghost btn-sm'
              onClick={() => {
                onChange(today)
                setOpen(false)
              }}
            >
              Today
            </button>
            {allowClear && (
              <button
                type='button'
                className='btn btn-ghost btn-sm'
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

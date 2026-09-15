import '../../styles/screenExperience.css'

import { useQueryClient } from '@tanstack/react-query'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import FigmaIcon from '../../components/FigmaIcon'
import { useLocalization } from '../../contexts/LocalizationContext'
import { useCalendar } from '../../queries/CalendarQueries'
import { useCategories } from '../../queries/CategoryQueries'
import { useUserProfile } from '../../queries/UserQueries'
import { MarkChoreComplete } from '../../utils/Fetcher'
import {
  readLocalStorageItem,
  writeLocalStorageItem,
} from '../../utils/storage'
import { STORAGE_KEYS } from '../../utils/storageKeys'
import {
  addDays,
  dateKey,
  filterByCategory,
  filterOccurrences,
  groupOccurrences,
  monthGrid,
  zonedMidnight,
} from './calendarModel'

const preferenceKey = STORAGE_KEYS.calendarView

const labelDate = (key, locale, options = {}) =>
  new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options }).format(
    new Date(`${key}T12:00:00Z`),
  )

const occurrenceColor = item => {
  if (item.overdue) return 'var(--sig-over)'
  if (item.meterSchedule) return 'var(--sig-due)'
  if (item.meterUpdateReminder) return 'var(--accent)'
  return item.category?.color || 'var(--brand)'
}

function CalendarTaskRow({ item, locale, onComplete, pending, timeZone }) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const color = occurrenceColor(item)
  const time = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(item.dueAt))

  return (
    <div
      className='flex items-center gap-2 rounded-lg p-2'
      style={{
        background: `color-mix(in srgb, ${color} 7%, transparent)`,
        borderInlineStart: `3px solid ${color}`,
      }}
    >
      {item.actionable && !item.meterSchedule && !item.meterUpdateReminder ? (
        <button
          aria-label={t('calendar.completeTask', { name: item.name })}
          className='task-check'
          disabled={pending}
          onClick={() => onComplete(item)}
          style={{
            borderColor: color,
            cursor: pending ? 'wait' : 'pointer',
            margin: 0,
          }}
          type='button'
        >
          {pending && <span aria-hidden='true'>...</span>}
        </button>
      ) : (
        <FigmaIcon name='calendar' size={16} style={{ color }} />
      )}
      <button
        className='min-w-0 flex-1 text-start'
        onClick={() => navigate(`/chores/${item.choreId}`)}
        style={{
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          padding: 0,
        }}
        type='button'
      >
        <div
          className='text-primary truncate font-semibold'
          style={{ fontSize: 12 }}
        >
          {item.name}
        </div>
        <div className='text-faint' style={{ fontSize: 10 }}>
          {time}
          {item.projected ? ` · ${t('calendar.projected')}` : ''}
          {item.requireApproval ? ` · ${t('calendar.approvalRequired')}` : ''}
        </div>
      </button>
      {Number(item.points) > 0 && (
        <span className='text-faint font-mono' style={{ fontSize: 10 }}>
          +{item.points}
        </span>
      )}
    </div>
  )
}

CalendarTaskRow.propTypes = {
  item: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
  onComplete: PropTypes.func.isRequired,
  pending: PropTypes.bool,
  timeZone: PropTypes.string.isRequired,
}

export default function CalendarView() {
  const { i18n, t } = useTranslation('common')
  const { firstDayOfWeek, isRTL } = useLocalization()
  const profile = useUserProfile()
  const client = useQueryClient()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [completing, setCompleting] = useState(null)
  const [actionError, setActionError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const locale =
    i18n.resolvedLanguage || document.documentElement.lang || 'en-US'
  const timeZone =
    profile.data?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    'UTC'
  const today = dateKey(new Date(), timeZone)
  const savedView = readLocalStorageItem(preferenceKey)
  const selected = /^\d{4}-\d{2}-\d{2}$/.test(params.get('date') || '')
    ? params.get('date')
    : today
  const range = [7, 14, 30].includes(Number(params.get('range')))
    ? Number(params.get('range'))
    : 7
  const typeFilter = ['all', 'tasks', 'maintenance', 'meter'].includes(
    params.get('type'),
  )
    ? params.get('type')
    : 'all'
  const categoryFilter = params.get('category') || 'all'
  const viewMode =
    (params.get('view') || savedView) === 'month' ? 'month' : 'week'
  const { data: categories = [] } = useCategories()
  const grid = monthGrid(selected, Number(firstDayOfWeek) || 0)
  const fromKey = viewMode === 'month' ? grid[0] : selected
  const toKey =
    viewMode === 'month' ? addDays(grid[41], 1) : addDays(selected, range)
  const calendar = useCalendar({
    from: zonedMidnight(fromKey, timeZone),
    to: zonedMidnight(toKey, timeZone),
    filter: typeFilter,
    category: categoryFilter,
  })
  const setState = updates => {
    const next = new URLSearchParams(params)
    Object.entries(updates).forEach(([key, value]) =>
      next.set(key, String(value)),
    )
    setParams(next)
  }
  const switchView = next => {
    const stored = next === 'month' ? 'month' : 'agenda'
    writeLocalStorageItem(preferenceKey, stored)
    setState({ date: selected, view: stored })
  }
  const moveMonth = amount => {
    const [year, month, day] = selected.split('-').map(Number)
    const target = new Date(Date.UTC(year, month - 1 + amount, 1))
    const max = new Date(
      Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
    ).getUTCDate()
    setState({
      date: `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}-${String(Math.min(day, max)).padStart(2, '0')}`,
    })
  }
  const complete = async item => {
    setCompleting(item.occurrenceId)
    setActionError('')
    try {
      const response = await MarkChoreComplete(item.choreId, {})
      if (!response.ok) throw new Error(t('calendar.completeError'))
      await Promise.all([
        client.invalidateQueries({ queryKey: ['calendar'] }),
        client.invalidateQueries({ queryKey: ['chores'] }),
        client.invalidateQueries({ queryKey: ['choresHistory'] }),
        client.invalidateQueries({ queryKey: ['notifications'] }),
        client.invalidateQueries({ queryKey: ['userProfile'] }),
      ])
    } catch (error) {
      setActionError(error.message || t('calendar.completeError'))
    } finally {
      setCompleting(null)
    }
  }
  const raw = calendar.data?.res?.occurrences || calendar.data?.res || []
  const overdue = filterByCategory(
    filterOccurrences(calendar.data?.res?.overdue || [], typeFilter),
    categoryFilter,
  )
  const visible = filterByCategory(
    filterOccurrences(raw, typeFilter),
    categoryFilter,
  )
  const items = [...overdue, ...visible].filter(
    (item, index, all) =>
      all.findIndex(
        candidate => candidate.occurrenceId === item.occurrenceId,
      ) === index,
  )
  const groups = groupOccurrences(items, timeZone)
  const selectedItems = groups[selected] || []
  const days = Array.from({ length: 7 }, (_, index) =>
    addDays('2026-08-09', ((Number(firstDayOfWeek) || 0) + index) % 7),
  ).map(key => labelDate(key, locale, { weekday: 'short' }))
  const week = Array.from({ length: range }, (_, index) =>
    addDays(selected, index),
  )
  const upcoming = items
    .filter(item => dateKey(item.dueAt, timeZone) >= selected)
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
    .slice(0, 5)
  const hasUncategorized = items.some(item => !item.category)

  const renderRows = list =>
    list.length ? (
      list.map(item => (
        <CalendarTaskRow
          item={item}
          key={item.occurrenceId}
          locale={locale}
          onComplete={complete}
          pending={completing === item.occurrenceId}
          timeZone={timeZone}
        />
      ))
    ) : (
      <div className='py-6 text-center'>
        <FigmaIcon
          name='calendar'
          size={32}
          style={{ color: 'var(--t-faint)', marginBottom: 8 }}
        />
        <div className='text-muted' style={{ fontSize: 13 }}>
          {t('calendar.nothingScheduled')}
        </div>
        <button
          className='btn btn-sm btn-secondary mt-3'
          onClick={() => navigate('/chores/create')}
          type='button'
        >
          <FigmaIcon name='plus' size={12} />
          {t('list.addTask', { ns: 'chores' })}
        </button>
      </div>
    )

  return (
    <div style={{ margin: '0 auto', maxWidth: 960, padding: '0 0 40px' }}>
      <div className='screen-page-header page-header pb-5'>
        <div>
          <h1
            className='text-primary'
            style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
          >
            {t('calendar.title')}
          </h1>
          <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
            {t('calendar.subtitle')}
          </div>
        </div>
        <div className='screen-page-actions'>
          <div className='view-toggle' style={{ width: 'auto' }}>
            <button
              className={`view-toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => switchView('month')}
              type='button'
            >
              {t('calendar.monthView')}
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => switchView('week')}
              type='button'
            >
              {t('calendar.agenda')}
            </button>
          </div>
          <button
            className='btn btn-primary'
            onClick={() => navigate('/chores/create')}
            type='button'
          >
            <FigmaIcon name='plus' size={14} />
            {t('list.addTask', { ns: 'chores' })}
          </button>
        </div>
      </div>

      <div className='px-4 md:px-7'>
        <div className='mb-4 flex flex-wrap items-center gap-2'>
          <button
            className='btn btn-secondary btn-sm'
            onClick={() => setState({ date: today })}
            type='button'
          >
            {t('dates.today')}
          </button>
          <button
            aria-controls='calendar-filter-panel'
            aria-expanded={showFilters}
            className='btn btn-secondary btn-sm'
            onClick={() => setShowFilters(value => !value)}
            type='button'
          >
            <FigmaIcon name='bars' size={14} />
            {t('calendar.systemTypeFilter')}
          </button>
        </div>

        {showFilters && (
          <div className='card mb-4 p-4' id='calendar-filter-panel'>
            <div className='figma-calendar-filters'>
              <label>
                <span className='section-label' style={{ padding: '0 0 6px' }}>
                  {t('calendar.categoryFilter')}
                </span>
                <select
                  className='input'
                  onChange={event => setState({ category: event.target.value })}
                  value={categoryFilter}
                >
                  <option value='all'>{t('calendar.allCategories')}</option>
                  {[...categories]
                    .sort((a, b) =>
                      new Intl.Collator(locale).compare(a.name, b.name),
                    )
                    .map(category => (
                      <option key={category.id} value={String(category.id)}>
                        {category.name}
                      </option>
                    ))}
                  {hasUncategorized && (
                    <option value='uncategorized'>
                      {t('calendar.uncategorized')}
                    </option>
                  )}
                </select>
              </label>
              <label>
                <span className='section-label' style={{ padding: '0 0 6px' }}>
                  {t('calendar.systemTypeFilter')}
                </span>
                <select
                  className='input'
                  onChange={event => setState({ type: event.target.value })}
                  value={typeFilter}
                >
                  <option value='all'>{t('calendar.allTypes')}</option>
                  <option value='tasks'>{t('calendar.tasks')}</option>
                  <option value='maintenance'>
                    {t('calendar.maintenance')}
                  </option>
                  <option value='meter'>{t('calendar.meterUpdates')}</option>
                </select>
              </label>
              {viewMode === 'week' && (
                <label>
                  <span
                    className='section-label'
                    style={{ padding: '0 0 6px' }}
                  >
                    {t('calendar.agendaRange')}
                  </span>
                  <select
                    className='input'
                    onChange={event => setState({ range: event.target.value })}
                    value={range}
                  >
                    <option value='7'>{t('calendar.sevenDays')}</option>
                    <option value='14'>{t('calendar.fourteenDays')}</option>
                    <option value='30'>{t('calendar.thirtyDays')}</option>
                  </select>
                </label>
              )}
            </div>
          </div>
        )}

        {calendar.isLoading ? (
          <div
            aria-label={t('calendar.loading')}
            aria-live='polite'
            className='card p-5'
            role='status'
          >
            <div className='skeleton' style={{ height: 280 }} />
          </div>
        ) : calendar.isError ? (
          <div className='card text-sig-over p-4' role='alert'>
            {t('errors.calendarLoadFailed')}
            <button
              className='btn btn-secondary btn-sm ms-2'
              onClick={() => calendar.refetch()}
              type='button'
            >
              {t('retry')}
            </button>
          </div>
        ) : (
          <div className='figma-calendar-layout'>
            <div className='card overflow-hidden'>
              <div className='border-line flex items-center justify-between border-b px-5 py-4'>
                <button
                  className='btn btn-ghost btn-icon'
                  aria-label={t('calendar.previousMonth')}
                  onClick={() => moveMonth(-1)}
                  type='button'
                >
                  <FigmaIcon
                    name='chevron_right'
                    size={16}
                    style={{ transform: isRTL ? 'none' : 'rotate(180deg)' }}
                  />
                </button>
                <div
                  className='text-primary font-bold'
                  style={{ fontSize: 16 }}
                >
                  {labelDate(`${selected.slice(0, 7)}-01`, locale, {
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
                <button
                  className='btn btn-ghost btn-icon'
                  aria-label={t('calendar.nextMonth')}
                  onClick={() => moveMonth(1)}
                  type='button'
                >
                  <FigmaIcon
                    name='chevron_right'
                    size={16}
                    style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }}
                  />
                </button>
              </div>

              {viewMode === 'month' ? (
                <>
                  <div className='figma-calendar-weekdays'>
                    {days.map(day => (
                      <div
                        className='text-faint py-2 text-center'
                        key={day}
                        style={{ fontSize: 11, fontWeight: 700 }}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  <div
                    className='figma-calendar-days'
                    role='grid'
                    aria-label={t('calendar.monthCalendar')}
                  >
                    {grid.map(key => {
                      const dayItems = groups[key] || []
                      const currentMonth =
                        key.slice(0, 7) === selected.slice(0, 7)
                      const isToday = key === today
                      const selectedDay = key === selected
                      return (
                        <button
                          aria-label={t('calendar.scheduledCount', {
                            date: labelDate(key, locale, {
                              month: 'long',
                              day: 'numeric',
                            }),
                            count: dayItems.length,
                          })}
                          aria-selected={selectedDay}
                          className='figma-calendar-day'
                          key={key}
                          onClick={() => setState({ date: key })}
                          style={{
                            background: selectedDay
                              ? 'var(--brand-faint)'
                              : 'transparent',
                            opacity: currentMonth ? 1 : 0.3,
                          }}
                          type='button'
                        >
                          <span
                            className='figma-calendar-date'
                            style={{
                              background: isToday
                                ? 'var(--brand)'
                                : 'transparent',
                              color: isToday
                                ? 'var(--brand-contrast)'
                                : selectedDay
                                  ? 'var(--brand)'
                                  : 'var(--t-primary)',
                            }}
                          >
                            {Number(key.slice(-2))}
                          </span>
                          <span className='figma-calendar-event-list'>
                            {dayItems.slice(0, 2).map(item => (
                              <span
                                className='figma-calendar-event'
                                key={item.occurrenceId}
                                style={{
                                  borderInlineStartColor: occurrenceColor(item),
                                  color: 'var(--t-primary)',
                                }}
                              >
                                {item.name}
                              </span>
                            ))}
                            {dayItems.length > 2 && (
                              <span
                                className='text-faint'
                                style={{ fontSize: 9 }}
                              >
                                +{dayItems.length - 2}{' '}
                                {t('calendar.moreCount', {
                                  count: dayItems.length - 2,
                                }).replace(/^\+\d+\s*/, '')}
                              </span>
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className='figma-calendar-agenda'>
                  {week.map(key => (
                    <div className='border-line border-b p-4' key={key}>
                      <div className='text-primary mb-2 font-bold'>
                        {labelDate(key, locale, {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      {renderRows(groups[key] || [])}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className='flex flex-col gap-3'>
              {actionError && (
                <div className='card text-sig-over p-3' role='alert'>
                  {actionError}
                </div>
              )}
              <div className='card p-4'>
                <div
                  className='text-primary mb-3 font-bold'
                  style={{ fontSize: 15 }}
                >
                  {labelDate(selected, locale, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                {renderRows(selectedItems)}
              </div>
              <div className='card p-4'>
                <div
                  className='text-primary mb-3 font-bold'
                  style={{ fontSize: 13 }}
                >
                  {t('calendar.upcomingEvents')}
                </div>
                {upcoming.length ? (
                  upcoming.map(item => (
                    <button
                      className='border-line flex w-full items-center gap-2 border-b py-2 text-start'
                      key={item.occurrenceId}
                      onClick={() =>
                        setState({ date: dateKey(item.dueAt, timeZone) })
                      }
                      style={{ background: 'transparent', cursor: 'pointer' }}
                      type='button'
                    >
                      <span
                        style={{
                          background: occurrenceColor(item),
                          borderRadius: '50%',
                          height: 8,
                          width: 8,
                        }}
                      />
                      <span className='min-w-0 flex-1'>
                        <span
                          className='text-primary block truncate'
                          style={{ fontSize: 12 }}
                        >
                          {item.name}
                        </span>
                        <span
                          className='text-faint block'
                          style={{ fontSize: 10 }}
                        >
                          {labelDate(dateKey(item.dueAt, timeZone), locale, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className='text-muted' style={{ fontSize: 13 }}>
                    {t('calendar.nothingScheduled')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

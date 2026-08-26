import {
  CalendarMonthRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
  EventNoteRounded,
  RadioButtonUncheckedRounded,
  ScheduleRounded,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Card,
  Chip,
  IconButton,
  Option,
  Select,
  Skeleton,
  Stack,
  Typography,
} from '@mui/joy'
import { useQueryClient } from '@tanstack/react-query'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import PageHeader from '../../components/common/PageHeader'
import { useLocalization } from '../../contexts/LocalizationContext'
import { useCalendar } from '../../queries/CalendarQueries'
import { useCategories } from '../../queries/CategoryQueries'
import { useUserProfile } from '../../queries/UserQueries'
import {
  inlineErrorAlertSx,
  pageShellSx,
  pageStackSpacing,
} from '../../theme/appLayout'
import { MarkChoreComplete } from '../../utils/Fetcher'
import { STORAGE_KEYS } from '../../utils/storageKeys'
import {
  readMigratedLocalStorageItem,
  writeLocalStorageItem,
} from '../../utils/storageMigration'
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
const supportedViews = ['agenda', 'month']
const labelDate = (key, locale, options = {}) =>
  new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options }).format(
    new Date(`${key}T12:00:00Z`),
  )

const TaskRow = ({ item, locale, onComplete, pending, timeZone }) => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const specialized = Boolean(item.meterUpdateReminder || item.meterSchedule)
  const time = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(item.dueAt))
  return (
    <Stack
      direction='row'
      alignItems='center'
      gap={1}
      sx={{ py: 1, minWidth: 0 }}
    >
      {item.actionable && !specialized ? (
        <IconButton
          aria-label={t('calendar.completeTask', { name: item.name })}
          loading={pending}
          onClick={() => onComplete(item)}
          color={item.overdue ? 'danger' : 'primary'}
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          <RadioButtonUncheckedRounded />
        </IconButton>
      ) : (
        <Box sx={{ width: 44, textAlign: 'center' }}>
          <ScheduleRounded color='disabled' />
        </Box>
      )}
      <Button
        variant='plain'
        color='neutral'
        onClick={() => navigate(`/chores/${item.choreId}`)}
        sx={{
          flex: 1,
          minWidth: 0,
          p: 0.5,
          justifyContent: 'flex-start',
          textAlign: 'start',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography level='title-sm' sx={{ overflowWrap: 'anywhere' }}>
            {item.name}
          </Typography>
          <Stack direction='row' gap={0.75} flexWrap='wrap' alignItems='center'>
            <Typography level='body-xs' className='daydan-metric'>
              {time}
            </Typography>
            {item.projected && (
              <Chip size='sm' variant='outlined'>
                {t('calendar.projected')}
              </Chip>
            )}
            {item.category && (
              <Chip size='sm' variant='outlined' color='neutral'>
                {item.category.name}
              </Chip>
            )}
            {item.meterUpdateReminder && (
              <Chip size='sm' color='info'>
                {t('calendar.meterUpdate')}
              </Chip>
            )}
            {item.meterSchedule && (
              <Chip size='sm' color='warning'>
                {t('calendar.maintenance')}
              </Chip>
            )}
            {item.requireApproval && (
              <Chip size='sm'>{t('calendar.approvalRequired')}</Chip>
            )}
          </Stack>
        </Box>
      </Button>
      {Number(item.points) > 0 && (
        <Typography level='body-xs' className='daydan-metric'>
          +{item.points}
        </Typography>
      )}
    </Stack>
  )
}
TaskRow.propTypes = {
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
  const navigate = useNavigate()
  const client = useQueryClient()
  const [params, setParams] = useSearchParams()
  const locale =
    i18n.resolvedLanguage || document.documentElement.lang || 'en-US'
  const timeZone =
    profile.data?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    'UTC'
  const today = dateKey(new Date(), timeZone)
  const requestedView = params.get('view')
  const savedView = readMigratedLocalStorageItem(preferenceKey)
  const view = supportedViews.includes(requestedView)
    ? requestedView
    : supportedViews.includes(savedView)
      ? savedView
      : 'agenda'
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
  const { data: categories = [] } = useCategories()
  const grid = monthGrid(selected, Number(firstDayOfWeek) || 0)
  const fromKey = view === 'month' ? grid[0] : selected
  const toKey =
    view === 'month' ? addDays(grid[41], 1) : addDays(selected, range)
  const from = zonedMidnight(fromKey, timeZone)
  const to = zonedMidnight(toKey, timeZone)
  const calendar = useCalendar({
    from,
    to,
    filter: typeFilter,
    category: categoryFilter,
  })
  const [completing, setCompleting] = useState(null)
  const [actionError, setActionError] = useState('')
  const setState = updates => {
    const next = new URLSearchParams(params)
    Object.entries(updates).forEach(([key, value]) =>
      next.set(key, String(value)),
    )
    setParams(next)
  }
  const switchView = next => {
    writeLocalStorageItem(preferenceKey, next)
    setState({ view: next, date: selected })
  }
  const moveMonth = amount => {
    const [year, month, day] = selected.split('-').map(Number)
    const target = new Date(Date.UTC(year, month - 1 + amount, 1))
    const max = new Date(
      Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
    ).getUTCDate()
    const targetYear = target.getUTCFullYear()
    const targetMonth = String(target.getUTCMonth() + 1).padStart(2, '0')
    const targetDay = String(Math.min(day, max)).padStart(2, '0')
    setState({ date: `${targetYear}-${targetMonth}-${targetDay}` })
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
      setActionError(error.message)
    } finally {
      setCompleting(null)
    }
  }
  const raw = calendar.data?.res?.occurrences || []
  const overdue = filterByCategory(
    filterOccurrences(calendar.data?.res?.overdue || [], typeFilter),
    categoryFilter,
  )
  const visible = filterByCategory(
    filterOccurrences(raw, typeFilter),
    categoryFilter,
  )
  const hasUncategorized = [
    ...raw,
    ...(calendar.data?.res?.overdue || []),
  ].some(item => !item.category)
  const groups = groupOccurrences(visible, timeZone)
  const selectedItems = groups[selected] || []
  const weekdays = Array.from({ length: 7 }, (_, index) => {
    const key = addDays(
      '2026-08-09',
      ((Number(firstDayOfWeek) || 0) + index) % 7,
    )
    return labelDate(key, locale, { weekday: 'short' })
  })
  const renderRows = items =>
    items.length ? (
      items.map(item => (
        <TaskRow
          key={item.occurrenceId}
          item={item}
          locale={locale}
          timeZone={timeZone}
          onComplete={complete}
          pending={completing === item.occurrenceId}
        />
      ))
    ) : (
      <Typography color='neutral'>{t('calendar.nothingScheduled')}</Typography>
    )

  return (
    <Box sx={pageShellSx}>
      <Stack spacing={pageStackSpacing}>
        <PageHeader
          title={t('calendar.title')}
          subtitle={t('calendar.subtitle')}
          action={
            <ButtonGroup aria-label={t('calendar.view')}>
              <Button
                variant={view === 'agenda' ? 'solid' : 'outlined'}
                onClick={() => switchView('agenda')}
                startDecorator={<EventNoteRounded />}
              >
                {t('calendar.agenda')}
              </Button>
              <Button
                variant={view === 'month' ? 'solid' : 'outlined'}
                onClick={() => switchView('month')}
                startDecorator={<CalendarMonthRounded />}
              >
                {t('calendar.monthView')}
              </Button>
            </ButtonGroup>
          }
        />
        <Stack direction='row' gap={1} flexWrap='wrap' alignItems='center'>
          <Button onClick={() => setState({ date: today })}>
            {t('dates.today')}
          </Button>
          {view === 'month' && (
            <>
              <IconButton
                aria-label={t('calendar.previousMonth')}
                onClick={() => moveMonth(-1)}
              >
                {isRTL ? <ChevronRightRounded /> : <ChevronLeftRounded />}
              </IconButton>
              <IconButton
                aria-label={t('calendar.nextMonth')}
                onClick={() => moveMonth(1)}
              >
                {isRTL ? <ChevronLeftRounded /> : <ChevronRightRounded />}
              </IconButton>
            </>
          )}
          {view === 'agenda' && (
            <Select
              aria-label={t('calendar.agendaRange')}
              value={range}
              onChange={(_, value) => setState({ range: value })}
            >
              <Option value={7}>{t('calendar.sevenDays')}</Option>
              <Option value={14}>{t('calendar.fourteenDays')}</Option>
              <Option value={30}>{t('calendar.thirtyDays')}</Option>
            </Select>
          )}
          <Select
            aria-label={t('calendar.categoryFilter')}
            value={categoryFilter}
            onChange={(_, value) => setState({ category: value })}
          >
            <Option value='all'>{t('calendar.allCategories')}</Option>
            {[...categories]
              .sort((a, b) => new Intl.Collator(locale).compare(a.name, b.name))
              .map(category => (
                <Option key={category.id} value={String(category.id)}>
                  {category.name}
                </Option>
              ))}
            {hasUncategorized && (
              <Option value='uncategorized'>
                {t('calendar.uncategorized')}
              </Option>
            )}
          </Select>
          <Select
            aria-label={t('calendar.systemTypeFilter')}
            value={typeFilter}
            onChange={(_, value) => setState({ type: value })}
            size='sm'
            variant='plain'
          >
            <Option value='all'>{t('calendar.allTypes')}</Option>
            <Option value='tasks'>{t('calendar.tasks')}</Option>
            <Option value='maintenance'>{t('calendar.maintenance')}</Option>
            <Option value='meter'>{t('calendar.meterUpdates')}</Option>
          </Select>
        </Stack>
        {calendar.isLoading && (
          <Stack aria-label={t('calendar.loading')}>
            <Skeleton variant='rectangular' height={180} />
            <Skeleton variant='rectangular' height={120} />
          </Stack>
        )}
        {calendar.isError && (
          <Alert
            color='danger'
            variant='soft'
            sx={inlineErrorAlertSx}
            endDecorator={
              <Button size='sm' onClick={() => calendar.refetch()}>
                {t('retry')}
              </Button>
            }
          >
            {t('errors.calendarLoadFailed')}
          </Alert>
        )}
        {actionError && (
          <Alert color='danger' variant='soft' sx={inlineErrorAlertSx}>
            {actionError}
          </Alert>
        )}
        {!calendar.isLoading && !calendar.isError && view === 'agenda' && (
          <>
            {overdue.length > 0 && (
              <Card variant='outlined' color='danger'>
                <Typography level='h2' color='danger'>
                  {t('calendar.overdue')}
                </Typography>
                {renderRows(overdue)}
              </Card>
            )}
            {Array.from({ length: range }, (_, index) =>
              addDays(selected, index),
            ).map(key => (
              <Card variant='outlined' key={key}>
                <Typography level='h2'>
                  {key === today
                    ? t('dates.today')
                    : key === addDays(today, 1)
                      ? t('dates.tomorrow')
                      : labelDate(key, locale, { weekday: 'long' })}
                </Typography>
                <Typography level='body-sm' color='neutral'>
                  {labelDate(key, locale, { month: 'long', day: 'numeric' })}
                </Typography>
                {renderRows(groups[key] || [])}
              </Card>
            ))}
          </>
        )}
        {!calendar.isLoading && !calendar.isError && view === 'month' && (
          <>
            <Card variant='outlined'>
              <Typography level='h2' sx={{ mb: 1 }}>
                {labelDate(`${selected.slice(0, 7)}-01`, locale, {
                  month: 'long',
                  year: 'numeric',
                })}
              </Typography>
              <Box
                role='grid'
                aria-label={t('calendar.monthCalendar')}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                }}
              >
                {weekdays.map((day, index) => (
                  <Typography
                    key={`${day}-${index}`}
                    role='columnheader'
                    level='body-xs'
                    textAlign='center'
                    sx={{ py: 1 }}
                  >
                    {day}
                  </Typography>
                ))}
                {grid.map(key => {
                  const items = groups[key] || []
                  const currentMonth = key.slice(0, 7) === selected.slice(0, 7)
                  const accessibleDate = labelDate(key, locale, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
                  return (
                    <Button
                      key={key}
                      role='gridcell'
                      aria-label={t('calendar.scheduledCount', {
                        date: accessibleDate,
                        count: items.length,
                      })}
                      aria-selected={key === selected}
                      variant={key === selected ? 'soft' : 'plain'}
                      color='neutral'
                      onClick={() => setState({ date: key })}
                      sx={{
                        minWidth: 0,
                        minHeight: { xs: 52, md: 92 },
                        p: 0.5,
                        opacity: currentMonth ? 1 : 0.55,
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                      }}
                    >
                      <Stack sx={{ width: '100%', minWidth: 0 }}>
                        <Typography className='daydan-metric'>
                          {Number(key.slice(-2))}
                        </Typography>
                        {items.length > 0 && (
                          <Chip size='sm' color='primary'>
                            {items.length}
                          </Chip>
                        )}
                        <Box
                          sx={{
                            display: { xs: 'none', md: 'block' },
                            overflow: 'hidden',
                          }}
                        >
                          {items.slice(0, 2).map(item => (
                            <Typography
                              key={item.occurrenceId}
                              level='body-xs'
                              noWrap
                            >
                              {item.name}
                            </Typography>
                          ))}
                          {items.length > 2 && (
                            <Typography level='body-xs'>
                              {t('calendar.moreCount', {
                                count: items.length - 2,
                              })}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Button>
                  )
                })}
              </Box>
            </Card>
            <Card variant='outlined'>
              <Typography level='h2'>
                {labelDate(selected, locale, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Typography>
              {renderRows(selectedItems)}
            </Card>
          </>
        )}
      </Stack>
    </Box>
  )
}

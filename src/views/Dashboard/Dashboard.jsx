import {
  AccessTimeRounded,
  ArrowForwardRounded,
  CardGiftcardRounded,
  CheckCircleRounded,
  ErrorOutlineRounded,
  RadioButtonUncheckedRounded,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Container,
  IconButton,
  LinearProgress,
  Option,
  Select,
  Skeleton,
  Stack,
  Typography,
} from '@mui/joy'
import { useQueryClient } from '@tanstack/react-query'
import PropTypes from 'prop-types'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import SectionCard from '../../components/common/SectionCard'
import { useChoresHistory, usePersonalChores } from '../../queries/ChoreQueries'
import { useMyRewardRequests, useRewards } from '../../queries/RewardQueries'
import { useUserProfile } from '../../queries/UserQueries'
import { pageStackSpacing, settingsPageSx } from '../../theme/appLayout'
import { MarkChoreComplete } from '../../utils/Fetcher'
import { STORAGE_KEYS } from '../../utils/storageKeys'
import {
  readMigratedLocalStorageItem,
  writeLocalStorageItem,
} from '../../utils/storageMigration'
import {
  dashboardBuckets,
  groupUpcoming,
  maintenanceLabel,
} from './dashboardModel'

const preferenceKey = STORAGE_KEYS.dashboardUpcomingRange
const readRange = () => {
  const value = Number(readMigratedLocalStorageItem(preferenceKey))
  return [7, 14, 30].includes(value) ? value : 7
}

const Section = ({ action, children, title }) => (
  <SectionCard title={title} titleLevel='h2' action={action}>
    {children}
  </SectionCard>
)
Section.propTypes = {
  action: PropTypes.node,
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
}

const TaskRow = ({ chore, locale, onComplete, overdue, pending, timeZone }) => {
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const specialized = Boolean(chore.meterUpdateReminder)
  const scheduleState = maintenanceLabel(chore.meterSchedule)
  const due = chore.nextDueDate
    ? new Intl.DateTimeFormat(locale, {
        timeZone,
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(chore.nextDueDate))
    : null
  return (
    <Stack
      direction='row'
      gap={1.25}
      alignItems='center'
      sx={{ py: 1.25, minWidth: 0 }}
    >
      <IconButton
        variant='plain'
        color={overdue ? 'danger' : 'primary'}
        loading={pending}
        onClick={() =>
          specialized ? navigate(`/chores/${chore.id}`) : onComplete(chore)
        }
        aria-label={
          specialized
            ? t('dashboard.openTask', { name: chore.name })
            : t('dashboard.completeTask', { name: chore.name })
        }
        sx={{ minWidth: 44, minHeight: 44 }}
      >
        <RadioButtonUncheckedRounded />
      </IconButton>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Button
          variant='plain'
          color='neutral'
          onClick={() => navigate(`/chores/${chore.id}`)}
          sx={{ p: 0, textAlign: 'start', justifyContent: 'flex-start' }}
        >
          <Typography level='title-md' sx={{ overflowWrap: 'anywhere' }}>
            {chore.name}
          </Typography>
        </Button>
        <Stack direction='row' gap={1} flexWrap='wrap' alignItems='center'>
          {chore.category && (
            <Chip size='sm' variant='outlined' color='neutral'>
              {chore.category.name}
            </Chip>
          )}
          {overdue && (
            <Typography level='body-sm' color='danger'>
              {t('dashboard.overdue')}
            </Typography>
          )}
          {due && (
            <Typography level='body-sm' color='neutral'>
              <AccessTimeRounded
                sx={{ fontSize: 15, verticalAlign: 'text-bottom' }}
              />{' '}
              {due}
            </Typography>
          )}
          {scheduleState && (
            <Typography
              level='body-sm'
              color={chore.meterSchedule?.dueReason ? 'warning' : 'neutral'}
            >
              {scheduleState}
            </Typography>
          )}
          {chore.requireApproval && (
            <Chip size='sm'>{t('dashboard.approvalRequired')}</Chip>
          )}
          {specialized && (
            <Chip size='sm' color='info'>
              {t('dashboard.meterReadingRequired')}
            </Chip>
          )}
        </Stack>
      </Box>
      {Number(chore.points) > 0 && (
        <Typography level='body-sm' className='daydan-metric'>
          {t('dashboard.ptsPlus', { count: chore.points })}
        </Typography>
      )}
    </Stack>
  )
}
TaskRow.propTypes = {
  chore: PropTypes.shape({
    id: PropTypes.number.isRequired,
    meterSchedule: PropTypes.object,
    meterUpdateReminder: PropTypes.object,
    name: PropTypes.string.isRequired,
    nextDueDate: PropTypes.string,
    points: PropTypes.number,
    requireApproval: PropTypes.bool,
  }).isRequired,
  locale: PropTypes.string.isRequired,
  onComplete: PropTypes.func.isRequired,
  overdue: PropTypes.bool,
  pending: PropTypes.bool,
  timeZone: PropTypes.string.isRequired,
}
TaskRow.defaultProps = { overdue: false, pending: false }

export default function Dashboard() {
  const { i18n, t } = useTranslation('common')
  const navigate = useNavigate()
  const client = useQueryClient()
  const profile = useUserProfile()
  const chores = usePersonalChores()
  const history = useChoresHistory(7, false)
  const rewards = useRewards(false)
  const requests = useMyRewardRequests()
  const [range, setRange] = useState(readRange)
  const [completing, setCompleting] = useState(null)
  const [completionError, setCompletionError] = useState('')
  const timeZone =
    profile.data?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  const locale = i18n.resolvedLanguage || document.documentElement.lang || 'en'
  const buckets = useMemo(
    () => dashboardBuckets(chores.data?.res, { range, timeZone }),
    [chores.data?.res, range, timeZone],
  )
  const upcomingGroups = useMemo(
    () => groupUpcoming(buckets.upcoming, timeZone, locale),
    [buckets.upcoming, timeZone, locale],
  )
  const completedToday = useMemo(
    () =>
      dashboardBuckets(
        (history.data || [])
          .filter(entry => entry.status === 1)
          .map(entry => ({
            id: entry.id,
            nextDueDate: entry.performedAt,
          })),
        { range: 7, timeZone },
      ).today.length,
    [history.data, timeZone],
  )
  const totalToday = completedToday + buckets.today.length
  const attention = [
    ...buckets.overdue,
    ...buckets.today.filter(
      chore =>
        chore.meterSchedule?.dueReason ||
        chore.meterSchedule?.approachingByMeter,
    ),
  ]
  const balance = requests.data?.balance
  const pendingRequests = (requests.data?.res || []).filter(
    item => item.status === 'pending',
  )
  const affordable = (rewards.data?.res || [])
    .filter(
      item =>
        item.isActive && item.costPoints <= (balance?.spendableBalance || 0),
    )
    .sort((a, b) => b.costPoints - a.costPoints || a.name.localeCompare(b.name))
    .slice(0, 3)

  const complete = async chore => {
    setCompleting(chore.id)
    setCompletionError('')
    try {
      const response = await MarkChoreComplete(chore.id, {})
      if (!response.ok) throw new Error(t('dashboard.taskCouldNotBeCompleted'))
      await Promise.all([
        client.invalidateQueries({ queryKey: ['chores'] }),
        client.invalidateQueries({ queryKey: ['choresHistory'] }),
        client.invalidateQueries({ queryKey: ['rewardRequests'] }),
        client.invalidateQueries({ queryKey: ['userProfile'] }),
      ])
    } catch (error) {
      setCompletionError(error.message)
    } finally {
      setCompleting(null)
    }
  }
  const row = (chore, overdue = false) => (
    <TaskRow
      key={chore.id}
      chore={chore}
      overdue={overdue}
      onComplete={complete}
      pending={completing === chore.id}
      timeZone={timeZone}
      locale={locale}
    />
  )

  return (
    <Container maxWidth='lg' sx={{ ...settingsPageSx, pb: 10 }}>
      <Stack spacing={pageStackSpacing}>
        <Box>
          <Typography level='h1'>
            {profile.data?.displayName
              ? t('dashboard.hello', { name: profile.data.displayName })
              : t('dashboard.home')}
          </Typography>
          <Typography color='neutral'>
            {new Intl.DateTimeFormat(locale, {
              timeZone,
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            }).format(new Date())}
          </Typography>
          {!chores.isLoading && !chores.isError && (
            <Typography level='title-md' sx={{ mt: 1 }}>
              {t('dashboard.tasksToday', {
                count: buckets.today.length,
              })}
              {attention.length
                ? ` · ${t('dashboard.needAttention', {
                    count: attention.length,
                  })}`
                : ''}
            </Typography>
          )}
        </Box>

        {chores.isLoading && (
          <Stack aria-label={t('dashboard.loadingHome')}>
            <Skeleton variant='rectangular' height={150} />
            <Skeleton variant='rectangular' height={220} />
          </Stack>
        )}
        {chores.isError && (
          <Alert
            color='danger'
            startDecorator={<ErrorOutlineRounded />}
            endDecorator={
              <Button size='sm' onClick={() => chores.refetch()}>
                {t('retry')}
              </Button>
            }
          >
            {t('errors.tasksLoadFailed')}
          </Alert>
        )}
        {completionError && <Alert color='danger'>{completionError}</Alert>}

        {!chores.isLoading && !chores.isError && attention.length > 0 && (
          <Section title={t('dashboard.needsAttention')}>
            <Stack
              divider={
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />
              }
            >
              {buckets.overdue.map(chore => row(chore, true))}
              {attention
                .filter(chore => !buckets.overdue.includes(chore))
                .map(chore => row(chore))}
            </Stack>
          </Section>
        )}

        {!chores.isLoading && !chores.isError && (
          <Section
            title={t('dates.today')}
            action={
              <Typography level='body-sm'>
                {t('dashboard.remaining', { count: buckets.today.length })}
              </Typography>
            }
          >
            {buckets.today.length ? (
              <Stack
                divider={
                  <Box
                    sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                  />
                }
              >
                {buckets.today.map(chore => row(chore))}
              </Stack>
            ) : (
              <Stack
                direction='row'
                gap={1.5}
                alignItems='center'
                sx={{ py: 2 }}
              >
                <CheckCircleRounded color='success' />
                <Box>
                  <Typography level='title-md'>
                    {completedToday
                      ? t('dashboard.allDoneForToday')
                      : t('dashboard.youreClearForToday')}
                  </Typography>
                  {completedToday > 0 && (
                    <Typography color='neutral'>
                      {t('dashboard.completed', { count: completedToday })}
                    </Typography>
                  )}
                </Box>
              </Stack>
            )}
          </Section>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'minmax(0, 2fr) minmax(260px, 1fr)',
            },
            gap: 2.5,
          }}
        >
          <Section
            title={t('dashboard.upcoming')}
            action={
              <Select
                size='sm'
                value={range}
                aria-label={t('dashboard.upcomingRange')}
                onChange={(_, value) => {
                  setRange(value)
                  writeLocalStorageItem(preferenceKey, String(value))
                }}
              >
                {[7, 14, 30].map(days => (
                  <Option value={days} key={days}>
                    {t('dashboard.nextDays', { count: days })}
                  </Option>
                ))}
              </Select>
            }
          >
            {upcomingGroups.length ? (
              upcomingGroups.map(group => (
                <Box key={group.key} sx={{ mt: 2 }}>
                  <Typography level='title-sm' color='neutral'>
                    {group.label}
                  </Typography>
                  {group.chores.map(chore => row(chore))}
                </Box>
              ))
            ) : (
              <Typography color='neutral' sx={{ py: 2 }}>
                {t('dashboard.nothingScheduled')}
              </Typography>
            )}
          </Section>
          <Section title={t('dashboard.progress')}>
            <Stack spacing={1.5} sx={{ py: 2 }}>
              <Typography level='h2' className='daydan-metric'>
                {t('dashboard.progressOf', {
                  completed: completedToday,
                  total: totalToday,
                })}
              </Typography>
              <Typography color='neutral'>
                {t('dashboard.tasksCompletedToday')}
              </Typography>
              <LinearProgress
                determinate
                value={totalToday ? (completedToday / totalToday) * 100 : 100}
                aria-label={t('dashboard.tasksCompletedTodayAria', {
                  completed: completedToday,
                  total: totalToday,
                })}
              />
              {!history.isLoading && (
                <Typography level='body-sm'>
                  {t('dashboard.completedThisWeek', {
                    count: (history.data || []).filter(
                      item => item.status === 1,
                    ).length,
                  })}
                </Typography>
              )}
            </Stack>
          </Section>
        </Box>

        <Section
          title={t('navigation.rewards')}
          action={
            <Button
              component={Link}
              to='/rewards'
              variant='plain'
              endDecorator={<ArrowForwardRounded />}
            >
              {t('dashboard.viewRewards')}
            </Button>
          }
        >
          {(rewards.isLoading || requests.isLoading) && (
            <Skeleton variant='rectangular' height={90} />
          )}
          {(rewards.isError || requests.isError) && (
            <Alert
              color='warning'
              endDecorator={
                <Button
                  size='sm'
                  onClick={() => {
                    rewards.refetch()
                    requests.refetch()
                  }}
                >
                  {t('retry')}
                </Button>
              }
            >
              {t('errors.rewardsUnavailable')}
            </Alert>
          )}
          {!rewards.isLoading &&
            !requests.isLoading &&
            !rewards.isError &&
            !requests.isError && (
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                  <Box>
                    <Typography level='body-sm'>
                      {t('dashboard.spendable')}
                    </Typography>
                    <Typography level='h2' className='daydan-metric'>
                      {t('dashboard.ptsValue', {
                        count: balance?.spendableBalance || 0,
                      })}
                    </Typography>
                  </Box>
                  {(balance?.pendingReserved || 0) > 0 && (
                    <Box>
                      <Typography level='body-sm'>
                        {t('dashboard.pendingReserved')}
                      </Typography>
                      <Typography level='title-lg' className='daydan-metric'>
                        {t('dashboard.ptsValue', {
                          count: balance.pendingReserved,
                        })}
                      </Typography>
                    </Box>
                  )}
                </Stack>
                {pendingRequests.slice(0, 2).map(request => (
                  <Alert
                    key={request.id}
                    color='warning'
                    startDecorator={<CardGiftcardRounded />}
                  >
                    {t('dashboard.pendingRequest', {
                      name: request.rewardName,
                      count: request.costPoints,
                    })}
                  </Alert>
                ))}
                {affordable.length > 0 && (
                  <Box>
                    <Typography level='title-md' sx={{ mb: 1 }}>
                      {t('dashboard.youCanRedeem')}
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
                      {affordable.map(reward => (
                        <Chip key={reward.id} color='success' variant='soft'>
                          {t('dashboard.rewardChip', {
                            name: reward.name,
                            count: reward.costPoints,
                          })}
                        </Chip>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            )}
        </Section>
      </Stack>
    </Container>
  )
}

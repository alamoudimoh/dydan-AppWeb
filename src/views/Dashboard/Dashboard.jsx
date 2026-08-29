import { Alert, Box, Chip, Skeleton, Stack, Typography } from '@mui/joy'
import PropTypes from 'prop-types'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import FocusHome from '../Home/focus/FocusHome'
import QuestHome from '../Home/quest/QuestHome'
import { useHomeData } from '../Home/useHomeData'
import {
  dashboardBuckets,
  groupUpcoming,
  maintenanceLabel,
} from './dashboardModel'

/**
 * Overview strip shown under the focus home: the classic scheduled-task
 * buckets (next 7 days) derived from the full chore list.
 */
const Overview = ({ chores, locale, now, timeZone }) => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const buckets = useMemo(
    () =>
      dashboardBuckets(chores, {
        now,
        range: 7,
        timeZone,
      }),
    [chores, now, timeZone],
  )
  const upcomingGroups = useMemo(
    () => groupUpcoming(buckets.upcoming, timeZone, locale),
    [buckets.upcoming, timeZone, locale],
  )
  const row = chore => {
    const schedule = maintenanceLabel(chore.meterSchedule, { locale, t })
    return (
      <Stack
        key={chore.id}
        direction='row'
        gap={1.25}
        alignItems='center'
        sx={{ py: 1.25, minWidth: 0 }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            level='title-sm'
            component='button'
            onClick={() => navigate(`/chores/${chore.id}`)}
            sx={{
              background: 'none',
              border: 'none',
              p: 0,
              textAlign: 'start',
              cursor: 'pointer',
              color: 'inherit',
              fontFamily: 'inherit',
            }}
          >
            {chore.name}
          </Typography>
          <Stack direction='row' gap={1} flexWrap='wrap' alignItems='center'>
            {chore.category && (
              <Chip size='sm' variant='outlined' color='neutral'>
                {chore.category.name}
              </Chip>
            )}
            {schedule && (
              <Typography level='body-sm' color='warning'>
                {schedule}
              </Typography>
            )}
          </Stack>
        </Box>
        {Number(chore.points) > 0 && (
          <Typography level='body-sm' className='daydan-metric'>
            +{chore.points}
          </Typography>
        )}
      </Stack>
    )
  }
  return (
    <Box sx={{ pt: 4, px: { xs: 2, md: 3.5 } }}>
      <Stack spacing={1.5}>
        <Stack direction='row' gap={2} flexWrap='wrap'>
          <Chip size='lg' color='neutral'>
            {t('homeToday.overdue')}: {buckets.overdue.length}
          </Chip>
          <Chip size='lg' color='primary'>
            {t('homeToday.today')}: {buckets.today.length}
          </Chip>
          <Chip size='lg' color='success'>
            {t('homeToday.upcoming')}: {buckets.upcoming.length}
          </Chip>
        </Stack>
        {upcomingGroups.length > 0 && (
          <Box>
            <Typography level='title-sm' color='neutral' sx={{ mb: 0.5 }}>
              {t('homeToday.upcomingDays', { count: 7 })}
            </Typography>
            {upcomingGroups.map(group => (
              <Box key={group.key} sx={{ mt: 1.5 }}>
                <Typography level='body-sm' color='neutral'>
                  {group.label}
                </Typography>
                {group.chores.map(row)}
              </Box>
            ))}
          </Box>
        )}
      </Stack>
    </Box>
  )
}

Overview.propTypes = {
  chores: PropTypes.array.isRequired,
  locale: PropTypes.string.isRequired,
  now: PropTypes.instanceOf(Date).isRequired,
  timeZone: PropTypes.string.isRequired,
}

export default function Dashboard() {
  const { i18n, t } = useTranslation('common')
  const home = useHomeData()
  const locale = i18n.resolvedLanguage || document.documentElement.lang || 'en'

  if (home.loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3.5 } }}>
        <Stack aria-label={t('homeToday.loadingHome')}>
          <Skeleton variant='rectangular' height={160} />
          <Skeleton variant='rectangular' height={220} sx={{ mt: 2 }} />
        </Stack>
      </Box>
    )
  }

  if (home.error && home.tasks.length === 0) {
    return (
      <Box sx={{ p: { xs: 2, md: 3.5 } }}>
        <Alert onClose={() => home.refetch()}>
          {t('homeToday.loadHomeFailed')}
        </Alert>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        maxWidth: 1080,
        mx: 'auto',
        px: { xs: 0, md: 2 },
      }}
    >
      {home.view === 'quest' ? (
        <QuestHome {...home} />
      ) : (
        <FocusHome {...home} />
      )}
      {home.view !== 'quest' && (
        <Overview
          chores={home.chores}
          locale={locale}
          now={home.now}
          timeZone={home.timeZone}
        />
      )}
    </Box>
  )
}

export { dashboardBuckets, groupUpcoming, maintenanceLabel }

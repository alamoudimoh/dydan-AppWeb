import { Alert, Box, Skeleton, Stack } from '@mui/joy'
import { useTranslation } from 'react-i18next'

import { useHomeData } from '../useHomeData'
import TodayScreen from './TodayScreen'

export default function TodayView() {
  const { t } = useTranslation('common')
  const home = useHomeData()

  if (home.loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3.5 } }}>
        <Stack aria-label={t('homeToday.loadingToday')}>
          <Skeleton variant='rectangular' height={140} />
          <Skeleton variant='rectangular' height={200} sx={{ mt: 2 }} />
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
      <TodayScreen {...home} />
    </Box>
  )
}

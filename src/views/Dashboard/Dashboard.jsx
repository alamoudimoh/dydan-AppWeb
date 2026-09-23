import { Alert, Box, Skeleton, Stack } from '@mui/joy'
import { useTranslation } from 'react-i18next'

import FocusHome from '../Home/focus/FocusHome'
import QuestHome from '../Home/quest/QuestHome'
import { useHomeData } from '../Home/useHomeData'

export default function Dashboard() {
  const { t } = useTranslation('common')
  const home = useHomeData()

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
      }}
    >
      {home.view === 'quest' ? (
        <QuestHome {...home} />
      ) : (
        <FocusHome {...home} />
      )}
    </Box>
  )
}

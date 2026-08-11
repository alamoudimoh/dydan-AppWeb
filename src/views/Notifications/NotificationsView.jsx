import {
  Build,
  CardGiftcard,
  CheckCircle,
  NotificationsNone,
  Schedule,
  Speed,
  Warning,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Sheet,
  Stack,
  Typography,
} from '@mui/joy'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useLocalization } from '../../contexts/LocalizationContext'
import {
  useNotificationActions,
  useNotifications,
} from '../../queries/NotificationQueries'
import {
  formatNotificationTime,
  notificationColor,
  notificationDestination,
} from './notificationModel'

const icon = n =>
  n.type.startsWith('maintenance') ? (
    <Build />
  ) : n.type.startsWith('meter') ? (
    <Speed />
  ) : n.type.startsWith('reward') ? (
    <CardGiftcard />
  ) : n.severity === 'success' ? (
    <CheckCircle />
  ) : n.severity === 'danger' ? (
    <Warning />
  ) : (
    <Schedule />
  )

export default function NotificationsView() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { language } = useLocalization()
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
  } = useNotifications()
  const { read, readAll } = useNotificationActions()
  const items = data?.pages?.flatMap(page => page.res || []) || []
  const unreadCount = data?.pages?.[0]?.unreadCount || 0
  const open = n => {
    if (!n.readAt) read.mutate(n.id)
    const to = notificationDestination(n)
    if (to) navigate(to)
  }
  return (
    <Sheet
      sx={{
        minHeight: 'calc(100vh - 64px)',
        p: { xs: 2, sm: 3 },
        bgcolor: 'background.body',
      }}
    >
      <Box sx={{ maxWidth: 760, mx: 'auto' }}>
        <Stack
          direction='row'
          justifyContent='space-between'
          alignItems='center'
          sx={{ mb: 2, gap: 2 }}
        >
          <Typography level='h2'>{t('notificationsCenter.title')}</Typography>
          <Button
            variant='plain'
            disabled={!unreadCount || readAll.isPending}
            onClick={() => readAll.mutate()}
          >
            {t('notificationsCenter.markAllRead')}
          </Button>
        </Stack>
        {isLoading && (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
            <CircularProgress aria-label={t('notificationsCenter.loading')} />
          </Box>
        )}
        {isError && (
          <Typography color='danger'>
            {t('notificationsCenter.loadError')}
          </Typography>
        )}
        {!isLoading && !isError && !items.length && (
          <Card variant='soft' sx={{ alignItems: 'center', py: 7 }}>
            <NotificationsNone sx={{ fontSize: 40 }} />
            <Typography level='title-lg'>
              {t('notificationsCenter.emptyTitle')}
            </Typography>
            <Typography level='body-sm'>
              {t('notificationsCenter.emptyMessage')}
            </Typography>
          </Card>
        )}
        <Stack spacing={1}>
          {items.map(n => (
            <Card
              key={n.id}
              component={notificationDestination(n) ? 'button' : 'div'}
              onClick={() => notificationDestination(n) && open(n)}
              variant={n.readAt ? 'outlined' : 'soft'}
              color={notificationColor(n.severity)}
              sx={{
                width: '100%',
                textAlign: 'start',
                cursor: notificationDestination(n) ? 'pointer' : 'default',
                minHeight: 72,
                p: 2,
                borderInlineStart: n.readAt ? undefined : '4px solid',
                overflow: 'hidden',
              }}
            >
              <Stack direction='row' spacing={1.5} alignItems='flex-start'>
                <Box
                  sx={{
                    color: `${notificationColor(n.severity)}.500`,
                    mt: 0.25,
                    flex: '0 0 auto',
                  }}
                >
                  {icon(n)}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    level='title-md'
                    sx={{ overflowWrap: 'anywhere' }}
                  >
                    {n.title}
                  </Typography>
                  {n.message && (
                    <Typography level='body-sm'>{n.message}</Typography>
                  )}
                  <Typography
                    level='body-xs'
                    sx={{ mt: 0.5, color: 'text.tertiary' }}
                  >
                    {formatNotificationTime(n.createdAt, language)}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          ))}
        </Stack>
        {hasNextPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant='outlined'
              loading={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              {t('notificationsCenter.loadMore')}
            </Button>
          </Box>
        )}
      </Box>
    </Sheet>
  )
}

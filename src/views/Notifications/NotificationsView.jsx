import {
  Build,
  CardGiftcard,
  CheckCircle,
  CloudOffRounded,
  NotificationsNone,
  Schedule,
  Speed,
  Warning,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  Sheet,
  Stack,
  Typography,
} from '@mui/joy'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import QueryLoadingView from '../../components/common/QueryLoadingView'
import { useLocalization } from '../../contexts/LocalizationContext'
import {
  useNotificationActions,
  useNotifications,
} from '../../queries/NotificationQueries'
import {
  narrowPageShellSx,
} from '../../theme/appLayout'
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
    refetch,
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
        bgcolor: 'background.body',
      }}
    >
      <Box sx={narrowPageShellSx}>
        <PageHeader
          title={t('notificationsCenter.title')}
          action={
            <Button
              variant='plain'
              size='sm'
              disabled={!unreadCount || readAll.isPending}
              onClick={() => readAll.mutate()}
            >
              {t('notificationsCenter.markAllRead')}
            </Button>
          }
        />
        {isLoading && (
          <QueryLoadingView label={t('notificationsCenter.loading')} />
        )}
        {isError && !isLoading && (
          <EmptyState
            variant='error'
            size='sm'
            icon={<CloudOffRounded />}
            title={t('notificationsCenter.loadError')}
            primaryAction={{
              label: t('refresh'),
              onClick: () => refetch(),
            }}
          />
        )}
        {!isLoading && !isError && !items.length && (
          <EmptyState
            variant='empty'
            size='sm'
            icon={<NotificationsNone />}
            title={t('notificationsCenter.emptyTitle')}
            description={t('notificationsCenter.emptyMessage')}
          />
        )}
        <Stack spacing={1} sx={{ mt: items.length ? 0 : 0 }}>
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
              size='sm'
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

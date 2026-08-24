import {
  DevicesOtherRounded,
  LogoutRounded,
  SecurityRounded,
} from '@mui/icons-material'
import { Box, Button, Card, Chip, Typography } from '@mui/joy'
import PropTypes from 'prop-types'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { useLocalization } from '../../contexts/LocalizationContext'
import useConfirmationModal from '../../hooks/useConfirmationModal'
import {
  SessionApiError,
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
} from '../../queries/SessionQueries'
import { useNotification } from '../../service/NotificationProvider'
import { nestedRowSx, sectionCardSx } from '../../theme/appLayout'
import { apiClient } from '../../utils/ApiClient'
import ConfirmationModal from '../../views/Modals/Inputs/ConfirmationModal'
import EmptyState from '../common/EmptyState'
import QueryLoadingView from '../common/QueryLoadingView'
import SettingsQueryStateView from './SettingsQueryStateView'

const AccountSessionsCard = ({ userId }) => {
  const { t } = useTranslation('settings')
  const { fmt } = useLocalization()
  const { showNotification } = useNotification()
  const { confirmModalConfig, showConfirmation } = useConfirmationModal()
  const sessionsQuery = useSessions(userId)
  const revokeSession = useRevokeSession()
  const revokeOthers = useRevokeOtherSessions()
  const actionInFlight = useRef(false)

  const sessions = sessionsQuery.data || []
  const hasCurrentSession = sessions.some(session => session.current)
  const otherSessions = hasCurrentSession
    ? sessions.filter(session => !session.current)
    : []
  const isMutating = revokeSession.isPending || revokeOthers.isPending

  const formatDateTime = value =>
    fmt.intlDateTime(value, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }) || t('accountSessions.unknownTime')

  const runAction = async action => {
    if (actionInFlight.current) return
    actionInFlight.current = true
    try {
      await action()
    } finally {
      actionInFlight.current = false
    }
  }

  const revoke = session =>
    runAction(async () => {
      try {
        await revokeSession.mutateAsync(session.id)
        if (session.current) {
          await apiClient.handleLogout()
          return
        }
        showNotification({
          type: 'success',
          message: t('accountSessions.revokeSuccess'),
        })
        await sessionsQuery.refetch()
      } catch (error) {
        if (error instanceof SessionApiError && error.status === 404) {
          if (session.current) {
            await apiClient.handleLogout()
            return
          }
          showNotification({
            type: 'info',
            message: t('accountSessions.alreadyEnded'),
          })
          await sessionsQuery.refetch()
          return
        }
        showNotification({
          type: 'error',
          message: t('accountSessions.revokeError'),
        })
      }
    })

  const revokeAllOthers = () =>
    runAction(async () => {
      try {
        await revokeOthers.mutateAsync()
        showNotification({
          type: 'success',
          message: t('accountSessions.revokeOthersSuccess'),
        })
        await sessionsQuery.refetch()
      } catch {
        showNotification({
          type: 'error',
          message: t('accountSessions.revokeOthersError'),
        })
      }
    })

  const confirmRevoke = session => {
    showConfirmation(
      session.current
        ? t('accountSessions.currentConfirmMessage')
        : t('accountSessions.confirmMessage'),
      session.current
        ? t('accountSessions.currentConfirmTitle')
        : t('accountSessions.confirmTitle'),
      () => revoke(session),
      t('accountSessions.signOut'),
      t('accountSessions.cancel'),
      'danger',
    )
  }

  const confirmRevokeOthers = () => {
    showConfirmation(
      t('accountSessions.confirmOthersMessage'),
      t('accountSessions.confirmOthersTitle'),
      revokeAllOthers,
      t('accountSessions.signOutOtherSessions'),
      t('accountSessions.cancel'),
      'danger',
    )
  }

  return (
    <Card component='section' sx={sectionCardSx}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'flex-start' },
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box>
          <Typography level='title-md'>{t('accountSessions.title')}</Typography>
          <Typography
            level='body-sm'
            sx={{ color: 'text.secondary', maxWidth: '58ch', mt: 0.5 }}
          >
            {t('accountSessions.description')}
          </Typography>
        </Box>
        {otherSessions.length > 0 && (
          <Button
            variant='outlined'
            color='danger'
            size='sm'
            startDecorator={<LogoutRounded />}
            disabled={isMutating}
            loading={revokeOthers.isPending}
            onClick={confirmRevokeOthers}
            sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
          >
            {t('accountSessions.signOutOtherSessions')}
          </Button>
        )}
      </Box>

      {sessionsQuery.isLoading && (
        <QueryLoadingView label={t('accountSessions.loading')} size='sm' />
      )}

      {sessionsQuery.isError && !sessionsQuery.isLoading && (
        <SettingsQueryStateView
          title={t('accountSessions.loadErrorTitle')}
          description={t('accountSessions.loadErrorDescription')}
          onRetry={() => sessionsQuery.refetch()}
        />
      )}

      {!sessionsQuery.isLoading &&
        !sessionsQuery.isError &&
        sessions.length === 0 && (
          <EmptyState
            variant='empty'
            size='sm'
            icon={<DevicesOtherRounded />}
            title={t('accountSessions.emptyTitle')}
            description={t('accountSessions.emptyDescription')}
          />
        )}

      {!sessionsQuery.isLoading &&
        !sessionsQuery.isError &&
        sessions.length > 0 && (
          <Box
            component='ul'
            aria-label={t('accountSessions.listLabel')}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              listStyle: 'none',
              m: 0,
              p: 0,
            }}
          >
            {sessions.map(session => {
              const lastActive = formatDateTime(session.lastActiveAt)
              const isThisSessionPending =
                revokeSession.isPending &&
                revokeSession.variables === session.id

              return (
                <Box
                  component='li'
                  key={session.id}
                  sx={{
                    ...nestedRowSx,
                    paddingInline: 2,
                    paddingBlock: 1.75,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 1.5,
                    borderColor: session.current
                      ? 'primary.outlinedBorder'
                      : 'divider',
                    bgcolor: session.current
                      ? 'primary.softBg'
                      : 'background.surface',
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 0.75,
                      }}
                    >
                      <SecurityRounded aria-hidden='true' fontSize='small' />
                      <Typography level='title-sm'>
                        {session.current
                          ? t('accountSessions.currentSession')
                          : t('accountSessions.activeSession')}
                      </Typography>
                      {session.current && (
                        <Chip size='sm' color='primary' variant='soft'>
                          {t('accountSessions.currentBadge')}
                        </Chip>
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          md: 'repeat(3, minmax(0, 1fr))',
                        },
                        gap: { xs: 0.5, md: 2 },
                        mt: 1,
                      }}
                    >
                      <Typography
                        level='body-xs'
                        sx={{ color: 'text.secondary' }}
                      >
                        {t('accountSessions.lastActive', { date: lastActive })}
                      </Typography>
                      <Typography
                        level='body-xs'
                        sx={{ color: 'text.secondary' }}
                      >
                        {t('accountSessions.signedIn', {
                          date: formatDateTime(session.createdAt),
                        })}
                      </Typography>
                      <Typography
                        level='body-xs'
                        sx={{ color: 'text.secondary' }}
                      >
                        {t('accountSessions.expires', {
                          date: formatDateTime(session.expiresAt),
                        })}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant={session.current ? 'soft' : 'outlined'}
                    color='danger'
                    size='sm'
                    startDecorator={<LogoutRounded />}
                    disabled={isMutating || !hasCurrentSession}
                    loading={isThisSessionPending}
                    aria-label={
                      session.current
                        ? t('accountSessions.signOutCurrentLabel')
                        : t('accountSessions.signOutSessionLabel', {
                            date: lastActive,
                          })
                    }
                    onClick={() => confirmRevoke(session)}
                    sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}
                  >
                    {t('accountSessions.signOut')}
                  </Button>
                </Box>
              )
            })}
          </Box>
        )}

      {!sessionsQuery.isLoading &&
        !sessionsQuery.isError &&
        sessions.length > 0 &&
        !hasCurrentSession && (
          <Typography
            role='status'
            level='body-sm'
            sx={{ color: 'warning.700' }}
          >
            {t('accountSessions.currentUnknown')}
          </Typography>
        )}

      <Typography level='body-xs' sx={{ color: 'text.tertiary' }}>
        {t('accountSessions.revocationNotice')}
      </Typography>
      <ConfirmationModal config={confirmModalConfig} />
    </Card>
  )
}

AccountSessionsCard.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
}

export default AccountSessionsCard

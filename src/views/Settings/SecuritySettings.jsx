import { Box, Button, Card, Chip, Typography } from '@mui/joy'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import AccountSessionsCard from '../../components/settings/AccountSessionsCard'
import SettingsQueryStateView from '../../components/settings/SettingsQueryStateView'
import { useUserProfile } from '../../queries/UserQueries'
import { useNotification } from '../../service/NotificationProvider'
import { formStackSx, sectionCardSx } from '../../theme/appLayout'
import { buildAccountIdentity } from '../../utils/AccountIdentity'
import { GetMFAStatus, UpdatePassword } from '../../utils/Fetcher'
import {
  resolveSettingsQueryState,
  SETTINGS_QUERY_STATE,
} from '../../utils/SettingsQueryState'
import LoadingComponent from '../components/Loading'
import PassowrdChangeModal from '../Modals/Inputs/PasswordChangeModal'
import UserDeletionModal from '../Modals/Inputs/UserDeletionModal'
import SettingsLayout from './SettingsLayout'

const SecuritySettings = () => {
  const { t } = useTranslation('settings')
  const navigate = useNavigate()
  const { data: userProfile, error, isLoading, refetch } = useUserProfile()
  const { showError, showSuccess } = useNotification()
  const isSelfHosted = import.meta.env.VITE_IS_SELF_HOSTED === 'true'

  const [mfaState, setMfaState] = useState('unknown')
  const [changePasswordModal, setChangePasswordModal] = useState(false)
  const [userDeletionModal, setUserDeletionModal] = useState(false)

  const profileState = resolveSettingsQueryState({
    isLoading,
    isError: Boolean(error),
    hasData: Boolean(userProfile),
  })

  useEffect(() => {
    let cancelled = false
    GetMFAStatus()
      .then(resp => resp.json())
      .then(data => {
        if (!cancelled) {
          setMfaState(data && data.mfaEnabled ? 'enabled' : 'disabled')
        }
      })
      .catch(() => {
        if (!cancelled) setMfaState('disabled')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (profileState === SETTINGS_QUERY_STATE.LOADING) {
    return <LoadingComponent />
  }

  if (profileState === SETTINGS_QUERY_STATE.ERROR) {
    return (
      <SettingsLayout title={t('security.title')}>
        <SettingsQueryStateView
          onRetry={() => refetch()}
          description={error?.message}
        />
      </SettingsLayout>
    )
  }

  const identity = buildAccountIdentity(userProfile)

  return (
    <SettingsLayout title={t('security.title')}>
      <Box sx={formStackSx}>
        <Typography level='body-md'>{t('security.description')}</Typography>

        <Card sx={{ ...sectionCardSx, maxWidth: 400 }}>
          <Typography level='title-sm' sx={{ mb: 0.5 }}>
            {t('security.signinTitle')}
          </Typography>
          <Typography level='body-sm' sx={{ mb: 1.5, opacity: 0.85 }}>
            {t('security.signinHelp')}
          </Typography>
          <div className='figma-settings-row' style={{ paddingInline: 0 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                className='text-primary font-medium'
                style={{ fontSize: 14 }}
              >
                {t('security.connectedAccounts')}
              </div>
            </div>
            <Chip variant='soft' size='sm'>
              {t(`profile.accountIdentity.providers.${identity.providerKey}`)}
            </Chip>
          </div>
        </Card>

        {isSelfHosted && (
          <Card sx={{ ...sectionCardSx, maxWidth: 400 }}>
            <Typography level='title-sm' sx={{ mb: 0.5 }}>
              {t('security.passwordTitle')}
            </Typography>
            <Typography level='body-sm' sx={{ mb: 2, opacity: 0.85 }}>
              {t('security.passwordHelp')}
            </Typography>
            <Button
              variant='soft'
              onClick={() => setChangePasswordModal(true)}
              sx={{ width: 160 }}
            >
              {t('security.changePassword')}
            </Button>
          </Card>
        )}

        <Card sx={{ ...sectionCardSx, maxWidth: 400 }}>
          <div className='figma-settings-row' style={{ paddingInline: 0 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                className='text-primary font-medium'
                style={{ fontSize: 14 }}
              >
                {t('security.mfaTitle')}
              </div>
              <div
                className='text-muted'
                style={{ fontSize: 12, marginTop: 1 }}
              >
                {t('security.mfaHelp')}
              </div>
            </div>
            <Chip
              variant='soft'
              color={mfaState === 'enabled' ? 'success' : 'neutral'}
              size='sm'
            >
              {mfaState === 'enabled'
                ? t('security.mfaEnabled')
                : t('security.mfaDisabled')}
            </Chip>
            <Button
              variant='plain'
              size='sm'
              onClick={() => navigate('/settings/mfa')}
            >
              {t('security.mfaManage')}
            </Button>
          </div>
        </Card>

        <Box sx={{ mt: 2 }}>
          <Typography level='title-sm' sx={{ mb: 0.5 }}>
            {t('security.sessionsTitle')}
          </Typography>
          <Typography level='body-sm' sx={{ mb: 1.5, opacity: 0.85 }}>
            {t('security.sessionsHelp')}
          </Typography>
          <AccountSessionsCard userId={userProfile.id} />
        </Box>

        <Card
          sx={{
            ...sectionCardSx,
            maxWidth: 400,
            bgcolor: 'danger.softBg',
            mt: 2,
          }}
        >
          <Typography level='title-md' mb={1} color='danger'>
            {t('security.dangerZone')}
          </Typography>
          <Typography level='body-sm' mb={2} color='neutral'>
            {t('security.deleteAccountHelp')}
          </Typography>
          <Button
            variant='outlined'
            color='danger'
            onClick={() => setUserDeletionModal(true)}
          >
            {t('security.deleteAccount')}
          </Button>
        </Card>
      </Box>

      {changePasswordModal && (
        <PassowrdChangeModal
          isOpen={changePasswordModal}
          onClose={({ currentPassword, password } = {}) => {
            if (password && currentPassword) {
              UpdatePassword(currentPassword, password).then(resp => {
                if (resp.ok) {
                  showSuccess({
                    title: t('security.changePassword'),
                    message: t('profile.passwordChanged'),
                  })
                } else if (resp.status === 403) {
                  showError({
                    title: t('security.changePassword'),
                    message: t('profile.wrongCurrentPassword'),
                  })
                } else {
                  showError({
                    title: t('security.changePassword'),
                    message: t('profile.passwordChangeFailed'),
                  })
                }
              })
            }
            setChangePasswordModal(false)
          }}
        />
      )}

      <UserDeletionModal
        isOpen={userDeletionModal}
        onClose={success => {
          setUserDeletionModal(false)
          if (success) {
            showSuccess({
              title: t('security.deleteAccount'),
              message: t('profile.accountDeleted'),
            })
          }
        }}
      />
    </SettingsLayout>
  )
}

export default SecuritySettings

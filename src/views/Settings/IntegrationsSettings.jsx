import { Box, Button, Card, Chip, Typography } from '@mui/joy'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import { formStackSx, sectionCardSx } from '../../theme/appLayout'
import {
  hasPermission,
  PERMISSIONS,
  resolveEffectiveRole,
} from '../../utils/PermissionModel'
import SettingsLayout from './SettingsLayout'

const IntegrationCard = ({
  action,
  children,
  description,
  title,
  trailing,
}) => (
  <Card sx={{ ...sectionCardSx, maxWidth: 440 }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div>
        <Typography level='title-sm' sx={{ mb: 0.5 }}>
          {title}
        </Typography>
        <Typography level='body-sm' sx={{ opacity: 0.85 }}>
          {description}
        </Typography>
      </div>
      {trailing}
    </div>
    {children}
    {action && (
      <Button
        variant='soft'
        color='neutral'
        onClick={action.onClick}
        sx={{ mt: 2 }}
      >
        {action.label}
      </Button>
    )}
  </Card>
)

const IntegrationsSettings = () => {
  const { t } = useTranslation('settings')
  const navigate = useNavigate()
  const { data: userProfile } = useUserProfile()
  const { data: membersData } = useCircleMembers()
  const circleMembers = membersData?.res || []

  const role = resolveEffectiveRole(userProfile, circleMembers)
  const canManageAccount = hasPermission(role, PERMISSIONS.MANAGE_ACCOUNT)
  const canManageCircle = hasPermission(role, PERMISSIONS.MANAGE_CIRCLE)

  return (
    <SettingsLayout title={t('integrations.title')}>
      <Box sx={formStackSx}>
        <Typography level='body-md'>{t('integrations.description')}</Typography>

        <IntegrationCard
          title={t('integrations.apiTitle')}
          description={t('integrations.apiHelp')}
          action={
            canManageAccount
              ? {
                  label: t('integrations.manageTokens'),
                  onClick: () => navigate('/settings/apitokens'),
                }
              : undefined
          }
        />

        <IntegrationCard
          title={t('integrations.webhookTitle')}
          description={t('integrations.webhookHelp')}
          trailing={
            <Chip variant='soft' size='sm'>
              {t('integrations.webhookPlus')}
            </Chip>
          }
          action={
            canManageCircle
              ? {
                  label: t('integrations.webhookOpen'),
                  onClick: () => navigate('/settings/circle'),
                }
              : undefined
          }
        >
          <Typography level='body-sm' sx={{ mt: 1, opacity: 0.7 }}>
            {t('integrations.webhookHelpCircle')}
          </Typography>
        </IntegrationCard>

        <IntegrationCard
          title={t('integrations.storageTitle')}
          description={t('integrations.storageHelp')}
          action={{
            label: t('integrations.openStorage'),
            onClick: () => navigate('/settings/storage'),
          }}
        />
      </Box>
    </SettingsLayout>
  )
}

export default IntegrationsSettings

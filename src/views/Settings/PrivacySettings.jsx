import { Box, Button, Card, Divider, Switch, Typography } from '@mui/joy'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { formStackSx, sectionCardSx } from '../../theme/appLayout'
import {
  getPrivacyPreference,
  PRIVACY_PREFERENCES,
  setPrivacyPreference,
} from '../../utils/SettingsPrivacy'
import SettingsLayout from './SettingsLayout'

const ToggleRow = ({ checked, help, label, onChange, testId }) => (
  <div className='figma-settings-row'>
    <div style={{ minWidth: 0, flex: 1 }}>
      <div className='text-primary font-medium' style={{ fontSize: 14 }}>
        {label}
      </div>
      {help && (
        <div className='text-muted' style={{ fontSize: 12, marginTop: 1 }}>
          {help}
        </div>
      )}
    </div>
    <Switch
      checked={checked}
      onChange={event => onChange(event.target.checked)}
      data-testid={testId}
      slotProps={{ thumb: { 'data-testid': `${testId}-thumb` } }}
    />
  </div>
)

const InfoCard = ({ action, children, description, title }) => (
  <Card sx={{ ...sectionCardSx, maxWidth: 400 }}>
    <Typography level='title-sm' sx={{ mb: 0.5 }}>
      {title}
    </Typography>
    <Typography level='body-sm' sx={{ mb: 2, opacity: 0.85 }}>
      {description}
    </Typography>
    {children}
    {action && (
      <Button variant='soft' color='neutral' onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </Card>
)

const PrivacySettings = () => {
  const { t } = useTranslation('settings')
  const navigate = useNavigate()

  const [showTimezone, setShowTimezone] = useState(() =>
    getPrivacyPreference(PRIVACY_PREFERENCES.showTimezone),
  )
  const [showEmail, setShowEmail] = useState(() =>
    getPrivacyPreference(PRIVACY_PREFERENCES.showEmail),
  )
  const [shareDiagnostics, setShareDiagnostics] = useState(() =>
    getPrivacyPreference(PRIVACY_PREFERENCES.shareDiagnostics),
  )

  const updatePreference = (preference, setter) => value => {
    setPrivacyPreference(preference, value)
    setter(value)
  }

  return (
    <SettingsLayout title={t('privacy.title')}>
      <Box sx={formStackSx}>
        <Typography level='body-md'>{t('privacy.description')}</Typography>

        <Card sx={{ ...sectionCardSx, maxWidth: 400 }}>
          <Typography level='title-sm' sx={{ mb: 0.5 }}>
            {t('privacy.profileVisibility')}
          </Typography>
          <Typography level='body-sm' sx={{ mb: 1, opacity: 0.85 }}>
            {t('privacy.profileVisibilityHelp')}
          </Typography>
          <Divider />
          <ToggleRow
            checked={showTimezone}
            help={t('privacy.showTimezoneHelp')}
            label={t('privacy.showTimezone')}
            onChange={updatePreference(
              PRIVACY_PREFERENCES.showTimezone,
              setShowTimezone,
            )}
            testId='privacy-show-timezone'
          />
          <ToggleRow
            checked={showEmail}
            help={t('privacy.showEmailHelp')}
            label={t('privacy.showEmail')}
            onChange={updatePreference(
              PRIVACY_PREFERENCES.showEmail,
              setShowEmail,
            )}
            testId='privacy-show-email'
          />
        </Card>

        <InfoCard
          title={t('privacy.household')}
          description={t('privacy.householdHelp')}
          action={{
            label: t('privacy.manageHousehold'),
            onClick: () => navigate('/settings/circle'),
          }}
        />

        <InfoCard
          title={t('privacy.dataStorage')}
          description={t('privacy.dataStorageHelp')}
          action={{
            label: t('privacy.openStorage'),
            onClick: () => navigate('/settings/storage'),
          }}
        />

        <Card sx={{ ...sectionCardSx, maxWidth: 400 }}>
          <Typography level='title-sm' sx={{ mb: 0.5 }}>
            {t('privacy.diagnostics')}
          </Typography>
          <Typography level='body-sm' sx={{ mb: 1, opacity: 0.85 }}>
            {t('privacy.diagnosticsHelp')}
          </Typography>
          <Divider />
          <ToggleRow
            checked={shareDiagnostics}
            help={t('privacy.shareDiagnosticsHelp')}
            label={t('privacy.shareDiagnostics')}
            onChange={updatePreference(
              PRIVACY_PREFERENCES.shareDiagnostics,
              setShareDiagnostics,
            )}
            testId='privacy-share-diagnostics'
          />
        </Card>

        <InfoCard
          title={t('privacy.policyTitle')}
          description={t('privacy.policyHelp')}
          action={{
            label: t('privacy.readPolicy'),
            onClick: () => navigate('/privacy'),
          }}
        />
      </Box>
    </SettingsLayout>
  )
}

export default PrivacySettings

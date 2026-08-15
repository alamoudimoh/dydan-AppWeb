import { Card, Typography } from '@mui/joy'
import { useTranslation } from 'react-i18next'

import { sectionCardSx } from '../../theme/appLayout'
import { buildAccountIdentity } from '../../utils/AccountIdentity'

const IdentityRow = ({ label, notSetLabel, value }) => (
  <div className='mb-2'>
    <Typography level='body-xs' sx={{ mb: 0.25, opacity: 0.8 }}>
      {label}
    </Typography>
    <Typography level='body-md'>{value || notSetLabel}</Typography>
  </div>
)

const AccountIdentityCard = ({ circleMembers, profile }) => {
  const { t } = useTranslation('settings')
  const identity = buildAccountIdentity(profile, circleMembers)
  const notSet = t('profile.accountIdentity.notSet')

  return (
    <Card sx={{ ...sectionCardSx, maxWidth: 400 }}>
      <Typography level='title-sm' sx={{ mb: 0.5 }}>
        {t('profile.accountIdentity.title')}
      </Typography>
      <Typography level='body-sm' sx={{ mb: 2, opacity: 0.85 }}>
        {t('profile.accountIdentity.description')}
      </Typography>
      <IdentityRow
        label={t('profile.accountIdentity.username')}
        value={identity.username}
        notSetLabel={notSet}
      />
      <IdentityRow
        label={t('profile.accountIdentity.email')}
        value={identity.email}
        notSetLabel={notSet}
      />
      <IdentityRow
        label={t('profile.accountIdentity.provider')}
        value={t(`profile.accountIdentity.providers.${identity.providerKey}`)}
        notSetLabel={notSet}
      />
      <IdentityRow
        label={t('profile.accountIdentity.familyRole')}
        value={t(`profile.accountIdentity.roles.${identity.effectiveRoleKey}`)}
        notSetLabel={notSet}
      />
    </Card>
  )
}

export default AccountIdentityCard

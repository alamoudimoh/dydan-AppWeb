import { CloudOffRounded, RefreshRounded } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

import EmptyState from '../common/EmptyState'

const SettingsQueryStateView = ({ description, onRetry, title }) => {
  const { t } = useTranslation('settings')

  return (
    <EmptyState
      variant='error'
      icon={<CloudOffRounded />}
      title={title || t('queryState.errorTitle')}
      description={description || t('queryState.errorDescription')}
      primaryAction={
        onRetry
          ? {
              label: t('queryState.retry'),
              onClick: onRetry,
              startDecorator: <RefreshRounded />,
            }
          : undefined
      }
      size='sm'
    />
  )
}

export default SettingsQueryStateView

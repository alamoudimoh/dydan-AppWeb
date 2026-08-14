import {
  CloudOffRounded,
  HomeRounded,
  LockRounded,
  RefreshRounded,
  SearchOffRounded,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

import {
  CHORE_QUERY_STATE,
  resolveChoreQueryState,
} from '../../utils/ChoreQueryState'
import EmptyState from '../common/EmptyState'

const STATE_META = {
  [CHORE_QUERY_STATE.NOT_FOUND]: {
    Icon: SearchOffRounded,
    titleKey: 'choreLoadState.notFoundTitle',
    descriptionKey: 'choreLoadState.notFoundDescription',
  },
  [CHORE_QUERY_STATE.FORBIDDEN]: {
    Icon: LockRounded,
    titleKey: 'choreLoadState.forbiddenTitle',
    descriptionKey: 'choreLoadState.forbiddenDescription',
  },
  [CHORE_QUERY_STATE.NETWORK]: {
    Icon: CloudOffRounded,
    titleKey: 'choreLoadState.networkTitle',
    descriptionKey: 'choreLoadState.networkDescription',
  },
  [CHORE_QUERY_STATE.ERROR]: {
    Icon: CloudOffRounded,
    titleKey: 'choreLoadState.errorTitle',
    descriptionKey: 'choreLoadState.errorDescription',
  },
}

const ChoreQueryStateView = ({
  backTo = '/chores',
  error,
  hasData,
  onRetry,
}) => {
  const { t } = useTranslation('chores')
  const state = resolveChoreQueryState({ error, hasData })
  const meta = STATE_META[state] || STATE_META[CHORE_QUERY_STATE.ERROR]
  const { Icon } = meta

  return (
    <EmptyState
      variant='error'
      icon={<Icon />}
      title={t(meta.titleKey)}
      description={t(meta.descriptionKey)}
      primaryAction={
        onRetry
          ? {
              label: t('choreLoadState.retry'),
              onClick: onRetry,
              startDecorator: <RefreshRounded />,
            }
          : undefined
      }
      secondaryAction={{
        label: t('choreLoadState.backToTasks'),
        to: backTo,
        startDecorator: <HomeRounded />,
      }}
      fullHeight
    />
  )
}

export default ChoreQueryStateView

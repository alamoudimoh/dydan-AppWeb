import { Groups } from '@mui/icons-material'
import { Alert, Box, Button, Stack } from '@mui/joy'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { hasActiveFamilyCircle } from '../navigation/navModel'
import { useCircleMembers, useUserProfile } from '../queries/UserQueries'
import { pageShellSx, pageStackSpacing } from '../theme/appLayout'
import LoadingComponent from '../views/components/Loading'
import PageHeader from './common/PageHeader'

const isManagedAccount = profile =>
  profile?.userType === 1 || profile?.parentUserId != null

const FamilyCircleGuard = ({ children }) => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { data: profile, isLoading: profileLoading } = useUserProfile()
  const { data: circleMembersData, isLoading: membersLoading } =
    useCircleMembers()

  if (profileLoading || membersLoading) {
    return <LoadingComponent />
  }

  if (hasActiveFamilyCircle(profile, circleMembersData)) {
    return children
  }

  const managed = isManagedAccount(profile)

  return (
    <Box sx={pageShellSx}>
      <Stack spacing={pageStackSpacing}>
        <PageHeader
          icon={<Groups />}
          title={t('familyProgress.title')}
          subtitle={t('familyProgress.subtitle')}
        />
        <Alert variant='soft' color='neutral'>
          {t('familyProgress.noCircleDescription')}
        </Alert>
        <Button
          variant='soft'
          onClick={() =>
            navigate(managed ? '/' : '/settings/circle', {
              replace: true,
            })
          }
        >
          {t(
            managed
              ? 'familyProgress.backToTasks'
              : 'familyProgress.goToCircleSettings',
          )}
        </Button>
      </Stack>
    </Box>
  )
}

export default FamilyCircleGuard

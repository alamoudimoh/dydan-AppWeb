import { SupervisorAccount } from '@mui/icons-material'
import { Avatar, Box, Button, Typography } from '@mui/joy'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import SectionCard from '../../components/common/SectionCard'
import { useImpersonateUser } from '../../contexts/ImpersonateUserContext'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import UserModal from '../Modals/Inputs/UserModal'
import { sideCardSx } from './sideCardSx'
const UserSwitcher = () => {
  const { t } = useTranslation('chores')
  const {
    canImpersonate,
    impersonatedUser,
    isImpersonating,
    startImpersonation,
    stopImpersonation,
  } = useImpersonateUser()
  const { data: userProfile } = useUserProfile()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: circleMembersData, isLoading: isCircleMembersLoading } =
    useCircleMembers()

  // Check if current user can impersonate
  const isAdmin = canImpersonate(userProfile, circleMembersData?.res)
  if (!isAdmin) {
    return null
  } else if (isCircleMembersLoading || !isImpersonating) {
    return (
      <SectionCard
        sx={{
          ...sideCardSx,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          {/* Header */}
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 1,
              }}
            >
              <SupervisorAccount color='' />
              <Typography level='title-md'>
                {t('sideCards.viewTasksAs')}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography level='title-md' sx={{ mb: 0.5 }}>
              {t('sideCards.switchUserView')}
            </Typography>
            <Typography level='body-sm' sx={{ mb: 1, color: 'text.secondary' }}>
              {t('sideCards.switchUserDescription')}
            </Typography>
          </Box>
          <Button
            variant='plain'
            color='primary'
            onClick={() => setIsModalOpen(true)}
            size='sm'
          >
            {t('sideCards.chooseUser')}
          </Button>
          <UserModal
            isOpen={isModalOpen}
            performers={circleMembersData?.res}
            onSelect={user => {
              startImpersonation(user, userProfile)
              setIsModalOpen(false)
            }}
            onClose={() => setIsModalOpen(false)}
          />
        </Box>
      </SectionCard>
    )
  }

  return (
    <SectionCard
      sx={{
        ...sideCardSx,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 2,
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 2, width: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 1,
            }}
          >
            <SupervisorAccount color='' />
            <Typography level='title-md'>
              {t('sideCards.viewTasksAs')}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Box sx={{ marginInlineEnd: 2 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
              }}
              src={impersonatedUser?.image || impersonatedUser?.avatar}
              alt={impersonatedUser?.displayName || impersonatedUser?.name}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography level='title-md' sx={{ mb: 1, marginInlineStart: 0.5 }}>
              {impersonatedUser?.displayName || impersonatedUser?.name}
            </Typography>
            {/* <Box sx={{ fontSize: 14, color: 'text.secondary', mb: 0.5 }}>
              5 chores assigned, 2 due soon
            </Box> */}
            <Box>
              <Button
                variant='plain'
                color='neutral'
                size='sm'
                onClick={() => {
                  setIsModalOpen(true)
                }}
              >
                {t('sideCards.changeUser')}
              </Button>
              <Button
                variant='plain'
                color='neutral'
                size='sm'
                sx={{ marginInlineStart: 0.5 }}
                onClick={() => {
                  stopImpersonation()
                }}
              >
                {t('sideCards.cancelUserView')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
      <UserModal
        isOpen={isModalOpen}
        performers={circleMembersData?.res}
        onSelect={user => {
          startImpersonation(user, userProfile)
          setIsModalOpen(false)
        }}
        onClose={() => {
          setIsModalOpen(false)
        }}
      />
    </SectionCard>
  )
}
export default UserSwitcher

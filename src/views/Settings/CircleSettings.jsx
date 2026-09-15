import { Share } from '@capacitor/share'
import { CopyAll, Delete, IosShare, Refresh } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Input,
  Option,
  Select,
  Typography,
} from '@mui/joy'
import { useQueryClient } from '@tanstack/react-query'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import SettingsQueryStateView from '../../components/settings/SettingsQueryStateView'
import { APP_DISPLAY_NAME } from '../../config/AppBranding'
import { useLocalization } from '../../contexts/LocalizationContext'
import { useActiveCircle } from '../../queries/CircleQueries'
import { useUserProfile } from '../../queries/UserQueries'
import { useNotification } from '../../service/NotificationProvider'
import { apiClient } from '../../utils/ApiClient'
import {
  AcceptCircleMemberRequest,
  DeleteCircleMember,
  GetAllCircleMembers,
  GetCircleMemberRequests,
  JoinCircle,
  LeaveCircle,
  UpdateMemberRole,
} from '../../utils/Fetcher'
import {
  hasPermission,
  PERMISSIONS,
  resolveEffectiveRole,
} from '../../utils/PermissionModel'
import LoadingComponent from '../components/Loading'
import ConfirmationModal from '../Modals/Inputs/ConfirmationModal'
import SettingsLayout from './SettingsLayout'

const CircleSettings = () => {
  const { t } = useTranslation('settings')
  const { data: userProfile } = useUserProfile()
  const queryClient = useQueryClient()
  const { showNotification } = useNotification()
  const navigate = useNavigate()
  const { fmt } = useLocalization()
  const { activeCircle, hasMultipleCircles } = useActiveCircle()

  const [circleMemberRequests, setCircleMemberRequests] = useState([])
  const [circleInviteCode, setCircleInviteCode] = useState('')
  const [circleMembers, setCircleMembers] = useState([])
  const [circleDataLoading, setCircleDataLoading] = useState(true)
  const [circleDataError, setCircleDataError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [confirmModalConfig, setConfirmModalConfig] = useState({})

  const showConfirmation = (
    message,
    title,
    onConfirm,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    color = 'primary',
  ) => {
    setConfirmModalConfig({
      isOpen: true,
      message,
      title,
      confirmText,
      cancelText,
      color,
      onClose: isConfirmed => {
        if (isConfirmed) {
          onConfirm()
        }
        setConfirmModalConfig({})
      },
    })
  }

  const refreshMemberRequests = async () => {
    setIsRefreshing(true)
    try {
      const resp = await GetCircleMemberRequests()
      const data = await resp.json()
      setCircleMemberRequests(data.res ? data.res : [])
      setLastRefresh(new Date())
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Failed to refresh member requests',
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const loadCircleData = async () => {
    setCircleDataLoading(true)
    setCircleDataError(null)
    try {
      const [requestsResp, membersData] = await Promise.all([
        GetCircleMemberRequests(),
        GetAllCircleMembers(),
      ])
      const requestsBody = await requestsResp.json().catch(() => ({}))
      if (!requestsResp.ok) {
        throw new Error(requestsBody?.error || 'Failed to load member requests')
      }
      setCircleMemberRequests(requestsBody.res ? requestsBody.res : [])
      setCircleMembers(membersData?.res ? membersData.res : [])
      setLastRefresh(new Date())
    } catch (err) {
      setCircleDataError(err)
    } finally {
      setCircleDataLoading(false)
    }
  }

  useEffect(() => {
    loadCircleData()
  }, [])

  const canManageCircle = hasPermission(
    resolveEffectiveRole(userProfile, circleMembers),
    PERMISSIONS.MANAGE_CIRCLE,
  )

  const inviteCode = activeCircle?.invite_code
  const apiURL = new URL(apiClient.getApiURL(), window.location.origin)
  const inviteOrigin = `${apiURL.origin}${apiURL.pathname.replace(/\/api\/v1\/?$/, '')}`
  const inviteLink = inviteCode
    ? `${inviteOrigin.replace(/\/$/, '')}/circle/join?code=${encodeURIComponent(inviteCode)}`
    : ''

  const shareInvite = async () => {
    const circleName = activeCircle?.name || 'my Circle'

    try {
      await Share.share({
        title: `Join ${circleName} on ${APP_DISPLAY_NAME}`,
        text: `I'd like to invite you to join ${circleName} on ${APP_DISPLAY_NAME}.`,
        url: inviteLink,
        dialogTitle: 'Share Circle invite',
      })
    } catch (error) {
      if (error?.message?.toLowerCase().includes('cancel')) return
      await navigator.clipboard.writeText(inviteLink)
      showNotification({
        type: 'success',
        message: 'Invite link copied to clipboard',
      })
    }
  }

  if (!userProfile) {
    return <LoadingComponent />
  }

  if (circleDataLoading) {
    return (
      <SettingsLayout title='Circle Settings'>
        <LoadingComponent />
      </SettingsLayout>
    )
  }

  if (circleDataError) {
    return (
      <SettingsLayout title='Circle Settings'>
        <SettingsQueryStateView onRetry={loadCircleData} />
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout title={t('circleSettings.title')}>
      <div className='grid gap-4'>
        <Typography level='body-md'>
          {t('circleSettings.description')}
        </Typography>
        {hasMultipleCircles && activeCircle && (
          <Alert variant='soft' color='neutral'>
            You belong to more than one Circle. This session uses your active
            Circle ({activeCircle.name}).
          </Alert>
        )}
        <Box>
          <Typography level='title-sm' sx={{ mb: 1 }}>
            {activeCircle?.userRole === 'member'
              ? `You part of ${activeCircle?.name} `
              : `You circle code is:`}
          </Typography>
          <Input
            value={inviteCode}
            disabled
            size='lg'
            sx={{
              width: { xs: '100%', sm: '220px' },
              mb: 1,
            }}
          />
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Button
              variant='soft'
              startDecorator={<CopyAll />}
              onClick={() => {
                navigator.clipboard.writeText(activeCircle?.invite_code)
                showNotification({
                  type: 'success',
                  message: 'Code copied to clipboard',
                })
              }}
            >
              Copy Code
            </Button>
            <Button
              variant='soft'
              disabled={!inviteLink}
              startDecorator={<IosShare />}
              onClick={shareInvite}
            >
              Share Invite
            </Button>
            {activeCircle && activeCircle?.userRole === 'member' && (
              <Button
                color='danger'
                variant='outlined'
                onClick={() => {
                  showConfirmation(
                    'Are you sure you want to leave your circle?',
                    'Leave Circle',
                    () => {
                      LeaveCircle(activeCircle?.id).then(resp => {
                        if (resp.ok) {
                          showNotification({
                            type: 'success',
                            message: 'Left circle successfully',
                          })
                        } else {
                          showNotification({
                            type: 'error',
                            message: 'Failed to leave circle',
                          })
                        }
                      })
                    },
                    'Leave',
                    'Cancel',
                    'danger',
                  )
                }}
              >
                Leave Circle
              </Button>
            )}
          </Box>
        </Box>

        <Typography level='title-md'>
          {t('circleSettings.circleMembers')}
        </Typography>
        {circleMembers.map(member => (
          <Card key={member.id} className='p-4'>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', md: 'center' },
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography level='body-md'>
                  {member.displayName.charAt(0).toUpperCase() +
                    member.displayName.slice(1)}
                  {member.userId === userProfile.id
                    ? t('circleSettings.you')
                    : ''}{' '}
                  <Chip>
                    {member.isActive
                      ? member.role
                      : t('circleSettings.pendingApproval')}
                  </Chip>
                </Typography>
                {member.isActive ? (
                  <Typography level='body-sm'>
                    {t('circleSettings.joinedOn', {
                      date: fmt.date(member.createdAt),
                    })}
                  </Typography>
                ) : (
                  <Typography level='body-sm' color='danger'>
                    {t('circleSettings.requestToJoin', {
                      date: fmt.date(member.updatedAt),
                    })}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: { xs: 'flex-start', md: 'flex-end' },
                  gap: 1,
                  width: { xs: '100%', md: 'auto' },
                }}
              >
                {member.userId !== userProfile.id && canManageCircle && (
                  <Select
                    size='sm'
                    sx={{ me: 1 }}
                    value={member.role}
                    renderValue={() => (
                      <Typography>
                        {member.role.charAt(0).toUpperCase() +
                          member.role.slice(1)}
                      </Typography>
                    )}
                    onChange={(e, value) => {
                      UpdateMemberRole(member.userId, value).then(resp => {
                        if (resp.ok) {
                          const newCircleMembers = circleMembers.map(m => {
                            if (m.userId === member.userId) {
                              m.role = value
                            }
                            return m
                          })
                          setCircleMembers(newCircleMembers)
                        } else {
                          showNotification({
                            type: 'error',
                            message: 'Failed to update role',
                          })
                        }
                      })
                    }}
                  >
                    {[
                      {
                        value: 'member',
                        label: t('circleSettings.roleMember'),
                        description: t('circleSettings.roleMemberDescription'),
                      },
                      {
                        value: 'manager',
                        label: t('circleSettings.roleManager'),
                        description: t('circleSettings.roleManagerDescription'),
                      },
                      {
                        value: 'admin',
                        label: t('circleSettings.roleAdmin'),
                        description: t('circleSettings.roleAdminDescription'),
                      },
                    ].map((option, index) => (
                      <Option value={option.value} key={index}>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'start',
                            alignItems: 'start',
                            width: '100%',
                            gap: 0.5,
                          }}
                        >
                          <Typography
                            level='title-sm'
                            sx={{ mb: 0, mt: 0, lineHeight: 1.1 }}
                          >
                            {option.label}
                          </Typography>
                          <Typography
                            level='body-sm'
                            sx={{ mt: 0, mb: 0, lineHeight: 1.1 }}
                          >
                            {option.description}
                          </Typography>
                        </Box>
                      </Option>
                    ))}
                  </Select>
                )}
                {canManageCircle &&
                  member.userId !== userProfile.id &&
                  member.isActive && (
                    <Button
                      variant='outlined'
                      color='danger'
                      size='sm'
                      onClick={() => {
                        showConfirmation(
                          `Are you sure you want to remove ${member.displayName} from your circle?`,
                          'Remove Member',
                          () => {
                            DeleteCircleMember(
                              member.circleId,
                              member.userId,
                            ).then(resp => {
                              if (resp.ok) {
                                showNotification({
                                  type: 'success',
                                  message: 'Removed member successfully',
                                })
                                queryClient.invalidateQueries(['circleMembers'])
                                queryClient.invalidateQueries(['userCircle'])
                                queryClient.refetchQueries(['circleMembers'])
                                queryClient.refetchQueries(['userCircle'])
                                setCircleMembers(prevMembers =>
                                  prevMembers.filter(
                                    m => m.userId !== member.userId,
                                  ),
                                )
                              }
                            })
                          },
                          'Remove',
                          'Cancel',
                          'danger',
                        )
                      }}
                    >
                      <Delete />
                    </Button>
                  )}
              </Box>
            </Box>
          </Card>
        ))}

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 1,
            mb: 1,
          }}
        >
          <Typography level='title-md'>
            {t('circleSettings.circleMemberRequests')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {lastRefresh && (
              <Typography level='body-sm' color='neutral'>
                {t('circleSettings.lastUpdated', {
                  date: fmt.dateTime(lastRefresh),
                })}
              </Typography>
            )}
            <Button
              size='sm'
              variant='soft'
              onClick={refreshMemberRequests}
              disabled={isRefreshing}
              startDecorator={
                isRefreshing ? <CircularProgress size='sm' /> : <Refresh />
              }
            >
              {isRefreshing
                ? t('circleSettings.refreshing')
                : t('circleSettings.refresh')}
            </Button>
          </Box>
        </Box>

        {circleMemberRequests.map(request => (
          <Card key={request.id} className='p-4'>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Typography level='body-md' sx={{ minWidth: 0 }}>
                {t('circleSettings.requestWantsToJoin', {
                  name: request.displayName,
                })}
              </Typography>
              <Button
                variant='soft'
                color='success'
                sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}
                onClick={() => {
                  showConfirmation(
                    `Are you sure you want to accept ${request.displayName} (username: ${request.username}) to join your circle?`,
                    'Accept Member Request',
                    () => {
                      AcceptCircleMemberRequest(request.id).then(resp => {
                        if (resp.ok) {
                          showNotification({
                            type: 'success',
                            message: 'Accepted request successfully',
                          })
                          queryClient.invalidateQueries(['circleMembers'])
                          queryClient.invalidateQueries([
                            'circleMemberRequests',
                          ])
                          queryClient.invalidateQueries(['userCircle'])
                          queryClient.refetchQueries(['circleMembers'])
                          queryClient.refetchQueries(['circleMemberRequests'])
                          queryClient.refetchQueries(['userCircle'])
                          refreshMemberRequests()
                          GetAllCircleMembers().then(data => {
                            setCircleMembers(data.res ? data.res : [])
                          })
                        }
                      })
                    },
                    'Accept',
                    'Cancel',
                  )
                }}
              >
                {t('circleSettings.accept')}
              </Button>
            </Box>
          </Card>
        ))}
        <Divider>{t('circleSettings.orDivider')}</Divider>

        <Typography level='body-md'>
          {t('circleSettings.joinSomeoneElse')}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          <Typography level='title-sm' sx={{ flexShrink: 0 }}>
            {t('circleSettings.enterCircleCode')}
          </Typography>
          <Input
            placeholder={t('circleSettings.enterCodePlaceholder')}
            value={circleInviteCode}
            onChange={e => setCircleInviteCode(e.target.value)}
            size='lg'
            sx={{
              width: { xs: '100%', sm: '220px' },
            }}
          />
          <Button
            variant='soft'
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            onClick={() => {
              JoinCircle(circleInviteCode).then(resp => {
                if (resp.ok) {
                  showNotification({
                    type: 'success',
                    message:
                      'Joined circle successfully, wait for the circle owner to accept your request.',
                  })
                  setTimeout(() => navigate('/'), 3000)
                } else {
                  if (resp.status === 409) {
                    showNotification({
                      type: 'error',
                      message: 'You are already a member of this circle',
                    })
                  } else {
                    showNotification({
                      type: 'error',
                      message: 'Failed to join circle',
                    })
                  }
                  setTimeout(() => navigate('/'), 3000)
                }
              })
            }}
          >
            {t('circleSettings.joinCircle')}
          </Button>
        </Box>
      </div>

      {confirmModalConfig?.isOpen && (
        <ConfirmationModal config={confirmModalConfig} />
      )}
    </SettingsLayout>
  )
}

export default CircleSettings

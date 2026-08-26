import { Capacitor } from '@capacitor/core'
import { Delete, Refresh } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  FormHelperText,
  Input,
  Option,
  Select,
  Typography,
} from '@mui/joy'
import { Purchases } from '@revenuecat/purchases-capacitor'
import { useQueryClient } from '@tanstack/react-query'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import RealTimeSettings from '../../components/RealTimeSettings'
import SubscriptionModal from '../../components/SubscriptionModal'
import { useLocalization } from '../../contexts/LocalizationContext'
import Logo from '../../Logo'
import { useActiveCircle } from '../../queries/CircleQueries'
import { useUserProfile } from '../../queries/UserQueries'
import { useNotification } from '../../service/NotificationProvider'
import {
  AcceptCircleMemberRequest,
  CancelSubscription,
  DeleteCircleMember,
  GetAllCircleMembers,
  GetCircleMemberRequests,
  JoinCircle,
  LeaveCircle,
  PutWebhookURL,
  UpdateMemberRole,
  UpdatePassword,
} from '../../utils/Fetcher'
import { isPlusAccount } from '../../utils/Helpers'
import {
  hasPermission,
  PERMISSIONS,
  resolveEffectiveRole,
} from '../../utils/PermissionModel'
import LoadingComponent from '../components/Loading'
import ConfirmationModal from '../Modals/Inputs/ConfirmationModal'
import NativeCancelSubscriptionModal from '../Modals/Inputs/NativeCancelSubscriptionModal'
import PassowrdChangeModal from '../Modals/Inputs/PasswordChangeModal'
import UserDeletionModal from '../Modals/Inputs/UserDeletionModal'
import APITokenSettings from './APITokenSettings'
import LocalizationSettings from './LocalizationSettings'
import MFASettings from './MFASettings'
import NotificationSetting from './NotificationSetting'
import ProfileSettings from './ProfileSettings'
import SidepanelSettings from './SidepanelSettings'
import StorageSettings from './StorageSettings'
import ThemeToggle from './ThemeToggle'

const Settings = () => {
  const { data: userProfile } = useUserProfile()
  const queryClient = useQueryClient()
  const { showNotification } = useNotification()
  const navigate = useNavigate()
  const { fmt } = useLocalization()
  const { t } = useTranslation(['settings', 'common'])
  const { activeCircle } = useActiveCircle()

  const [circleMemberRequests, setCircleMemberRequests] = useState([])
  const [circleInviteCode, setCircleInviteCode] = useState('')
  const [circleMembers, setCircleMembers] = useState([])
  const [webhookURL, setWebhookURL] = useState(null)
  const [webhookError, setWebhookError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [changePasswordModal, setChangePasswordModal] = useState(false)
  const [subscriptionModal, setSubscriptionModal] = useState(false)
  const [userDeletionModal, setUserDeletionModal] = useState(false)
  const [nativeCancelModal, setNativeCancelModal] = useState(false)
  const [confirmModalConfig, setConfirmModalConfig] = useState({})

  const showConfirmation = (
    message,
    title,
    onConfirm,
    confirmText = t('common:confirm'),
    cancelText = t('common:cancel'),
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
        message: t('circleSettings.notifications.refreshFailed'),
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (activeCircle?.webhook_url) {
      setWebhookURL(activeCircle.webhook_url)
    }
  }, [activeCircle])

  useEffect(() => {
    GetCircleMemberRequests().then(resp => {
      resp.json().then(data => {
        setCircleMemberRequests(data.res ? data.res : [])
        setLastRefresh(new Date())
      })
    })
    GetAllCircleMembers().then(data => {
      setCircleMembers(data.res ? data.res : [])
    })
  }, [])
  useEffect(() => {
    async function configurePurchases() {
      if (Capacitor.isNativePlatform() && userProfile) {
        await Purchases.configure({
          apiKey:
            Capacitor.getPlatform() === 'ios'
              ? import.meta.env.VITE_REACT_APP_REVENUECAT_API_KEY_IOS
              : import.meta.env.VITE_REACT_APP_REVENUECAT_API_KEY_ANDROID,
          appUserID: String(userProfile?.id),
        })
      }
    }
    configurePurchases()
  }, [userProfile])

  const canManageCircle = hasPermission(
    resolveEffectiveRole(userProfile, circleMembers),
    PERMISSIONS.MANAGE_CIRCLE,
  )

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash) {
        // Small delay to ensure the component is fully rendered before scrolling
        setTimeout(() => {
          const section = document.getElementById(hash.slice(1))
          if (section) {
            // Get the element position and scroll with some offset for the title
            const elementPosition = section.offsetTop
            const offsetPosition = elementPosition - 20 // 20px padding above the title

            window.scrollTo({
              top: offsetPosition,
              behavior: 'instant', // Use 'smooth' for smooth scrolling
            })
          }
        }, 500)
      }
    }

    // Handle initial hash on mount
    handleHashChange()

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  const getSubscriptionDetails = () => {
    if (userProfile?.subscription === 'active') {
      return t('accountSettings.subscriptionDetails.active', {
        date: fmt.date(userProfile?.expiration),
      })
    } else if (userProfile?.subscription === 'cancelled') {
      return t('accountSettings.subscriptionDetails.cancelled', {
        date: fmt.date(userProfile?.expiration),
      })
    } else {
      return t('accountSettings.subscriptionDetails.free')
    }
  }
  const getSubscriptionStatus = () => {
    if (userProfile?.subscription === 'active') {
      return t('accountSettings.plus')
    } else if (userProfile?.subscription === 'cancelled') {
      if (moment().isBefore(userProfile?.expiration)) {
        return t('accountSettings.subscriptionStatusPlusUntil', {
          date: fmt.date(userProfile?.expiration),
        })
      }
      return t('accountSettings.free')
    } else {
      return t('accountSettings.free')
    }
  }

  if (userProfile === null) {
    return (
      <Container className='flex h-full items-center justify-center'>
        <Box className='flex flex-col items-center justify-center'>
          <CircularProgress
            color='success'
            sx={{ '--CircularProgress-size': '200px' }}
          >
            <Logo />
          </CircularProgress>
        </Box>
      </Container>
    )
  }
  if (!userProfile) {
    return <LoadingComponent />
  }

  return (
    <Container>
      <ProfileSettings />
      <div className='grid gap-4 py-4' id='circle'>
        <Typography level='h3'>{t('circleSettings.title')}</Typography>
        <Divider />
        <Typography level='body-md'>
          {t('circleSettings.description')}
        </Typography>
        <Typography level='title-sm' mb={-1}>
          {activeCircle?.userRole === 'member'
            ? t('circleSettings.youPartOf', { name: activeCircle?.name })
            : t('circleSettings.yourCircleCode')}

          <Input
            value={activeCircle?.invite_code}
            disabled
            size='lg'
            sx={{
              width: '220px',
              mb: 1,
            }}
          />
          <Button
            variant='soft'
            onClick={() => {
              navigator.clipboard.writeText(activeCircle?.invite_code)
              showNotification({
                type: 'success',
                message: t('circleSettings.codeCopied'),
              })
            }}
          >
            {t('circleSettings.copyCode')}
          </Button>
          <Button
            variant='soft'
            sx={{ ms: 1 }}
            onClick={() => {
              navigator.clipboard.writeText(
                window.location.protocol +
                  '//' +
                  window.location.host +
                  `/circle/join?code=${activeCircle?.invite_code}`,
              )
              showNotification({
                type: 'success',
                message: t('circleSettings.linkCopied'),
              })
            }}
          >
            {t('circleSettings.copyLink')}
          </Button>
          {activeCircle?.userRole === 'member' && (
            <Button
              color='danger'
              variant='outlined'
              sx={{ ms: 1 }}
              onClick={() => {
                showConfirmation(
                  t('circleSettings.leaveConfirmMessage'),
                  t('circleSettings.leaveConfirmTitle'),
                  () => {
                    LeaveCircle(activeCircle?.id).then(resp => {
                      if (resp.ok) {
                        showNotification({
                          type: 'success',
                          message: t(
                            'circleSettings.notifications.leaveSuccess',
                          ),
                        })
                      } else {
                        showNotification({
                          type: 'error',
                          message: t(
                            'circleSettings.notifications.leaveFailed',
                          ),
                        })
                      }
                    })
                  },
                  t('circleSettings.leave'),
                  t('common:cancel'),
                  'danger',
                )
              }}
            >
              {t('circleSettings.leave')}
            </Button>
          )}
        </Typography>

        <Typography level='title-md'>
          {t('circleSettings.circleMembers')}
        </Typography>
        {circleMembers.map(member => (
          <Card key={member.id} className='p-4'>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography level='body-md'>
                  {member.displayName.charAt(0).toUpperCase() +
                    member.displayName.slice(1)}
                  {member.userId === userProfile.id
                    ? t('circleSettings.you')
                    : ''}{' '}
                  <Chip>
                    {' '}
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

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                            message: t(
                              'circleSettings.notifications.roleUpdateFailed',
                            ),
                          })
                        }
                      })
                    }}
                  >
                    {[
                      {
                        value: 'member',
                        description: t('circleSettings.roleMemberDescription'),
                      },
                      {
                        value: 'manager',
                        description: t('circleSettings.roleManagerDescription'),
                      },
                      {
                        value: 'admin',
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
                            {option.value.charAt(0).toUpperCase() +
                              option.value.slice(1)}
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
                          t('circleSettings.removeMemberConfirm', {
                            name: member.displayName,
                          }),
                          t('circleSettings.removeMemberTitle'),
                          () => {
                            DeleteCircleMember(
                              member.circleId,
                              member.userId,
                            ).then(resp => {
                              if (resp.ok) {
                                showNotification({
                                  type: 'success',
                                  message: t(
                                    'circleSettings.notifications.removeMemberSuccess',
                                  ),
                                })
                                // Invalidate and refetch circle-related queries
                                queryClient.invalidateQueries(['circleMembers'])
                                queryClient.invalidateQueries(['userCircle'])
                                queryClient.refetchQueries(['circleMembers'])
                                queryClient.refetchQueries(['userCircle'])
                                // Update local state immediately
                                setCircleMembers(prevMembers =>
                                  prevMembers.filter(
                                    m => m.userId !== member.userId,
                                  ),
                                )
                              }
                            })
                          },
                          t('circleSettings.remove'),
                          t('common:cancel'),
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
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography level='title-md'>
            {t('circleSettings.circleMemberRequests')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            <Typography level='body-md'>
              {t('circleSettings.requestWantsToJoin', {
                name: request.displayName,
              })}
            </Typography>
            <Button
              variant='soft'
              color='success'
              onClick={() => {
                showConfirmation(
                  t('circleSettings.acceptConfirmMessage', {
                    name: request.displayName,
                    username: request.username,
                  }),
                  t('circleSettings.acceptConfirmTitle'),
                  () => {
                    AcceptCircleMemberRequest(request.id).then(resp => {
                      if (resp.ok) {
                        showNotification({
                          type: 'success',
                          message: t(
                            'circleSettings.notifications.acceptSuccess',
                          ),
                        })
                        // Invalidate and refetch circle-related queries
                        queryClient.invalidateQueries(['circleMembers'])
                        queryClient.invalidateQueries(['circleMemberRequests'])
                        queryClient.invalidateQueries(['userCircle'])
                        queryClient.refetchQueries(['circleMembers'])
                        queryClient.refetchQueries(['circleMemberRequests'])
                        queryClient.refetchQueries(['userCircle'])
                        // Refresh local state
                        refreshMemberRequests()
                        GetAllCircleMembers().then(data => {
                          setCircleMembers(data.res ? data.res : [])
                        })
                      }
                    })
                  },
                  t('circleSettings.accept'),
                  t('common:cancel'),
                )
              }}
            >
              {t('circleSettings.accept')}
            </Button>
          </Card>
        ))}
        <Divider> {t('circleSettings.orDivider')} </Divider>

        <Typography level='body-md'>
          {t('circleSettings.joinSomeoneElse')}
        </Typography>

        <Typography level='title-sm' mb={-1}>
          {t('circleSettings.enterCircleCode')}
          <Input
            placeholder={t('circleSettings.enterCodePlaceholder')}
            value={circleInviteCode}
            onChange={e => setCircleInviteCode(e.target.value)}
            size='lg'
            sx={{
              width: '220px',
              mb: 1,
            }}
          />
          <Button
            variant='soft'
            onClick={() => {
              JoinCircle(circleInviteCode).then(resp => {
                if (resp.ok) {
                  showNotification({
                    type: 'success',
                    message: t('circleSettings.notifications.joinSuccess'),
                  })
                  setTimeout(() => navigate('/'), 3000)
                } else {
                  if (resp.status === 409) {
                    showNotification({
                      type: 'error',
                      message: t('circleSettings.notifications.alreadyMember'),
                    })
                  } else {
                    showNotification({
                      type: 'error',
                      message: t('circleSettings.notifications.joinFailed'),
                    })
                  }
                  setTimeout(() => navigate('/'), 3000)
                }
              })
            }}
          >
            {t('circleSettings.joinCircle')}
          </Button>
        </Typography>
        {circleMembers.find(m => userProfile.id == m.userId)?.role ===
          'admin' && (
          <>
            <Typography level='title-lg' mt={2}>
              {t('circleSettings.webhookTitle')}
            </Typography>
            <Typography level='body-md' mt={-1}>
              {t('circleSettings.webhookDescriptionFull')}
            </Typography>
            {!isPlusAccount(userProfile) && (
              <Typography level='body-sm' color='warning' sx={{ mt: 1 }}>
                {t('circleSettings.webhookPlusRequired')}
              </Typography>
            )}
            <FormControl sx={{ mt: 1 }}>
              <Checkbox
                checked={webhookURL !== null}
                onClick={() => {
                  if (webhookURL === null) {
                    setWebhookURL('')
                  } else {
                    setWebhookURL(null)
                  }
                }}
                variant='soft'
                label={t('circleSettings.enableWebhook')}
                disabled={!isPlusAccount(userProfile)}
                overlay
              />
              <FormHelperText
                sx={{
                  opacity: !isPlusAccount(userProfile) ? 0.5 : 1,
                }}
              >
                {t('circleSettings.webhookHelper')}{' '}
                {userProfile && !isPlusAccount(userProfile) && (
                  <Chip variant='soft' color='warning'>
                    {t('circleSettings.plusFeature')}
                  </Chip>
                )}
              </FormHelperText>
            </FormControl>

            {webhookURL !== null && (
              <Box>
                <Typography level='title-sm'>
                  {t('circleSettings.webhookURL')}
                </Typography>
                <Input
                  value={webhookURL ? webhookURL : ''}
                  onChange={e => setWebhookURL(e.target.value)}
                  size='lg'
                  sx={{
                    width: '220px',
                    mb: 1,
                  }}
                />
                {webhookError && (
                  <Typography level='body-sm' color='danger'>
                    {webhookError}
                  </Typography>
                )}
                <Button
                  variant='soft'
                  sx={{ width: '110px', mt: 1 }}
                  onClick={() => {
                    PutWebhookURL(webhookURL).then(resp => {
                      if (resp.ok) {
                        showNotification({
                          type: 'success',
                          message: t(
                            'circleSettings.notifications.webhookUpdated',
                          ),
                        })
                      } else {
                        showNotification({
                          type: 'error',
                          message: t(
                            'circleSettings.notifications.webhookUpdateFailed',
                          ),
                        })
                      }
                    })
                  }}
                  disabled={!isPlusAccount(userProfile)}
                >
                  {t('common:save')}
                </Button>
              </Box>
            )}
          </>
        )}

        {/* WebSocket Settings */}
        {/* <WebSocketSettings /> */}
        <RealTimeSettings />
      </div>

      <div className='grid gap-4 py-4' id='account'>
        <Typography level='h3'>{t('accountSettings.title')}</Typography>
        <Divider />
        <Typography level='body-md'>
          {t('accountSettings.description')}
        </Typography>
        <Typography level='title-md' mb={-1}>
          {t('accountSettings.accountType')} : {getSubscriptionStatus()}
        </Typography>
        <Typography level='body-sm'>{getSubscriptionDetails()}</Typography>
        <Box>
          <Button
            sx={{
              width: '110px',
              mb: 1,
            }}
            disabled={
              userProfile?.subscription === 'active' ||
              (moment(userProfile?.expiration).isAfter(moment()) &&
                userProfile?.subscription !== 'cancelled')
            }
            onClick={async () => {
              if (Capacitor.isNativePlatform()) {
                try {
                  const { RevenueCatUI } =
                    await import('@revenuecat/purchases-capacitor-ui')

                  const offering = await Purchases.getOfferings()
                  await RevenueCatUI.presentPaywall({
                    offering: offering.current,
                  })

                  // Check if user now has entitlement after paywall interaction
                  const { customerInfo } = await Purchases.getCustomerInfo()
                  if (customerInfo.entitlements.active['Donetick Plus']) {
                    queryClient.invalidateQueries(['userProfile'])
                    queryClient.refetchQueries(['userProfile'])
                    showNotification({
                      type: 'success',
                      message:
                        'Purchase successful! Please restart the app to access Plus features.',
                    })
                    // invalidate user profile to get new subscription status:
                  }
                } catch (error) {
                  console.log('Purchase error:', error)

                  // Handle different error types
                  if (error.code === '1') {
                    // User cancelled - don't show error
                    return
                  } else if (error.code === '2') {
                    // Store problem
                    showNotification({
                      type: 'error',
                      message:
                        'Store connection issue. Please check your network and try again.',
                    })
                  } else if (error.code === '3') {
                    // Purchase not allowed
                    showNotification({
                      type: 'error',
                      message:
                        'Purchases are not allowed on this device. Please check your device restrictions.',
                    })
                  } else if (error.code === '4') {
                    // Product not available
                    showNotification({
                      type: 'error',
                      message:
                        'This subscription is not available. Please try again later.',
                    })
                  } else if (error.code === '5') {
                    // Receipt already in use
                    showNotification({
                      type: 'error',
                      message:
                        'This purchase has already been processed. If you believe this is an error, please contact support.',
                    })
                  } else if (error.code === '6') {
                    // Missing receipt file
                    showNotification({
                      type: 'error',
                      message:
                        'Purchase receipt missing. Please try purchasing again.',
                    })
                  } else if (error.code === '7') {
                    // Network error
                    showNotification({
                      type: 'error',
                      message:
                        'Network error. Please check your connection and try again.',
                    })
                  } else if (error.code === '8') {
                    // Invalid receipt
                    showNotification({
                      type: 'error',
                      message:
                        'Invalid purchase receipt. Please contact support if this persists.',
                    })
                  } else if (error.code === '9') {
                    // Payment pending
                    showNotification({
                      type: 'warning',
                      message:
                        'Payment is pending approval. You will receive access once approved.',
                    })
                  } else {
                    // Generic error
                    // log on what part of the code the error happened
                    console.error('Unexpected purchase error:', error)
                    console.error('Error occurred in purchase flow')
                    showNotification({
                      type: 'error',
                      message: `Purchase failed: ${error.message || 'Unknown error'}. Please try again or contact support.`,
                    })
                  }
                }
              } else {
                setSubscriptionModal(true)
              }
            }}
          >
            Upgrade
          </Button>

          {userProfile?.subscription === 'active' && (
            <Button
              sx={{
                width: '110px',
                mb: 1,
                ms: 1,
              }}
              variant='outlined'
              color='danger'
              onClick={() => {
                setNativeCancelModal(true)
              }}
            >
              Cancel
            </Button>
          )}
        </Box>
        {import.meta.env.VITE_IS_SELF_HOSTED === 'true' && (
          <Box>
            <Typography level='title-md' mb={1}>
              Password :
            </Typography>
            <Typography mb={1} level='body-sm'></Typography>
            <Button
              variant='soft'
              onClick={() => {
                setChangePasswordModal(true)
              }}
            >
              Change Password
            </Button>
            {changePasswordModal ? (
              <PassowrdChangeModal
                isOpen={changePasswordModal}
                onClose={({ currentPassword, password } = {}) => {
                  if (password && currentPassword) {
                    UpdatePassword(currentPassword, password).then(resp => {
                      if (resp.ok) {
                        showNotification({
                          type: 'success',
                          message: 'Password changed successfully',
                        })
                      } else if (resp.status === 403) {
                        showNotification({
                          type: 'error',
                          message: 'Current password is incorrect',
                        })
                      } else {
                        showNotification({
                          type: 'error',
                          message: 'Password change failed',
                        })
                      }
                    })
                  }
                  setChangePasswordModal(false)
                }}
              />
            ) : null}
          </Box>
        )}

        <Box>
          <Typography level='title-md' mb={1} color='danger'>
            Danger Zone
          </Typography>
          <Typography level='body-sm' mb={2} color='neutral'>
            Once you delete your account, there is no going back. Please be
            certain.
          </Typography>
          <Button
            variant='outlined'
            color='danger'
            onClick={() => setUserDeletionModal(true)}
          >
            Delete Account
          </Button>
        </Box>
      </div>
      <NotificationSetting />
      <MFASettings />
      <APITokenSettings />
      <StorageSettings />
      <div className='grid gap-4 py-4' id='sidepanel'>
        <Typography level='h3'>Sidepanel Customization</Typography>
        <Divider />
        <Typography level='body-md'>
          Customize the layout and visibility of cards in the sidepanel. the
          section only available on large screen devices such as tablets and
          desktops..
        </Typography>
        <SidepanelSettings />
      </div>

      <div className='grid gap-4 py-4' id='theme'>
        <Typography level='h3'>Theme preferences</Typography>
        <Divider />
        <Typography level='body-md'>
          Choose how the site looks to you. Select a single theme, or sync with
          your system and automatically switch between day and night themes.
        </Typography>
        <ThemeToggle />
      </div>

      <div className='grid gap-4 py-4' id='localization'>
        <Typography level='h3'>Localization</Typography>
        <Divider />
        <Typography level='body-md'>
          Customize language, date format, and regional preferences for your
          account. These settings will apply throughout the application.
        </Typography>
        <LocalizationSettings />
      </div>

      {/* Modals */}
      {confirmModalConfig?.isOpen && (
        <ConfirmationModal config={confirmModalConfig} />
      )}

      <SubscriptionModal
        open={subscriptionModal}
        onClose={() => setSubscriptionModal(false)}
      />

      <UserDeletionModal
        isOpen={userDeletionModal}
        onClose={success => {
          setUserDeletionModal(false)
          if (success) {
            showNotification({
              type: 'success',
              message: 'Account deleted successfully',
            })
          }
        }}
        userProfile={userProfile}
      />

      <NativeCancelSubscriptionModal
        isOpen={nativeCancelModal}
        onClose={action => {
          setNativeCancelModal(false)
          if (action === 'desktop') {
            CancelSubscription().then(resp => {
              if (resp.ok) {
                showNotification({
                  type: 'success',
                  message: 'Subscription cancelled',
                })
                window.location.reload()
              } else {
                showNotification({
                  type: 'error',
                  message: 'Failed to cancel subscription',
                })
              }
            })
          }
        }}
      />
    </Container>
  )
}

export default Settings

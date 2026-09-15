import { Capacitor } from '@capacitor/core'
import { Box, Button, Typography } from '@mui/joy'
import { Purchases } from '@revenuecat/purchases-capacitor'
import { useQueryClient } from '@tanstack/react-query'
import moment from 'moment'
import { useEffect, useState } from 'react'

import AccountIdentityCard from '../../components/settings/AccountIdentityCard'
import AccountSessionsCard from '../../components/settings/AccountSessionsCard'
import SettingsQueryStateView from '../../components/settings/SettingsQueryStateView'
import SubscriptionModal from '../../components/SubscriptionModal'
import { useLocalization } from '../../contexts/LocalizationContext'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import { useNotification } from '../../service/NotificationProvider'
import { formStackSx } from '../../theme/appLayout'
import { CancelSubscription, UpdatePassword } from '../../utils/Fetcher'
import {
  resolveSettingsQueryState,
  SETTINGS_QUERY_STATE,
} from '../../utils/SettingsQueryState'
import LoadingComponent from '../components/Loading'
import NativeCancelSubscriptionModal from '../Modals/Inputs/NativeCancelSubscriptionModal'
import PassowrdChangeModal from '../Modals/Inputs/PasswordChangeModal'
import UserDeletionModal from '../Modals/Inputs/UserDeletionModal'
import SettingsLayout from './SettingsLayout'

const AccountSettings = () => {
  const { data: userProfile, error, isLoading, refetch } = useUserProfile()
  const { data: membersData } = useCircleMembers()
  const circleMembers = membersData?.res || []
  const profileState = resolveSettingsQueryState({
    isLoading,
    isError: Boolean(error),
    hasData: Boolean(userProfile),
  })
  const queryClient = useQueryClient()
  const { showNotification } = useNotification()
  const { fmt } = useLocalization()

  const [changePasswordModal, setChangePasswordModal] = useState(false)
  const [subscriptionModal, setSubscriptionModal] = useState(false)
  const [userDeletionModal, setUserDeletionModal] = useState(false)
  const [nativeCancelModal, setNativeCancelModal] = useState(false)

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

  const getSubscriptionDetails = () => {
    if (userProfile?.subscription === 'active') {
      return `You are currently subscribed to the Plus plan. Your subscription will renew on ${fmt.date(userProfile?.expiration)}.`
    } else if (userProfile?.subscription === 'cancelled') {
      return `You have cancelled your subscription. Your account will be downgraded to the Free plan on ${fmt.date(userProfile?.expiration)}.`
    } else {
      return `You are currently on the Free plan. Upgrade to the Plus plan to unlock more features.`
    }
  }

  const getSubscriptionStatus = () => {
    if (userProfile?.subscription === 'active') {
      return `Plus`
    } else if (userProfile?.subscription === 'cancelled') {
      if (moment().isBefore(userProfile?.expiration)) {
        return `Plus(until ${fmt.date(userProfile?.expiration)})`
      }
      return `Free`
    } else {
      return `Free`
    }
  }

  if (profileState === SETTINGS_QUERY_STATE.LOADING) {
    return (
      <SettingsLayout title='Account Settings'>
        <LoadingComponent />
      </SettingsLayout>
    )
  }

  if (profileState === SETTINGS_QUERY_STATE.ERROR) {
    return (
      <SettingsLayout title='Account Settings'>
        <SettingsQueryStateView
          onRetry={() => refetch()}
          description={error?.message}
        />
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout title='Account Settings'>
      <Box sx={formStackSx}>
        <Typography level='body-md'>
          Change your account settings, type or update your password
        </Typography>
        <AccountIdentityCard
          profile={userProfile}
          circleMembers={circleMembers}
        />
        <Typography level='title-md' mb={-1}>
          Account Type : {getSubscriptionStatus()}
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

                  const { customerInfo } = await Purchases.getCustomerInfo()
                  if (customerInfo.entitlements.active['Dydan Plus']) {
                    queryClient.invalidateQueries(['userProfile'])
                    queryClient.refetchQueries(['userProfile'])
                    showNotification({
                      type: 'success',
                      message:
                        'Purchase successful! Please restart the app to access Plus features.',
                    })
                  }
                } catch (error) {
                  console.log('Purchase error:', error)

                  if (error.code === '1') {
                    return
                  } else if (error.code === '2') {
                    showNotification({
                      type: 'error',
                      message:
                        'Store connection issue. Please check your network and try again.',
                    })
                  } else if (error.code === '3') {
                    showNotification({
                      type: 'error',
                      message:
                        'Purchases are not allowed on this device. Please check your device restrictions.',
                    })
                  } else if (error.code === '4') {
                    showNotification({
                      type: 'error',
                      message:
                        'This subscription is not available. Please try again later.',
                    })
                  } else if (error.code === '5') {
                    showNotification({
                      type: 'error',
                      message:
                        'This purchase has already been processed. If you believe this is an error, please contact support.',
                    })
                  } else if (error.code === '6') {
                    showNotification({
                      type: 'error',
                      message:
                        'Purchase receipt missing. Please try purchasing again.',
                    })
                  } else if (error.code === '7') {
                    showNotification({
                      type: 'error',
                      message:
                        'Network error. Please check your connection and try again.',
                    })
                  } else if (error.code === '8') {
                    showNotification({
                      type: 'error',
                      message:
                        'Invalid purchase receipt. Please contact support if this persists.',
                    })
                  } else if (error.code === '9') {
                    showNotification({
                      type: 'warning',
                      message:
                        'Payment is pending approval. You will receive access once approved.',
                    })
                  } else {
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

        <AccountSessionsCard userId={userProfile?.id} />

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
      </Box>

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
    </SettingsLayout>
  )
}

export default AccountSettings

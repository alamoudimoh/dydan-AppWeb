import { Capacitor } from '@capacitor/core'
import { Box, Button, Typography } from '@mui/joy'
import { Purchases } from '@revenuecat/purchases-capacitor'
import { useQueryClient } from '@tanstack/react-query'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import SettingsQueryStateView from '../../components/settings/SettingsQueryStateView'
import SubscriptionModal from '../../components/SubscriptionModal'
import { useLocalization } from '../../contexts/LocalizationContext'
import { useUserProfile } from '../../queries/UserQueries'
import { useNotification } from '../../service/NotificationProvider'
import { formStackSx } from '../../theme/appLayout'
import { CancelSubscription } from '../../utils/Fetcher'
import {
  resolveSettingsQueryState,
  SETTINGS_QUERY_STATE,
} from '../../utils/SettingsQueryState'
import LoadingComponent from '../components/Loading'
import NativeCancelSubscriptionModal from '../Modals/Inputs/NativeCancelSubscriptionModal'
import SettingsLayout from './SettingsLayout'

const AccountSettings = () => {
  const { t } = useTranslation('settings')
  const { data: userProfile, error, isLoading, refetch } = useUserProfile()
  const profileState = resolveSettingsQueryState({
    isLoading,
    isError: Boolean(error),
    hasData: Boolean(userProfile),
  })
  const queryClient = useQueryClient()
  const { showNotification } = useNotification()
  const { fmt } = useLocalization()

  const [subscriptionModal, setSubscriptionModal] = useState(false)
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

  if (profileState === SETTINGS_QUERY_STATE.LOADING) {
    return (
      <SettingsLayout title={t('accountSettings.subscription')}>
        <LoadingComponent />
      </SettingsLayout>
    )
  }

  if (profileState === SETTINGS_QUERY_STATE.ERROR) {
    return (
      <SettingsLayout title={t('accountSettings.subscription')}>
        <SettingsQueryStateView
          onRetry={() => refetch()}
          description={error?.message}
        />
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout title={t('accountSettings.subscription')}>
      <Box sx={formStackSx}>
        <Typography level='body-md'>
          {t('accountSettings.subscriptionDescription')}
        </Typography>
        <Typography level='title-md' mb={-1}>
          {t('accountSettings.subscriptionStatus')} : {getSubscriptionStatus()}
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
            {t('accountSettings.upgrade')}
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
              {t('accountSettings.cancel')}
            </Button>
          )}
        </Box>
      </Box>

      <SubscriptionModal
        open={subscriptionModal}
        onClose={() => setSubscriptionModal(false)}
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

import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

export const DAYDAN_FCM_CHANNEL_ID = 'daydan_notifications'
export const LEGACY_DONETICK_FCM_CHANNEL_ID = 'donetick_notifications'

const ANDROID_PUSH_CHANNELS = Object.freeze([
  {
    id: DAYDAN_FCM_CHANNEL_ID,
    name: 'DayDan Notifications',
    description: 'Chore reminders, nudges, and other DayDan alerts',
    importance: 4,
    visibility: 1,
    vibration: true,
  },
  {
    id: LEGACY_DONETICK_FCM_CHANNEL_ID,
    name: 'DayDan Notifications',
    description: 'Legacy notification channel for already-installed clients',
    importance: 4,
    visibility: 1,
    vibration: true,
  },
])

export const ensureAndroidPushNotificationChannels = async () => {
  if (Capacitor.getPlatform() !== 'android') {
    return
  }

  for (const channel of ANDROID_PUSH_CHANNELS) {
    await PushNotifications.createChannel(channel)
  }
}

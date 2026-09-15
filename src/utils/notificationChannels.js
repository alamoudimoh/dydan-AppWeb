import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

export const DYDAN_FCM_CHANNEL_ID = 'dydan_notifications'

const ANDROID_PUSH_CHANNEL = Object.freeze({
  id: DYDAN_FCM_CHANNEL_ID,
  name: 'Dydan Notifications',
  description: 'Chore reminders, nudges, and other Dydan alerts',
  importance: 4,
  visibility: 1,
  vibration: true,
})

export const ensureAndroidPushNotificationChannels = async () => {
  if (Capacitor.getPlatform() !== 'android') {
    return
  }

  await PushNotifications.createChannel(ANDROID_PUSH_CHANNEL)
}

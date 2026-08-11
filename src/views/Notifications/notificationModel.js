export const notificationDestination = notification =>
  notification.entityType === 'chore'
    ? `/chores/${notification.entityId}`
    : notification.entityType === 'meter'
      ? '/meters'
      : notification.entityType === 'reward_request'
        ? '/rewards'
        : null

export const notificationColor = severity =>
  ({
    info: 'primary',
    warning: 'warning',
    danger: 'danger',
    success: 'success',
  })[severity] || 'neutral'

export const formatNotificationTime = (value, locale) =>
  new Intl.DateTimeFormat(locale || undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

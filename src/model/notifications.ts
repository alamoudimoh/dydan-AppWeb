import type { Notification, NotificationType } from '../data'
import type { ApiNotification } from './api'

export function mapNotificationType(
  type: string | undefined,
): NotificationType {
  const known: NotificationType[] = [
    'task_due',
    'task_assigned',
    'task_approved',
    'task_rejected',
    'reward_available',
    'reward_request',
    'goal_achieved',
    'streak_milestone',
    'circle_invite',
    'system',
  ]
  if (type && (known as string[]).includes(type))
    return type as NotificationType
  if (type === 'chore' || type === 'task') return 'task_assigned'
  return 'system'
}

export function toNotifications(list: ApiNotification[]): Notification[] {
  return list.map(n => ({
    id: String(n.id),
    type: mapNotificationType(n.type),
    title: n.title ?? n.type ?? 'Notification',
    body: n.body ?? n.message ?? '',
    isRead: n.readAt != null || n.isRead === true || n.read === true,
    timestamp: n.createdAt,
    actorId: undefined,
    entityType: n.entityType ?? undefined,
    entityId: n.entityId ?? undefined,
  }))
}

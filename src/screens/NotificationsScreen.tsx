import { useState } from 'react'

import { AppCtx, Icon } from '../App'
import type {
  Notification,
  NotificationType,
  Reward,
  RewardRequest,
} from '../data'
import { formatTimestamp } from '../data'
import { useRewardMutations } from '../hooks/useHousehold.js'
import { useLiveData } from '../model/liveData'
import { selectPendingRewardRequests } from '../model/rewardRequests'

const TYPE_META: Record<
  NotificationType,
  { icon: string; color: string; label: string }
> = {
  task_due: { icon: 'clock', color: 'var(--sig-over)', label: 'Task Due' },
  task_assigned: {
    icon: 'clipboard',
    color: 'var(--brand)',
    label: 'Assignment',
  },
  task_approved: { icon: 'check', color: 'var(--sig-done)', label: 'Approved' },
  task_rejected: { icon: 'x', color: 'var(--sig-over)', label: 'Rejected' },
  reward_available: { icon: 'gift', color: 'var(--sig-flag)', label: 'Reward' },
  reward_request: {
    icon: 'gift',
    color: 'var(--sig-flag)',
    label: 'Reward Request',
  },
  goal_achieved: { icon: 'star', color: 'var(--accent)', label: 'Goal' },
  streak_milestone: { icon: 'fire', color: 'var(--sig-due)', label: 'Streak' },
  circle_invite: { icon: 'users', color: 'var(--brand)', label: 'Invite' },
  system: { icon: 'bell', color: 'var(--t-muted)', label: 'System' },
}

type FilterMode = 'all' | 'unread'

type Props = {
  ctx: AppCtx
  readIds: Set<string>
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
}

export default function NotificationsScreen({
  ctx,
  onMarkAllRead,
  onMarkRead,
  readIds,
}: Props) {
  const { memberById, notifications, rewardRequests, rewards, tasks } =
    useLiveData()
  const rewardMutations = useRewardMutations()
  const [filter, setFilter] = useState<FilterMode>('all')

  const isRead = (n: Notification) => n.isRead || readIds.has(n.id)
  const unreadCount = notifications.filter(n => !isRead(n)).length

  const visible =
    filter === 'unread' ? notifications.filter(n => !isRead(n)) : notifications
  const pendingRewardRequests = selectPendingRewardRequests(rewardRequests)

  /**
   * Opening a notification marks it read and then navigates to the record the
   * server referenced. A notification with no resolvable target is simply
   * marked read — the UI never claims to have opened something it did not.
   */
  const handleNotifClick = (n: Notification) => {
    const wasUnread = !isRead(n)
    if (wasUnread) onMarkRead(n.id)

    if (n.entityType === 'chore' && n.entityId != null) {
      const task = tasks.find(t => t.id === String(n.entityId))
      if (task) {
        ctx.openTask(task)
        return
      }
      ctx.navigate('all-tasks')
      return
    }

    if (n.entityType === 'reward_request' && n.entityId != null) {
      ctx.navigate('rewards')
      return
    }

    ctx.showToast(wasUnread ? `Marked as read: ${n.title}` : n.title)
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 0 40px' }}>
      <div className='page-header pb-5'>
        <div>
          <h1
            className='text-primary'
            style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
          >
            Notifications
          </h1>
          <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </div>
        </div>
        {unreadCount > 0 && (
          <button className='btn btn-secondary' onClick={onMarkAllRead}>
            <Icon name='check' size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div className='px-4 md:px-7'>
        {/* Filter strip */}
        <div className='flex gap-2 mb-5'>
          {(['all', 'unread'] as FilterMode[]).map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all'
                ? 'All'
                : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className='empty-state'>
            <div style={{ fontSize: 48 }}>🔔</div>
            <div className='font-bold text-primary' style={{ fontSize: 16 }}>
              No unread notifications
            </div>
            <div className='text-muted' style={{ fontSize: 13 }}>
              You're all caught up. New notifications will appear here.
            </div>
          </div>
        ) : (
          <div
            className='flex flex-col'
            style={{
              borderRadius: 'var(--r-lg)',
              overflow: 'hidden',
              border: '1px solid var(--line)',
            }}
          >
            {visible.map((n, i) => {
              const meta = TYPE_META[n.type]
              const actor = n.actorId ? memberById(n.actorId) : null
              const read = isRead(n)
              const isLast = i === visible.length - 1

              return (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className='w-full flex items-start gap-4 px-5 py-4 text-start'
                  style={{
                    background: read
                      ? 'var(--surface)'
                      : 'color-mix(in srgb, var(--brand) 4%, var(--surface))',
                    border: 'none',
                    borderBottom: isLast ? 'none' : '1px solid var(--line)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-ui)',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Type icon */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      name={meta.icon}
                      size={16}
                      style={{ color: meta.color }}
                    />
                  </div>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 flex-wrap mb-0.5'>
                          {!read && (
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: 'var(--brand)',
                                display: 'inline-block',
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <span
                            className='font-bold text-primary'
                            style={{ fontSize: 13 }}
                          >
                            {n.title}
                          </span>
                          <span
                            className='badge'
                            style={{
                              background: `color-mix(in srgb, ${meta.color} 10%, transparent)`,
                              color: meta.color,
                              fontSize: 10,
                            }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div className='text-muted' style={{ fontSize: 13 }}>
                          {n.body}
                        </div>
                        {actor && (
                          <div className='flex items-center gap-1.5 mt-1.5'>
                            <div
                              className='avatar'
                              style={{
                                width: 18,
                                height: 18,
                                background: actor.avatarColor,
                                fontSize: 7,
                              }}
                            >
                              {actor.initials}
                            </div>
                            <span
                              className='text-faint'
                              style={{ fontSize: 11 }}
                            >
                              from {actor.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className='flex flex-col items-end gap-2 flex-shrink-0'>
                        <span className='text-faint' style={{ fontSize: 11 }}>
                          {formatTimestamp(n.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Live pending reward requests */}
        {pendingRewardRequests.length > 0 && ctx.persona !== 'child' && (
          <div className='card mt-4 overflow-hidden'>
            {pendingRewardRequests.map(
              (request: RewardRequest, index: number) => {
                const requester = memberById(request.requesterId)
                const reward = rewards.find(
                  (item: Reward) => item.id === request.rewardId,
                )
                const requesterName = requester?.name ?? 'A member'
                const rewardName = reward?.name ?? 'a reward'
                const busy =
                  rewardMutations.approveRequest.isPending ||
                  rewardMutations.rejectRequest.isPending

                return (
                  <div
                    key={request.id}
                    className='p-4 flex items-center gap-4'
                    style={{
                      borderBottom:
                        index === pendingRewardRequests.length - 1
                          ? 'none'
                          : '1px solid var(--line)',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--r-md)',
                        background: 'var(--sig-flag-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon
                        name='gift'
                        size={18}
                        style={{ color: 'var(--sig-flag)' }}
                      />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div
                        className='font-bold text-primary'
                        style={{ fontSize: 13 }}
                      >
                        Pending reward request
                      </div>
                      <div className='text-muted' style={{ fontSize: 12 }}>
                        {requesterName} has requested {rewardName}
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <button
                        className='btn btn-sm btn-secondary'
                        disabled={busy}
                        onClick={() =>
                          rewardMutations.rejectRequest.mutate(request.id, {
                            onSuccess: () =>
                              ctx.showToast('Reward request rejected'),
                            onError: (error: Error) =>
                              ctx.showToast(
                                error instanceof Error
                                  ? error.message
                                  : 'Could not reject reward request',
                              ),
                          })
                        }
                      >
                        Reject
                      </button>
                      <button
                        className='btn btn-sm btn-primary'
                        disabled={busy}
                        onClick={() =>
                          rewardMutations.approveRequest.mutate(request.id, {
                            onSuccess: () =>
                              ctx.showToast('Reward request approved'),
                            onError: (error: Error) =>
                              ctx.showToast(
                                error instanceof Error
                                  ? error.message
                                  : 'Could not approve reward request',
                              ),
                          })
                        }
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                )
              },
            )}
          </div>
        )}
      </div>
    </div>
  )
}

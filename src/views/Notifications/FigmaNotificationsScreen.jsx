/* ─────────────────────────────────────────────
   PE2 NotificationsScreen port. The inner
   NotificationsScreen component is a verbatim JS port of
   Dydan-AppWebProductExperience02/src/screens/NotificationsScreen.tsx
   (type-meta icons, read/unread filter, notification list,
   mark-all-read and pending reward request action row),
   rendered with PE2 fixture data (NOTIFICATIONS) through the
   shared pe2 task-store ctx. The route wrapper owns the local
   read-ids state so marking read is reflected immediately.
───────────────────────────────────────────── */
import { useState } from 'react'

import FigmaIcon from '../../components/FigmaIcon'
import {
  formatTimestamp,
  getMemberById,
  NOTIFICATIONS,
} from '../../pe2/fixtures'
import { ToastContainer, usePe2Tasks } from '../../pe2/pe2Ui'

const TYPE_META = {
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

function NotificationsScreen({ ctx, onMarkAllRead, onMarkRead, readIds }) {
  const [filter, setFilter] = useState('all')

  const isRead = n => n.isRead || readIds.has(n.id)
  const unreadCount = NOTIFICATIONS.filter(n => !isRead(n)).length

  const visible =
    filter === 'unread' ? NOTIFICATIONS.filter(n => !isRead(n)) : NOTIFICATIONS

  const handleNotifClick = n => {
    if (!isRead(n)) onMarkRead(n.id)
    ctx.showToast(`Opened: ${n.title}`)
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
            <FigmaIcon name='check' size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div className='px-4 md:px-7'>
        {/* Filter strip */}
        <div className='flex gap-2 mb-5'>
          {['all', 'unread'].map(f => (
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
              You&apos;re all caught up. New notifications will appear here.
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
              const actor = n.actorId ? getMemberById(n.actorId) : null
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
                    <FigmaIcon
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

        {/* Action row for reward requests */}
        {visible.some(n => n.type === 'reward_request' && !isRead(n)) &&
          ctx.persona !== 'child' && (
            <div className='card mt-4 p-4 flex items-center gap-4'>
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
                <FigmaIcon
                  name='gift'
                  size={18}
                  style={{ color: 'var(--sig-flag)' }}
                />
              </div>
              <div className='flex-1'>
                <div
                  className='font-bold text-primary'
                  style={{ fontSize: 13 }}
                >
                  Pending reward requests
                </div>
                <div className='text-muted' style={{ fontSize: 12 }}>
                  Liam has requested Takeaway Night — approve or reject
                </div>
              </div>
              <div className='flex gap-2'>
                <button
                  className='btn btn-sm btn-secondary'
                  onClick={() => ctx.showToast('Reward request rejected')}
                >
                  Reject
                </button>
                <button
                  className='btn btn-sm btn-primary'
                  onClick={() => ctx.showToast('Reward approved! 🎉')}
                >
                  Approve
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}

/* ─── Route wrapper ─────────────────────── */
const FigmaNotificationsScreen = () => {
  const { ctx, toasts } = usePe2Tasks()
  const [readIds, setReadIds] = useState(() => new Set())

  const markRead = id => setReadIds(prev => new Set(prev).add(id))
  const markAllRead = () => setReadIds(new Set(NOTIFICATIONS.map(n => n.id)))

  return (
    <>
      <NotificationsScreen
        ctx={ctx}
        readIds={readIds}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />
      {toasts.length > 0 && <ToastContainer toasts={toasts} />}
    </>
  )
}

export default FigmaNotificationsScreen

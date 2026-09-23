/* ─────────────────────────────────────────────
   PE2 RewardsScreen port. The inner RewardsScreen
   component is a verbatim JS port of
   Dydan-AppWebProductExperience02/src/screens/RewardsScreen.tsx
   (points banner, catalog / my-requests / points /
   pending-approval tabs), rendered with PE2 fixture data
   (REWARDS + REWARD_REQUESTS + MEMBERS + ACTIVITY) through
   the shared pe2 task-store ctx.
───────────────────────────────────────────── */
import { useState } from 'react'

import FigmaIcon from '../../components/FigmaIcon'
import {
  ACTIVITY,
  formatTimestamp,
  getMemberById,
  MEMBERS,
  REWARD_REQUESTS,
  REWARDS,
} from '../../pe2/fixtures'
import { ToastContainer, usePe2Tasks } from '../../pe2/pe2Ui'

function RewardsScreen({ ctx, isChild, isSolo }) {
  const isAdmin = ctx.persona === 'parent'
  const tabs = [
    { id: 'catalog', label: 'Rewards' },
    { id: 'my-requests', label: 'My Requests' },
    { id: 'points', label: 'Points' },
    ...(isAdmin ? [{ id: 'admin', label: 'Pending Approval' }] : []),
  ]

  const [activeTab, setActiveTab] = useState('catalog')
  const [redeemingId, setRedeemingId] = useState(null)

  const currentMember = isChild
    ? MEMBERS.find(m => m.role === 'child')
    : MEMBERS.find(m => m.isCurrentUser)
  const memberPoints = currentMember.points
  const myRequests = REWARD_REQUESTS.filter(
    r => r.requesterId === currentMember.id,
  )
  const pendingRequests = REWARD_REQUESTS.filter(r => r.status === 'pending')
  const pointsActivity = ACTIVITY.filter(
    a => a.type === 'points' || a.points != null,
  )

  const handleRedeem = rewardId => {
    setRedeemingId(rewardId)
    setTimeout(() => {
      setRedeemingId(null)
      ctx.showToast('Reward request submitted! Waiting for approval.')
    }, 800)
  }

  const statusMeta = status => {
    if (status === 'approved')
      return {
        color: 'var(--sig-done)',
        bg: 'var(--sig-done-bg)',
        label: 'Approved',
      }
    if (status === 'rejected')
      return {
        color: 'var(--sig-over)',
        bg: 'var(--sig-over-bg)',
        label: 'Rejected',
      }
    return {
      color: 'var(--sig-due)',
      bg: 'var(--sig-due-bg)',
      label: 'Pending',
    }
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 0 40px' }}>
      <div className='page-header pb-5'>
        <div>
          <h1
            className='text-primary'
            style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
          >
            Rewards
          </h1>
          <div className='text-muted' style={{ fontSize: 13, marginTop: 4 }}>
            Earn points, redeem rewards
          </div>
        </div>
        {isAdmin && !isSolo && (
          <button
            className='btn btn-primary'
            onClick={() => ctx.showToast('Create reward — coming soon')}
          >
            <FigmaIcon name='plus' size={14} />
            Add reward
          </button>
        )}
      </div>

      <div className='px-4 md:px-7'>
        {/* Points banner */}
        <div
          className='card mb-5 p-5'
          style={{
            background:
              'linear-gradient(135deg, var(--brand), color-mix(in srgb, var(--brand) 60%, var(--accent)))',
            border: 'none',
          }}
        >
          <div className='flex items-center justify-between flex-wrap gap-4'>
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: 4,
                }}
              >
                {currentMember.name}&apos;s Points
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: 'var(--brand-contrast)',
                  lineHeight: 1,
                }}
              >
                {memberPoints.toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.7)',
                  marginTop: 4,
                }}
              >
                points available
              </div>
            </div>
            <div className='flex gap-4'>
              {[
                { label: 'Earned', value: memberPoints + 200, icon: 'star' },
                { label: 'Redeemed', value: 200, icon: 'gift' },
                {
                  label: 'Streak',
                  value: `${currentMember.streak}d`,
                  icon: 'fire',
                },
              ].map(stat => (
                <div key={stat.label} className='text-center'>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: 'var(--brand-contrast)',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.7)',
                      marginTop: 2,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className='flex gap-1 mb-5 p-1 rounded-lg'
          style={{
            background: 'var(--surface-2)',
            borderRadius: 'var(--r-md)',
          }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className='flex-1 py-2 font-semibold relative'
              style={{
                background:
                  activeTab === tab.id ? 'var(--surface)' : 'transparent',
                color:
                  activeTab === tab.id ? 'var(--t-primary)' : 'var(--t-muted)',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 'var(--r-sm)',
                fontSize: 13,
                fontFamily: 'var(--font-ui)',
                boxShadow: activeTab === tab.id ? 'var(--shadow-xs)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
              {tab.id === 'admin' && pendingRequests.length > 0 && (
                <span
                  className='absolute top-1 end-2 w-4 h-4 rounded-full text-center font-bold'
                  style={{
                    fontSize: 9,
                    lineHeight: '16px',
                    background: 'var(--sig-over)',
                    color: '#fff',
                  }}
                >
                  {pendingRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Catalog tab */}
        {activeTab === 'catalog' && (
          <div
            className='grid gap-4'
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            }}
          >
            {REWARDS.map(reward => {
              const canAfford = memberPoints >= reward.pointsCost
              const isRedeeming = redeemingId === reward.id
              return (
                <div key={reward.id} className='card p-5 flex flex-col gap-3'>
                  <div className='flex items-start justify-between'>
                    <div style={{ fontSize: 36, lineHeight: 1 }}>
                      {reward.icon}
                    </div>
                    <span
                      className='badge'
                      style={{
                        background: canAfford
                          ? 'var(--sig-done-bg)'
                          : 'var(--surface-2)',
                        color: canAfford ? 'var(--sig-done)' : 'var(--t-muted)',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {reward.pointsCost} pts
                    </span>
                  </div>
                  <div>
                    <div
                      className='font-bold text-primary'
                      style={{ fontSize: 15 }}
                    >
                      {reward.name}
                    </div>
                    {reward.description && (
                      <div className='text-muted mt-1' style={{ fontSize: 12 }}>
                        {reward.description}
                      </div>
                    )}
                  </div>
                  {reward.forMemberId &&
                    (() => {
                      const m = getMemberById(reward.forMemberId)
                      return m ? (
                        <div className='flex items-center gap-1.5'>
                          <div
                            className='avatar'
                            style={{
                              width: 18,
                              height: 18,
                              background: m.avatarColor,
                              fontSize: 7,
                            }}
                          >
                            {m.initials}
                          </div>
                          <span className='text-faint' style={{ fontSize: 11 }}>
                            For {m.name}
                          </span>
                        </div>
                      ) : null
                    })()}
                  <button
                    className={`btn btn-sm ${canAfford ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={!canAfford || isRedeeming}
                    onClick={() => canAfford && handleRedeem(reward.id)}
                    style={{ marginTop: 'auto', opacity: canAfford ? 1 : 0.5 }}
                  >
                    {isRedeeming ? (
                      <>
                        <FigmaIcon name='refresh' size={13} />
                        Requesting…
                      </>
                    ) : canAfford ? (
                      <>
                        <FigmaIcon name='gift' size={13} />
                        Redeem
                      </>
                    ) : (
                      <>
                        <FigmaIcon name='lock' size={13} />
                        Not enough points
                      </>
                    )}
                  </button>
                </div>
              )
            })}
            {isAdmin && (
              <button
                className='card p-5 flex flex-col items-center justify-center gap-3 cursor-pointer'
                style={{
                  border: '2px dashed var(--line)',
                  minHeight: 180,
                  background: 'transparent',
                }}
                onClick={() => ctx.showToast('Create reward — coming soon')}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--brand-faint)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FigmaIcon
                    name='plus'
                    size={22}
                    style={{ color: 'var(--brand)' }}
                  />
                </div>
                <span
                  className='font-semibold'
                  style={{ color: 'var(--brand)', fontSize: 13 }}
                >
                  New reward
                </span>
              </button>
            )}
          </div>
        )}

        {/* My requests tab */}
        {activeTab === 'my-requests' && (
          <div>
            {myRequests.length === 0 ? (
              <div className='empty-state'>
                <div style={{ fontSize: 48 }}>🎁</div>
                <div className='font-bold text-primary'>No requests yet</div>
                <div className='text-muted' style={{ fontSize: 13 }}>
                  Redeem rewards from the catalog to see them here.
                </div>
              </div>
            ) : (
              <div className='flex flex-col gap-3'>
                {myRequests.map(req => {
                  const reward = REWARDS.find(r => r.id === req.rewardId)
                  const resolver = req.resolvedById
                    ? getMemberById(req.resolvedById)
                    : null
                  const meta = statusMeta(req.status)
                  if (!reward) return null
                  return (
                    <div
                      key={req.id}
                      className='card p-4 flex items-center gap-4'
                    >
                      <div style={{ fontSize: 28, lineHeight: 1 }}>
                        {reward.icon}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div
                          className='font-bold text-primary'
                          style={{ fontSize: 14 }}
                        >
                          {reward.name}
                        </div>
                        <div className='text-muted' style={{ fontSize: 12 }}>
                          {reward.pointsCost} pts · Requested{' '}
                          {formatTimestamp(req.requestedAt)}
                        </div>
                        {resolver && req.resolvedAt && (
                          <div
                            className='text-faint mt-1'
                            style={{ fontSize: 11 }}
                          >
                            {req.status === 'approved'
                              ? 'Approved'
                              : 'Rejected'}{' '}
                            by {resolver.name} ·{' '}
                            {formatTimestamp(req.resolvedAt)}
                          </div>
                        )}
                      </div>
                      <div className='flex items-center gap-2'>
                        <span
                          className='badge'
                          style={{
                            background: meta.bg,
                            color: meta.color,
                            fontSize: 11,
                          }}
                        >
                          {meta.label}
                        </span>
                        {req.status === 'pending' && (
                          <button
                            className='btn btn-sm btn-ghost'
                            style={{ color: 'var(--sig-over)' }}
                            onClick={() => ctx.showToast('Request cancelled')}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Points history tab */}
        {activeTab === 'points' && (
          <div>
            <div
              className='grid gap-3 mb-5'
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              }}
            >
              {MEMBERS.map(m => (
                <div key={m.id} className='card p-4'>
                  <div className='flex items-center gap-2 mb-3'>
                    <div
                      className='avatar'
                      style={{
                        width: 28,
                        height: 28,
                        background: m.avatarColor,
                        fontSize: 10,
                      }}
                    >
                      {m.initials}
                    </div>
                    <div>
                      <div
                        className='font-semibold text-primary'
                        style={{ fontSize: 13 }}
                      >
                        {m.name}
                      </div>
                      <div className='text-faint' style={{ fontSize: 10 }}>
                        {m.role}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: 'var(--brand)',
                    }}
                  >
                    {m.points.toLocaleString()}
                  </div>
                  <div className='text-faint' style={{ fontSize: 11 }}>
                    points available
                  </div>
                  <div className='progress-track mt-3' style={{ height: 5 }}>
                    <div
                      className='progress-fill'
                      style={{
                        width: `${Math.min((m.points / 1500) * 100, 100)}%`,
                        background: m.avatarColor,
                      }}
                    />
                  </div>
                  {isAdmin && m.id !== currentMember.id && (
                    <button
                      className='btn btn-sm btn-ghost mt-3 w-full'
                      onClick={() =>
                        ctx.showToast(`Reset ${m.name}'s points — confirm`)
                      }
                    >
                      Reset points
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <div className='section-label mb-3'>Points history</div>
              {pointsActivity.length === 0 ? (
                <div className='empty-state'>
                  <div style={{ fontSize: 40 }}>⭐</div>
                  <div className='font-bold text-primary'>
                    No points activity yet
                  </div>
                </div>
              ) : (
                <div className='flex flex-col gap-1'>
                  {pointsActivity.map(item => {
                    const actor = getMemberById(item.actorId)
                    return (
                      <div
                        key={item.id}
                        className='flex items-center gap-3 p-3 rounded-lg'
                        style={{
                          background: 'var(--surface-2)',
                          borderRadius: 'var(--r-md)',
                        }}
                      >
                        {actor && (
                          <div
                            className='avatar'
                            style={{
                              width: 26,
                              height: 26,
                              background: actor.avatarColor,
                              fontSize: 9,
                            }}
                          >
                            {actor.initials}
                          </div>
                        )}
                        <span
                          className='flex-1 text-primary'
                          style={{ fontSize: 13 }}
                        >
                          {item.text}
                        </span>
                        {item.points != null && (
                          <span
                            className='badge'
                            style={{
                              background: 'var(--sig-done-bg)',
                              color: 'var(--sig-done)',
                              fontWeight: 700,
                            }}
                          >
                            +{item.points}
                          </span>
                        )}
                        <span className='text-faint' style={{ fontSize: 11 }}>
                          {formatTimestamp(item.timestamp)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin: pending approval tab */}
        {activeTab === 'admin' && isAdmin && (
          <div>
            {pendingRequests.length === 0 ? (
              <div className='empty-state'>
                <div style={{ fontSize: 48 }}>✅</div>
                <div className='font-bold text-primary'>
                  No pending requests
                </div>
                <div className='text-muted' style={{ fontSize: 13 }}>
                  All reward requests have been reviewed.
                </div>
              </div>
            ) : (
              <div className='flex flex-col gap-3'>
                {pendingRequests.map(req => {
                  const reward = REWARDS.find(r => r.id === req.rewardId)
                  const requester = getMemberById(req.requesterId)
                  if (!reward || !requester) return null
                  return (
                    <div key={req.id} className='card p-5'>
                      <div className='flex items-start gap-4'>
                        <div style={{ fontSize: 32, lineHeight: 1 }}>
                          {reward.icon}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div
                            className='font-bold text-primary mb-1'
                            style={{ fontSize: 15 }}
                          >
                            {reward.name}
                          </div>
                          <div className='text-muted' style={{ fontSize: 12 }}>
                            {reward.description}
                          </div>
                          <div className='flex items-center gap-3 mt-2 flex-wrap'>
                            <div className='flex items-center gap-1.5'>
                              <div
                                className='avatar'
                                style={{
                                  width: 20,
                                  height: 20,
                                  background: requester.avatarColor,
                                  fontSize: 8,
                                }}
                              >
                                {requester.initials}
                              </div>
                              <span
                                className='text-muted'
                                style={{ fontSize: 12 }}
                              >
                                Requested by {requester.name}
                              </span>
                            </div>
                            <span
                              className='badge'
                              style={{
                                background: 'var(--sig-due-bg)',
                                color: 'var(--sig-due)',
                              }}
                            >
                              {reward.pointsCost} pts · {requester.name} has{' '}
                              {requester.points} pts
                            </span>
                          </div>
                          <div
                            className='text-faint mt-1'
                            style={{ fontSize: 11 }}
                          >
                            {formatTimestamp(req.requestedAt)}
                          </div>
                        </div>
                        <div className='flex flex-col gap-2'>
                          <button
                            className='btn btn-sm btn-primary'
                            onClick={() =>
                              ctx.showToast(
                                `Reward approved for ${requester.name}! 🎉`,
                              )
                            }
                          >
                            Approve
                          </button>
                          <button
                            className='btn btn-sm btn-ghost'
                            style={{ color: 'var(--sig-over)' }}
                            onClick={() => ctx.showToast('Request rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Route wrapper ─────────────────────── */
const FigmaRewardsScreen = () => {
  const { ctx, toasts } = usePe2Tasks()

  return (
    <>
      <RewardsScreen ctx={ctx} isChild={false} isSolo={false} />
      {toasts.length > 0 && <ToastContainer toasts={toasts} />}
    </>
  )
}

export default FigmaRewardsScreen

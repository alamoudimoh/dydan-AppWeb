import { useEffect, useRef, useState } from 'react'

import { AppCtx, Icon } from '../App'
import IconPicker from '../components/IconPicker'
import MemberMultiPicker from '../components/MemberMultiPicker'
import type { Reward, RewardRequest } from '../data'
import { formatTimestamp } from '../data'
import { useRewardMutations } from '../hooks/useHousehold'
import { useLiveData } from '../model/liveData'

type TabId = 'catalog' | 'my-requests' | 'points' | 'admin'
type RewardDraft = {
  name: string
  description: string
  icon: string
  pointsCost: string
  forMemberIds: string[]
  everyone: boolean
}
const blankReward = (): RewardDraft => ({
  name: '',
  description: '',
  icon: '🎁',
  pointsCost: '100',
  forMemberIds: [],
  everyone: true,
})

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

type Props = {
  ctx: AppCtx
  isChild: boolean
  isSolo: boolean
}

export default function RewardsScreen({
  ctx,
  isChild,
  isSolo: _isSolo,
}: Props) {
  const isAdmin = ctx.persona === 'parent'
  const {
    activity,
    currentUser,
    memberById,
    members,
    rewardRequests,
    rewards,
  } = useLiveData()
  const rewMutations = useRewardMutations()
  const tabs: { id: TabId; label: string }[] = [
    { id: 'catalog', label: 'Rewards' },
    { id: 'my-requests', label: 'My Requests' },
    { id: 'points', label: 'Points' },
    ...(isAdmin ? [{ id: 'admin' as TabId, label: 'Pending Approval' }] : []),
  ]

  const [activeTab, setActiveTab] = useState<TabId>('catalog')
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
  const [rewardItems, setRewardItems] = useState<Reward[]>([])
  const [requests, setRequests] = useState<RewardRequest[]>([])
  const seededRef = useRef(false)
  useEffect(() => {
    if (seededRef.current) return
    if (rewards.length || rewardRequests.length) {
      seededRef.current = true
      setRewardItems(rewards)
      setRequests(rewardRequests)
    }
  }, [rewards, rewardRequests])
  const [inactiveRewardIds, setInactiveRewardIds] = useState<Set<string>>(
    new Set(),
  )
  const [deletedRewardIds, setDeletedRewardIds] = useState<Set<string>>(
    new Set(),
  )
  const [editorId, setEditorId] = useState<string | null | undefined>(undefined)
  const [form, setForm] = useState<RewardDraft>(blankReward)
  const catalog = rewardItems.filter(r => !deletedRewardIds.has(r.id))

  const currentMember = isChild
    ? (members.find(m => m.role === 'child') ?? members[0])
    : (currentUser ?? members[0])
  if (!currentMember) return null // member data not loaded yet
  const memberPoints = currentMember.points
  const myRequests = requests.filter(r => r.requesterId === currentMember.id)
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const pointsActivity = activity.filter(
    a => a.type === 'points' || a.points != null,
  )

  const startNew = () => {
    setActiveTab('catalog')
    setForm(blankReward())
    setEditorId(null)
  }

  const startModify = (reward: Reward) => {
    setActiveTab('catalog')
    setForm({
      name: reward.name,
      description: reward.description ?? '',
      icon: reward.icon,
      pointsCost: String(reward.pointsCost),
      forMemberIds:
        reward.forMemberIds ?? (reward.forMemberId ? [reward.forMemberId] : []),
      everyone: !reward.forMemberIds?.length && !reward.forMemberId,
    })
    setEditorId(reward.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveReward = () => {
    const cost = Number(form.pointsCost)
    if (
      !form.name.trim() ||
      !Number.isFinite(cost) ||
      !Number.isInteger(cost) ||
      cost <= 0 ||
      cost % 5 !== 0
    ) {
      ctx.showToast('Enter a name and a points cost in increments of 5')
      return
    }
    if (!form.everyone && form.forMemberIds.length === 0) {
      ctx.showToast('Select at least one eligible member or everyone')
      return
    }
    const values = {
      name: form.name.trim(),
      description: form.description.trim(),
      icon: form.icon.trim() || '🎁',
      pointsCost: cost,
      forMemberIds: form.everyone ? [] : form.forMemberIds,
      forMemberId: undefined,
    }
    if (editorId) {
      setRewardItems(prev =>
        prev.map(r => (r.id === editorId ? { ...r, ...values } : r)),
      )
      rewMutations.updateReward.mutate({
        id: editorId,
        name: values.name,
        description: values.description,
        costPoints: values.pointsCost,
      })
      ctx.showToast('Reward modified')
    } else {
      setRewardItems(prev => [...prev, { id: `reward-${makeId()}`, ...values }])
      rewMutations.createReward.mutate({
        name: values.name,
        description: values.description,
        costPoints: values.pointsCost,
      })
      ctx.showToast('Reward created')
    }
    setEditorId(undefined)
  }

  const toggleRewardActive = (reward: Reward) => {
    if (inactiveRewardIds.has(reward.id)) {
      setInactiveRewardIds(prev => {
        const next = new Set(prev)
        next.delete(reward.id)
        return next
      })
      ctx.showToast('Reward activated')
    } else {
      ctx.showConfirm({
        title: 'Deactivate reward?',
        message: `"${reward.name}" will be visible but cannot be redeemed until reactivated.`,
        confirmLabel: 'Deactivate',
        onConfirm: () => {
          setInactiveRewardIds(prev => new Set([...prev, reward.id]))
          ctx.showToast('Reward deactivated')
        },
      })
    }
  }

  const deleteReward = (reward: Reward) =>
    ctx.showConfirm({
      title: 'Delete reward?',
      message: `Delete "${reward.name}" from the reward catalog? Existing request records are retained.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        setDeletedRewardIds(prev => new Set([...prev, reward.id]))
        setInactiveRewardIds(prev => {
          const next = new Set(prev)
          next.delete(reward.id)
          return next
        })
        if (editorId === reward.id) setEditorId(undefined)
        ctx.showToast('Reward deleted')
      },
    })

  const isEligible = (reward: Reward) => {
    const members =
      reward.forMemberIds ?? (reward.forMemberId ? [reward.forMemberId] : [])
    return members.length === 0 || members.includes(currentMember.id)
  }

  const handleRedeem = (rewardId: string) => {
    const reward = catalog.find(r => r.id === rewardId)
    if (
      !reward ||
      inactiveRewardIds.has(rewardId) ||
      !isEligible(reward) ||
      currentMember.points < reward.pointsCost
    )
      return
    setRedeemingId(rewardId)
    setRequests(prev => [
      ...prev,
      {
        id: `request-${makeId()}`,
        rewardId,
        requesterId: currentMember.id,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      },
    ])
    rewMutations.requestReward.mutate(Number(reward.id))
    setRedeemingId(null)
    ctx.showToast('Reward request submitted for approval')
  }

  const resolveRequest = (id: string, status: 'approved' | 'rejected') => {
    const now = new Date().toISOString()
    setRequests(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, status, resolvedAt: now, resolvedById: currentMember.id }
          : r,
      ),
    )
    if (status === 'approved') {
      rewMutations.approveRequest.mutate(Number(id))
    } else {
      rewMutations.rejectRequest.mutate(Number(id))
    }
    ctx.showToast(
      status === 'approved' ? 'Request approved' : 'Request rejected',
    )
  }

  const formatRequestDate = (stamp: string) =>
    new Date(stamp).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  const statusMeta = (status: string) => {
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
        {isAdmin && (
          <button className='btn btn-primary' onClick={startNew}>
            <Icon name='plus' size={14} />
            New reward
          </button>
        )}
      </div>

      <div className='px-4 md:px-7'>
        {isAdmin && editorId !== undefined && (
          <div className='card p-5 mb-5'>
            <div className='flex items-center justify-between mb-4'>
              <div className='form-title text-primary' style={{ fontSize: 16 }}>
                {editorId ? 'Modify reward' : 'New reward'}
              </div>
              <button
                className='btn btn-ghost btn-icon'
                onClick={() => setEditorId(undefined)}
                aria-label='Close editor'
              >
                <Icon name='x' size={16} />
              </button>
            </div>
            <div className='grid gap-4'>
              <div className='reward-primary-fields'>
                <label className='flex flex-col gap-1.5 min-w-0'>
                  <span className='section-label' style={{ padding: 0 }}>
                    REWARD NAME
                  </span>
                  <input
                    className='input field-md'
                    autoFocus
                    value={form.name}
                    onChange={e =>
                      setForm(previous => ({
                        ...previous,
                        name: e.target.value,
                      }))
                    }
                    placeholder='reward name'
                  />
                </label>
                <div className='reward-icon-field flex flex-col gap-1.5 min-w-0'>
                  <span className='section-label' style={{ padding: 0 }}>
                    ICON
                  </span>
                  <IconPicker
                    value={form.icon}
                    onChange={icon =>
                      setForm(previous => ({ ...previous, icon }))
                    }
                    label='Reward icon'
                  />
                </div>
              </div>
              <div className='reward-secondary-fields'>
                <label className='flex flex-col gap-1.5'>
                  <span className='section-label' style={{ padding: 0 }}>
                    POINTS COST
                  </span>
                  <input
                    className='input field-md'
                    type='number'
                    min='5'
                    step='5'
                    value={form.pointsCost}
                    onChange={e =>
                      setForm(previous => ({
                        ...previous,
                        pointsCost: e.target.value,
                      }))
                    }
                  />
                </label>
                <div className='flex flex-col gap-2'>
                  <span className='section-label' style={{ padding: 0 }}>
                    ELIGIBLE MEMBERS
                  </span>
                  <div
                    role='group'
                    aria-label='Reward eligibility'
                    className='flex gap-2'
                  >
                    <button
                      type='button'
                      className='btn btn-secondary btn-sm choice-option'
                      aria-pressed={form.everyone}
                      onClick={() =>
                        setForm(previous => ({ ...previous, everyone: true }))
                      }
                    >
                      everyone
                    </button>
                    <button
                      type='button'
                      className='btn btn-secondary btn-sm choice-option'
                      aria-pressed={!form.everyone}
                      onClick={() =>
                        setForm(previous => ({ ...previous, everyone: false }))
                      }
                    >
                      specific members
                    </button>
                  </div>
                  {!form.everyone && (
                    <MemberMultiPicker
                      label='Eligible members'
                      value={form.forMemberIds}
                      onChange={forMemberIds =>
                        setForm(previous => ({ ...previous, forMemberIds }))
                      }
                    />
                  )}
                </div>
              </div>
              <label className='flex flex-col gap-1.5'>
                <span className='section-label' style={{ padding: 0 }}>
                  DESCRIPTION
                </span>
                <textarea
                  className='input'
                  rows={2}
                  value={form.description}
                  onChange={e =>
                    setForm(previous => ({
                      ...previous,
                      description: e.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <div className='flex gap-2 mt-5'>
              <button className='btn btn-primary' onClick={saveReward}>
                {editorId ? 'Save changes' : 'Create reward'}
              </button>
              <button
                className='btn btn-secondary'
                onClick={() => setEditorId(undefined)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Points banner */}
        <div
          className='card mb-5 p-5'
          style={{ background: 'var(--callout-bg)', border: 'none' }}
        >
          <div className='flex items-center justify-between flex-wrap gap-4'>
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--callout-text)',
                  marginBottom: 4,
                }}
              >
                {currentMember.name}'s Points
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: 'var(--callout-text)',
                  lineHeight: 1,
                }}
              >
                {memberPoints.toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--callout-text)',
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
                      color: 'var(--callout-text)',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--callout-text)',
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
                  className='absolute top-0 end-0 rounded-full text-center font-bold'
                  style={{
                    fontSize: 10,
                    lineHeight: '20px',
                    minWidth: 20,
                    height: 20,
                    padding: '0 4px',
                    background: 'var(--approval-badge-bg)',
                    color: 'var(--approval-badge-text)',
                    border: '1px solid var(--approval-badge-text)',
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
            {catalog.map(reward => {
              const isInactive = inactiveRewardIds.has(reward.id)
              const eligible = isEligible(reward)
              const canAfford =
                !isInactive && eligible && memberPoints >= reward.pointsCost
              const isRedeeming = redeemingId === reward.id
              return (
                <div
                  key={reward.id}
                  className='card p-5 flex flex-col gap-3'
                  style={{ opacity: isInactive ? 0.72 : 1 }}
                >
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
                    {isInactive && (
                      <span
                        className='badge'
                        style={{
                          background: 'var(--surface-2)',
                          color: 'var(--t-muted)',
                          fontSize: 10,
                        }}
                      >
                        Inactive
                      </span>
                    )}
                    {reward.description && (
                      <div className='text-muted mt-1' style={{ fontSize: 12 }}>
                        {reward.description}
                      </div>
                    )}
                  </div>
                  {(() => {
                    const allowed =
                      reward.forMemberIds ??
                      (reward.forMemberId ? [reward.forMemberId] : [])
                    if (allowed.length === 0)
                      return (
                        <div className='text-faint' style={{ fontSize: 11 }}>
                          for everyone
                        </div>
                      )
                    const names = allowed
                      .map(id => memberById(id)?.name)
                      .filter(Boolean)
                    return (
                      <div
                        className='text-faint'
                        style={{ fontSize: 11 }}
                        title={names.join(', ')}
                      >
                        for {names.slice(0, 2).join(', ')}
                        {names.length > 2 ? ` +${names.length - 2} more` : ''}
                      </div>
                    )
                  })()}
                  <button
                    className={`btn btn-sm ${canAfford ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={!canAfford || isRedeeming}
                    onClick={() => canAfford && handleRedeem(reward.id)}
                    style={{ marginTop: 'auto', opacity: canAfford ? 1 : 0.5 }}
                  >
                    {isRedeeming ? (
                      <>
                        <Icon name='refresh' size={13} />
                        Requesting…
                      </>
                    ) : canAfford ? (
                      <>
                        <Icon name='gift' size={13} />
                        Redeem
                      </>
                    ) : (
                      <>
                        <Icon name='lock' size={13} />
                        {isInactive
                          ? 'Inactive'
                          : !eligible
                            ? 'Not available to you'
                            : 'Not enough points'}
                      </>
                    )}
                  </button>
                  {isAdmin && (
                    <div className='flex flex-wrap gap-2'>
                      <button
                        className='btn btn-secondary btn-sm'
                        onClick={() => startModify(reward)}
                      >
                        Modify
                      </button>
                      <button
                        className='btn btn-ghost btn-sm'
                        onClick={() => toggleRewardActive(reward)}
                      >
                        {isInactive ? 'Activate' : 'Deactivate'}
                      </button>
                      <button
                        className='btn btn-ghost btn-sm'
                        style={{ color: 'var(--sig-over)' }}
                        onClick={() => deleteReward(reward)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {catalog.length === 0 && (
              <div className='text-muted card p-5'>No rewards yet</div>
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
                  const reward = rewardItems.find(r => r.id === req.rewardId)
                  const resolver = req.resolvedById
                    ? memberById(req.resolvedById)
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
                          {formatRequestDate(req.requestedAt)}
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
                            {formatRequestDate(req.resolvedAt)}
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
                            onClick={() => {
                              setRequests(prev =>
                                prev.filter(r => r.id !== req.id),
                              )
                              rewMutations.cancelRequest.mutate(Number(req.id))
                              ctx.showToast('Request cancelled')
                            }}
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
              {members.map(m => (
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
                    const actor = memberById(item.actorId)
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
                  const reward = rewardItems.find(r => r.id === req.rewardId)
                  const requester = memberById(req.requesterId)
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
                            {formatRequestDate(req.requestedAt)}
                          </div>
                        </div>
                        <div className='flex flex-col gap-2'>
                          <button
                            className='btn btn-sm btn-primary'
                            onClick={() => resolveRequest(req.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            className='btn btn-sm btn-ghost'
                            style={{ color: 'var(--sig-over)' }}
                            onClick={() => resolveRequest(req.id, 'rejected')}
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

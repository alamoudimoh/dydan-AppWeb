import { useState } from 'react'

import { AppCtx, Icon } from '../App'
import { formatTimestamp } from '../data'
import { useRewardMutations, useRewardRequests } from '../hooks/useHousehold'
import { useLiveData } from '../model/liveData'

type Tab = 'catalog' | 'requests' | 'points'
type RewardForm = { name: string; description: string; costPoints: string }

const blankForm = (): RewardForm => ({
  name: '',
  description: '',
  costPoints: '100',
})

export default function RewardsScreen({
  ctx,
  isChild: _isChild,
  isSolo: _isSolo,
}: {
  ctx: AppCtx
  isChild: boolean
  isSolo: boolean
}) {
  const {
    activity,
    currentUser,
    memberById,
    members,
    rewardRequests,
    rewards,
  } = useLiveData()
  const mutations = useRewardMutations()
  const isAdmin = ctx.persona === 'parent'
  const myRequestsQuery = useRewardRequests(!isAdmin)
  const [tab, setTab] = useState<Tab>('catalog')
  const [editingId, setEditingId] = useState<string | null | undefined>(
    undefined,
  )
  const [form, setForm] = useState<RewardForm>(blankForm)
  const [pendingID, setPendingID] = useState<string | null>(null)

  if (!currentUser) return null
  const ownRequests = isAdmin
    ? rewardRequests
    : (myRequestsQuery.data ?? []).map(request => ({
        id: String(request.id),
        rewardId: String(request.rewardId),
        requesterId: currentUser.id,
        status: request.status,
        requestedAt: request.requestedAt ?? '',
      }))
  const myRequests = ownRequests.filter(
    request => request.requesterId === currentUser.id,
  )
  const pendingRequests = rewardRequests.filter(
    request => request.status === 'pending',
  )
  const startNew = () => {
    setForm(blankForm())
    setEditingId(null)
    setTab('catalog')
  }
  const startEdit = (id: string) => {
    const reward = rewards.find(item => item.id === id)
    if (!reward) return
    setForm({
      name: reward.name,
      description: reward.description ?? '',
      costPoints: String(reward.pointsCost),
    })
    setEditingId(id)
    setTab('catalog')
  }
  const save = async () => {
    const name = form.name.trim()
    const costPoints = Number(form.costPoints)
    if (!name || !Number.isInteger(costPoints) || costPoints < 1) {
      ctx.showToast('Enter a reward name and a positive whole-number cost')
      return
    }
    try {
      if (editingId)
        await mutations.updateReward.mutateAsync({
          id: editingId,
          name,
          description: form.description.trim(),
          costPoints,
        })
      else
        await mutations.createReward.mutateAsync({
          name,
          description: form.description.trim(),
          costPoints,
        })
      ctx.showToast(editingId ? 'Reward saved' : 'Reward created')
      setEditingId(undefined)
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not save reward',
      )
    }
  }
  const request = async (id: string) => {
    setPendingID(id)
    try {
      await mutations.requestReward.mutateAsync(id)
      ctx.showToast('Reward request submitted for approval')
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not request reward',
      )
    } finally {
      setPendingID(null)
    }
  }
  const resolve = async (id: string, approved: boolean) => {
    try {
      if (approved) await mutations.approveRequest.mutateAsync(id)
      else await mutations.rejectRequest.mutateAsync(id)
      ctx.showToast(approved ? 'Request approved' : 'Request rejected')
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not resolve request',
      )
    }
  }
  const setActive = async (id: string, isActive: boolean) => {
    const reward = rewards.find(item => item.id === id)
    if (!reward) return
    try {
      await mutations.updateReward.mutateAsync({
        id,
        name: reward.name,
        description: reward.description ?? '',
        costPoints: reward.pointsCost,
        isActive,
      })
      ctx.showToast(isActive ? 'Reward activated' : 'Reward deactivated')
    } catch (error) {
      ctx.showToast(
        error instanceof Error ? error.message : 'Could not update reward',
      )
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
            Server-backed reward catalog and approval requests
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
        {isAdmin && editingId !== undefined && (
          <div
            className='card p-5 mb-5'
            aria-label={editingId ? 'Modify reward' : 'New reward'}
          >
            <div className='form-title text-primary mb-4'>
              {editingId ? 'Modify reward' : 'New reward'}
            </div>
            <div
              className='grid gap-4'
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              }}
            >
              <label className='flex flex-col gap-1.5'>
                <span className='section-label' style={{ padding: 0 }}>
                  REWARD NAME
                </span>
                <input
                  className='input'
                  value={form.name}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <label className='flex flex-col gap-1.5'>
                <span className='section-label' style={{ padding: 0 }}>
                  POINTS COST
                </span>
                <input
                  className='input'
                  type='number'
                  min='1'
                  step='1'
                  value={form.costPoints}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      costPoints: event.target.value,
                    }))
                  }
                />
              </label>
              <label className='col-span-full flex flex-col gap-1.5'>
                <span className='section-label' style={{ padding: 0 }}>
                  DESCRIPTION
                </span>
                <textarea
                  className='input'
                  rows={2}
                  value={form.description}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <div className='flex gap-2 mt-5'>
              <button
                className='btn btn-primary'
                disabled={
                  mutations.createReward.isPending ||
                  mutations.updateReward.isPending
                }
                onClick={save}
              >
                Save reward
              </button>
              <button
                className='btn btn-secondary'
                onClick={() => setEditingId(undefined)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <div
          className='card mb-5 p-5'
          style={{ background: 'var(--callout-bg)', border: 'none' }}
        >
          <div className='text-muted'>
            {currentUser.name}'s points available
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: 'var(--callout-text)',
            }}
          >
            {currentUser.points.toLocaleString()}
          </div>
        </div>
        <div
          className='flex gap-1 mb-5 p-1 rounded-lg'
          style={{ background: 'var(--surface-2)' }}
        >
          {(
            [
              { id: 'catalog', label: 'Rewards' },
              {
                id: 'requests',
                label: isAdmin
                  ? `Requests (${pendingRequests.length})`
                  : 'My Requests',
              },
              { id: 'points', label: 'Points' },
            ] as const
          ).map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className='flex-1 py-2 font-semibold'
              style={{
                background: tab === item.id ? 'var(--surface)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 'var(--r-sm)',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        {tab === 'catalog' && (
          <div
            className='grid gap-4'
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            }}
          >
            {rewards.map(reward => {
              const active = reward.isActive !== false
              const canAfford =
                active && currentUser.points >= reward.pointsCost
              return (
                <div
                  key={reward.id}
                  className='card p-5 flex flex-col gap-3'
                  style={{ opacity: active ? 1 : 0.7 }}
                >
                  <div style={{ fontSize: 36 }}>{reward.icon}</div>
                  <div>
                    <div className='font-bold text-primary'>{reward.name}</div>
                    <div className='text-muted'>{reward.description}</div>
                    <div className='text-faint mt-2'>
                      {reward.pointsCost} points
                    </div>
                    {!active && (
                      <span className='badge bg-surface-2 text-muted'>
                        Inactive
                      </span>
                    )}
                  </div>
                  <button
                    className={`btn btn-sm ${canAfford ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={!canAfford || pendingID === reward.id}
                    onClick={() => request(reward.id)}
                  >
                    {pendingID === reward.id
                      ? 'Requesting…'
                      : canAfford
                        ? 'Request reward'
                        : active
                          ? 'Not enough points'
                          : 'Inactive'}
                  </button>
                  {isAdmin && (
                    <div className='flex gap-2'>
                      <button
                        className='btn btn-sm btn-secondary'
                        onClick={() => startEdit(reward.id)}
                      >
                        Modify
                      </button>
                      <button
                        className='btn btn-sm btn-ghost'
                        onClick={() => setActive(reward.id, !active)}
                      >
                        {active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {rewards.length === 0 && (
              <div className='card p-5 text-muted'>No rewards yet</div>
            )}
          </div>
        )}
        {tab === 'requests' && (
          <div className='flex flex-col gap-3'>
            {(isAdmin ? pendingRequests : myRequests).map(requestItem => {
              const reward = rewards.find(
                item => item.id === requestItem.rewardId,
              )
              const requester = memberById(requestItem.requesterId)
              if (!reward) return null
              return (
                <div
                  key={requestItem.id}
                  className='card p-4 flex items-center gap-4'
                >
                  <div style={{ fontSize: 28 }}>{reward.icon}</div>
                  <div className='flex-1'>
                    <div className='font-bold text-primary'>{reward.name}</div>
                    <div className='text-muted'>
                      {isAdmin && requester ? `${requester.name} · ` : ''}
                      {formatTimestamp(requestItem.requestedAt)}
                    </div>
                  </div>
                  <span className='badge'>{requestItem.status}</span>
                  {isAdmin && requestItem.status === 'pending' && (
                    <div className='flex gap-2'>
                      <button
                        className='btn btn-sm btn-primary'
                        onClick={() => resolve(requestItem.id, true)}
                      >
                        Approve
                      </button>
                      <button
                        className='btn btn-sm btn-ghost'
                        onClick={() => resolve(requestItem.id, false)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {!isAdmin && requestItem.status === 'pending' && (
                    <button
                      className='btn btn-sm btn-ghost'
                      onClick={async () => {
                        try {
                          await mutations.cancelRequest.mutateAsync(
                            requestItem.id,
                          )
                          ctx.showToast('Request cancelled')
                        } catch (error) {
                          ctx.showToast(
                            error instanceof Error
                              ? error.message
                              : 'Could not cancel request',
                          )
                        }
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )
            })}
            {(isAdmin ? pendingRequests : myRequests).length === 0 && (
              <div className='empty-state'>No requests to show</div>
            )}
          </div>
        )}
        {tab === 'points' && (
          <div>
            <div
              className='grid gap-3'
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              }}
            >
              {members.map(member => (
                <div key={member.id} className='card p-4'>
                  <div className='font-semibold text-primary'>
                    {member.name}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>
                    {member.points.toLocaleString()}
                  </div>
                  <div className='text-faint'>points available</div>
                </div>
              ))}
            </div>
            {activity
              .filter(item => item.points != null)
              .map(item => (
                <div key={item.id} className='card p-3 mt-2'>
                  {item.text} · {item.points} points
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

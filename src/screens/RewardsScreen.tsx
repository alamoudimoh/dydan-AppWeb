import { useState } from 'react'

import { AppCtx, Icon } from '../App'
import {
  EmptyState,
  EntityCard,
  EntityGrid,
  EntityList,
  PageHero,
  PageShell,
  PageTabs,
} from '../components/page'
import PageHeader from '../components/PageHeader'
import { formatTimestamp } from '../data'
import { useRewardMutations, useRewardRequests } from '../hooks/useHousehold'
import { useLiveData } from '../model/liveData'

type Tab = 'catalog' | 'requests' | 'points'

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
    setTab('catalog')
    ctx.openCreate('reward')
  }
  const startEdit = (id: string) => {
    const reward = rewards.find(item => item.id === id)
    if (!reward) return
    setTab('catalog')
    ctx.openCreate('reward', { reward })
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
    <PageShell
      testId='rewards-page'
      header={
        <PageHeader
          title='Rewards'
          subtitle='Server-backed reward catalog and approval requests'
          actions={
            isAdmin ? (
              <button className='btn btn-primary' onClick={startNew}>
                <Icon name='gift' size={14} />
                New reward
              </button>
            ) : undefined
          }
        />
      }
    >
      <PageHero variant='callout' testId='rewards-hero'>
        <div style={{ color: 'var(--callout-muted)' }}>
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
      </PageHero>
      <PageTabs
        ariaLabel='Rewards sections'
        testId='rewards-tabs'
        value={tab}
        onChange={id => setTab(id as Tab)}
        tabs={[
          { id: 'catalog', label: 'Rewards' },
          {
            id: 'requests',
            label: isAdmin
              ? `Requests (${pendingRequests.length})`
              : 'My Requests',
          },
          { id: 'points', label: 'Points' },
        ]}
      />
      {tab === 'catalog' && (
        <EntityGrid min={240} testId='rewards-catalog'>
          {rewards.map(reward => {
            const active = reward.isActive !== false
            const canAfford = active && currentUser.points >= reward.pointsCost
            return (
              <EntityCard
                key={reward.id}
                className='flex flex-col gap-3'
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
              </EntityCard>
            )
          })}
          {rewards.length === 0 && (
            <EmptyState
              testId='rewards-zero-catalog'
              title='No rewards yet'
              description='Rewards created by your space will appear here.'
            />
          )}
        </EntityGrid>
      )}
      {tab === 'requests' && (
        <EntityList>
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
            <EmptyState
              testId='rewards-zero-requests'
              title='No requests to show'
              description='Reward requests will appear here for review.'
            />
          )}
        </EntityList>
      )}
      {tab === 'points' && (
        <div>
          <EntityGrid min={160}>
            {members.map(member => (
              <EntityCard key={member.id} variant='summary'>
                <div className='font-semibold text-primary'>{member.name}</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>
                  {member.points.toLocaleString()}
                </div>
                <div className='text-faint'>points available</div>
              </EntityCard>
            ))}
          </EntityGrid>
          {activity
            .filter(item => item.points != null)
            .map(item => (
              <div key={item.id} className='card p-3 mt-2'>
                {item.text} · {item.points} points
              </div>
            ))}
        </div>
      )}
    </PageShell>
  )
}

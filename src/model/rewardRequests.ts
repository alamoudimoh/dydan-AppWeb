import type { RewardRequest } from '../data'
import type { ApiRewardRequest } from './api'

export function toRewardRequests(
  requests: ApiRewardRequest[],
): RewardRequest[] {
  return requests.map(r => ({
    id: String(r.id),
    rewardId: String(r.rewardId),
    requesterId:
      r.userId != null
        ? String(r.userId)
        : (r.requesterName ?? String(r.createdBy ?? 0)),
    status: (r.status === 'approved' ||
    r.status === 'rejected' ||
    r.status === 'cancelled'
      ? r.status
      : 'pending') as RewardRequest['status'],
    requestedAt: r.requestedAt ?? '',
    resolvedAt: r.resolvedAt ?? undefined,
    resolvedById: r.resolvedBy != null ? String(r.resolvedBy) : undefined,
  }))
}

export function selectPendingRewardRequests(
  requests: RewardRequest[],
): RewardRequest[] {
  return requests.filter(request => request.status === 'pending')
}

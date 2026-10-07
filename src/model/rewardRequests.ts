import type { RewardRequest } from '../data'

export function selectPendingRewardRequests(
  requests: RewardRequest[],
): RewardRequest[] {
  return requests.filter(request => request.status === 'pending')
}

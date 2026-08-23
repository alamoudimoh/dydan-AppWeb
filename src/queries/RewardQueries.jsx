import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../utils/ApiClient'
import { getAccessToken } from '../utils/TokenStorage.js'

const json = async response => {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Reward operation failed')
  return body
}
const get = path => apiClient.get(path).then(json)
const send = (path, method, data) =>
  apiClient[method](path, JSON.stringify(data)).then(json)

export const useRewards = includeArchived =>
  useQuery({
    queryKey: ['rewards', getAccessToken(), includeArchived],
    queryFn: () =>
      get(`/rewards${includeArchived ? '?includeArchived=true' : ''}`),
  })
export const useMyRewardRequests = () =>
  useQuery({
    queryKey: ['rewardRequests', getAccessToken(), 'mine'],
    queryFn: () => get('/rewards/requests/mine'),
  })
export const useAdminRewardRequests = enabled =>
  useQuery({
    queryKey: ['rewardRequests', getAccessToken(), 'admin'],
    queryFn: () => get('/rewards/requests'),
    enabled,
  })

export const useRewardMutation = () => {
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ data, method = 'post', path }) => send(path, method, data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['rewards'] })
      client.invalidateQueries({ queryKey: ['rewardRequests'] })
      client.invalidateQueries({ queryKey: ['allCircleMembers'] })
      client.invalidateQueries({ queryKey: ['familyProgress'] })
    },
  })
  return mutation
}

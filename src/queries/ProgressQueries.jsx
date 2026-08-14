import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getStoredCircleId } from '../utils/ActiveCircle'
import { apiClient } from '../utils/ApiClient'
import {
  normalizeGoals,
  normalizeReport,
  normalizeWorkload,
} from './progressModel'

const json = async response => {
  const body = await response.json().catch(() => ({}))
  if (!response.ok)
    throw new Error(body.error || 'Unable to load family progress')
  return body
}
const token = () => localStorage.getItem('token')
const progressScope = () => [token(), getStoredCircleId()]
const get = path => apiClient.get(path).then(json)

export const useWorkload = (range, memberId, categoryId) =>
  useQuery({
    queryKey: [
      'familyProgress',
      ...progressScope(),
      'workload',
      range,
      memberId,
      categoryId,
    ],
    queryFn: () => {
      const query = new URLSearchParams({ range })
      if (memberId) query.set('memberId', memberId)
      if (categoryId) query.set('categoryId', categoryId)
      return get(`/progress/workload?${query}`).then(normalizeWorkload)
    },
  })
export const useReport = range =>
  useQuery({
    queryKey: ['familyProgress', ...progressScope(), 'report', range],
    queryFn: () =>
      get(`/progress/reports?range=${range}`).then(normalizeReport),
  })
export const useStreak = () =>
  useQuery({
    queryKey: ['familyProgress', ...progressScope(), 'streak'],
    queryFn: () => get('/progress/streak'),
  })
export const useGoals = () =>
  useQuery({
    queryKey: ['familyProgress', ...progressScope(), 'goals'],
    queryFn: () => get('/progress/goals').then(normalizeGoals),
  })
export const useGoalMutation = () => {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ data, id }) =>
      apiClient[id ? 'put' : 'post'](
        `/progress/goals${id ? `/${id}` : ''}`,
        JSON.stringify(data),
      ).then(json),
    onSuccess: () => client.invalidateQueries({ queryKey: ['familyProgress'] }),
  })
}

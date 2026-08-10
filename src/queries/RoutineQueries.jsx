import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../utils/ApiClient'

const parse = async response => {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Routine operation failed')
  return body
}

const request = (path, method = 'get', data) => {
  const body =
    data === null || data === undefined ? undefined : JSON.stringify(data)
  if (typeof apiClient[method] === 'function') {
    return apiClient[method](path, body).then(parse)
  }
  return apiClient
    .request(path, {
      method: method.toUpperCase(),
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    .then(parse)
}

export const useRoutines = includeArchived =>
  useQuery({
    queryKey: ['routines', includeArchived],
    queryFn: () =>
      request(`/routines${includeArchived ? '?includeArchived=true' : ''}`),
  })

export const useRoutineMutation = () => {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ data, method = 'post', path }) =>
      request(path, method, data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['routines'] })
      client.invalidateQueries({ queryKey: ['chores'] })
    },
  })
}

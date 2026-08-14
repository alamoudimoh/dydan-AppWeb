import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { getStoredCircleId } from '../utils/ActiveCircle'
import { apiClient } from '../utils/ApiClient'

const scope = () => [localStorage.getItem('token'), getStoredCircleId()]
const json = async response => {
  const body = await response.json().catch(() => ({}))
  if (!response.ok)
    throw new Error(body.error || 'Notification operation failed')
  return body
}
const send = (path, method) =>
  apiClient
    .request(path, { method: method.toUpperCase() })
    .then(response => (response.status === 204 ? {} : json(response)))
export const notificationKeys = {
  all: () => ['notifications', ...scope()],
  count: () => ['notificationUnreadCount', ...scope()],
}
export const useNotifications = () =>
  useInfiniteQuery({
    queryKey: notificationKeys.all(),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      apiClient
        .get(
          `/notifications?limit=30${pageParam ? `&before=${pageParam}` : ''}`,
        )
        .then(json),
    getNextPageParam: page =>
      page.res?.length === 30 ? page.res[page.res.length - 1].id : undefined,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    enabled: Boolean(localStorage.getItem('token')),
  })
export const useNotificationCount = () =>
  useQuery({
    queryKey: notificationKeys.count(),
    queryFn: () => apiClient.get('/notifications/unread-count').then(json),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    enabled: Boolean(localStorage.getItem('token')),
  })
export const useNotificationActions = () => {
  const client = useQueryClient()
  const refresh = () => {
    client.invalidateQueries({ queryKey: ['notifications'] })
    client.invalidateQueries({ queryKey: ['notificationUnreadCount'] })
  }
  return {
    read: useMutation({
      mutationFn: id => send(`/notifications/${id}/read`, 'patch'),
      onMutate: async id => {
        client.setQueriesData({ queryKey: ['notifications'] }, old =>
          old
            ? {
                ...old,
                pages: old.pages?.map(page => ({
                  ...page,
                  unreadCount: Math.max(0, (page.unreadCount || 0) - 1),
                  res: page.res?.map(n =>
                    n.id === id
                      ? { ...n, readAt: new Date().toISOString() }
                      : n,
                  ),
                })),
              }
            : old,
        )
        client.setQueriesData({ queryKey: ['notificationUnreadCount'] }, old =>
          old
            ? { ...old, unreadCount: Math.max(0, (old.unreadCount || 0) - 1) }
            : old,
        )
      },
      onSettled: refresh,
    }),
    readAll: useMutation({
      mutationFn: () => send('/notifications/read-all', 'post'),
      onMutate: async () => {
        client.setQueriesData({ queryKey: ['notifications'] }, old =>
          old
            ? {
                ...old,
                pages: old.pages?.map(page => ({
                  ...page,
                  unreadCount: 0,
                  res: page.res?.map(n => ({
                    ...n,
                    readAt: n.readAt || new Date().toISOString(),
                  })),
                })),
              }
            : old,
        )
        client.setQueriesData({ queryKey: ['notificationUnreadCount'] }, old =>
          old ? { ...old, unreadCount: 0 } : old,
        )
      },
      onSettled: refresh,
    }),
  }
}

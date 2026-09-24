import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { parseAccountResponse } from '../utils/AccountResponse'
import * as Fetcher from '../utils/Fetcher'
import { getAccessToken } from '../utils/TokenStorage'

export type ApiToken = { id: number; name: string; createdAt: string }
export type CreatedApiToken = ApiToken & { token: string }
export type StorageUsage = { used: number; total: number }

const tokenKey = ['user', 'api-tokens'] as const
const storageKey = ['user', 'storage'] as const
const parse = <T>(response: Promise<Response>) =>
  parseAccountResponse(response) as Promise<T>

export function useStorageUsage() {
  return useQuery({
    queryKey: storageKey,
    queryFn: () => parse<StorageUsage>(Fetcher.GetStorageUsage()),
    enabled: Boolean(getAccessToken()),
  })
}

export function useApiTokens() {
  return useQuery({
    queryKey: tokenKey,
    queryFn: () => parse<ApiToken[]>(Fetcher.GetLongLiveTokens()),
    enabled: Boolean(getAccessToken()),
  })
}

export function useApiTokenMutations() {
  const client = useQueryClient()
  const create = useMutation({
    mutationFn: ({ mfaCode, name }: { name: string; mfaCode?: string }) =>
      parse<CreatedApiToken>(Fetcher.CreateLongLiveToken(name, mfaCode)),
    onSuccess: () => client.invalidateQueries({ queryKey: tokenKey }),
  })
  const remove = useMutation({
    mutationFn: (id: number) => parse(Fetcher.DeleteLongLiveToken(id)),
    onSuccess: () => client.invalidateQueries({ queryKey: tokenKey }),
  })
  return { create, remove }
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { parseAccountResponse } from '../utils/AccountResponse'
import * as Fetcher from '../utils/Fetcher'
import { getAccessToken } from '../utils/TokenStorage'

export type ApiToken = { id: number; name: string; createdAt: string }
export type CreatedApiToken = ApiToken & { token: string }

export type EmailDeliveryStatus = {
  configured: boolean
  source: 'runtime' | 'environment' | 'none'
  provider: 'smtp' | 'smtp2go'
  fromEmail?: string
  host?: string
  port?: number
  username?: string
  appHost?: string
  verificationTemplateId?: string
  resetPasswordTemplateId?: string
  secretConfigured: boolean
}

export type EmailDeliveryInput = {
  provider: 'smtp' | 'smtp2go'
  fromEmail: string
  host: string
  port: number
  username: string
  secret: string
  appHost: string
  verificationTemplateId: string
  resetPasswordTemplateId: string
}
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

export function useEmailDelivery() {
  return useQuery({
    queryKey: ['admin', 'email-delivery'],
    queryFn: () => parse<EmailDeliveryStatus>(Fetcher.GetEmailDelivery()),
  })
}

export function useEmailDeliveryMutations() {
  const client = useQueryClient()
  const invalidate = () =>
    client.invalidateQueries({ queryKey: ['admin', 'email-delivery'] })
  return {
    save: useMutation({
      mutationFn: (input: EmailDeliveryInput) =>
        parse<EmailDeliveryStatus>(Fetcher.UpdateEmailDelivery(input)),
      onSuccess: invalidate,
    }),
    test: useMutation({
      mutationFn: (to: string) =>
        parse<{ delivered: boolean; message: string }>(
          Fetcher.TestEmailDelivery(to),
        ),
    }),
  }
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

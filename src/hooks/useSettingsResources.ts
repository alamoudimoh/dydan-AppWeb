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

export type IntegrationStatus = {
  server: {
    version: string
    commit: string
    buildDate: string
    deployment: string
    operatingSystem: string
    architecture: string
    database: string
    storage: string
  }
  apiDocs: { enabled: boolean; url: string }
  googleCalendar: { available: boolean }
  caldav: { available: boolean }
  alexa: { available: boolean }
  legal: { privacyPolicyUrl: string; termsUrl: string }
  billing: { invoiceHistory: boolean }
  webhooks: {
    available: boolean
    url: string
    editable: boolean
    plusOnly: boolean
  }
  settings: {
    notificationEmail: {
      available: boolean
      emailDeliveryConfigured: boolean
      accountEmailAvailable: boolean
    }
    analytics: { available: boolean }
    personalization: { available: boolean }
    betaFeatures: { available: boolean }
  }
}

type ApiIntegrationStatus = Omit<IntegrationStatus, 'server' | 'settings'> & {
  server?: Partial<IntegrationStatus['server']>
  settings?: Partial<IntegrationStatus['settings']>
}

const normalizeIntegrationStatus = (
  status: ApiIntegrationStatus,
): IntegrationStatus => ({
  ...status,
  server: {
    ...status.server,
    version: status.server?.version ?? '',
    commit: status.server?.commit ?? '',
    buildDate: status.server?.buildDate ?? '',
    deployment: status.server?.deployment ?? '',
    operatingSystem: status.server?.operatingSystem ?? '',
    architecture: status.server?.architecture ?? '',
    database: status.server?.database ?? '',
    storage: status.server?.storage ?? '',
  },
  settings: {
    notificationEmail: {
      available: false,
      emailDeliveryConfigured: false,
      accountEmailAvailable: false,
      ...status.settings?.notificationEmail,
    },
    analytics: { available: false, ...status.settings?.analytics },
    personalization: {
      available: false,
      ...status.settings?.personalization,
    },
    betaFeatures: { available: false, ...status.settings?.betaFeatures },
  },
})

/** One invoice as recorded by the server's Stripe webhook handler. */
export type Invoice = {
  invoice_id: string
  amount: number
  received_at: string
  status: string
  subscription_id: string
  customer_id: string
  period_start: string
  period_end: string
}

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

const integrationsKey = ['user', 'integrations'] as const

export function useIntegrationStatus() {
  return useQuery({
    queryKey: integrationsKey,
    queryFn: () =>
      parse<ApiIntegrationStatus>(Fetcher.GetIntegrationStatus()).then(
        normalizeIntegrationStatus,
      ),
    enabled: Boolean(getAccessToken()),
  })
}

export function useWebhookMutation() {
  const client = useQueryClient()
  return {
    set: useMutation({
      mutationFn: (url: string) => parse(Fetcher.PutWebhookURL(url)),
      onSuccess: () => client.invalidateQueries({ queryKey: integrationsKey }),
    }),
  }
}

export function useImportData() {
  return useMutation({
    mutationFn: (document: unknown) => parse(Fetcher.ImportMyData(document)),
  })
}

/**
 * Billing history for the signed-in account. The server resolves the Stripe
 * customer from the access token, so this can only ever return the caller's
 * own invoices.
 */
export function useInvoices(enabled: boolean) {
  return useQuery({
    queryKey: ['payments', 'invoices'],
    queryFn: () =>
      parse<Invoice[]>(Fetcher.GetInvoices()).then(rows => rows ?? []),
    enabled: enabled && Boolean(getAccessToken()),
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

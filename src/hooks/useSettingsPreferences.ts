import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { parseAccountResponse } from '../utils/AccountResponse'
import * as Fetcher from '../utils/Fetcher'
import { getAccessToken } from '../utils/TokenStorage'
import { SettingsPreferences } from './settingsPreferenceModel'

export {
  DEFAULT_SETTINGS_PREFERENCES,
  type SettingsPreferences,
} from './settingsPreferenceModel'

const key = ['user', 'preferences'] as const

const parse = <T>(response: Promise<Response>) =>
  parseAccountResponse(response) as Promise<T>

export function useSettingsPreferences() {
  return useQuery({
    queryKey: key,
    queryFn: () => parse<SettingsPreferences>(Fetcher.GetUserPreferences()),
    enabled: Boolean(getAccessToken()),
  })
}

export function useSettingsPreferencesMutation() {
  const client = useQueryClient()
  const update = useMutation({
    mutationFn: (preferences: SettingsPreferences) =>
      parse<SettingsPreferences>(Fetcher.UpdateUserPreferences(preferences)),
    onSuccess: preferences => client.setQueryData(key, preferences),
  })
  const reset = useMutation({
    mutationFn: () =>
      parse<SettingsPreferences>(Fetcher.ResetUserPreferences()),
    onSuccess: preferences => client.setQueryData(key, preferences),
  })
  return { reset, update }
}

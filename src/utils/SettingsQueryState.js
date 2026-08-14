export const SETTINGS_QUERY_STATE = Object.freeze({
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
})

/**
 * Shared loading/error contract for Settings sections backed by queries or
 * one-shot fetches.
 */
export const resolveSettingsQueryState = ({
  hasData = false,
  isError = false,
  isLoading = false,
} = {}) => {
  if (hasData) return SETTINGS_QUERY_STATE.READY
  if (isLoading) return SETTINGS_QUERY_STATE.LOADING
  if (isError) return SETTINGS_QUERY_STATE.ERROR
  return SETTINGS_QUERY_STATE.ERROR
}

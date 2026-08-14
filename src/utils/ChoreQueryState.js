export const CHORE_QUERY_STATE = {
  OK: 'ok',
  NOT_FOUND: 'notFound',
  FORBIDDEN: 'forbidden',
  NETWORK: 'network',
  ERROR: 'error',
}

/**
 * Classifies a chore detail/edit query for route-level empty/error UI.
 */
export const resolveChoreQueryState = ({ error, hasData }) => {
  if (hasData) return CHORE_QUERY_STATE.OK

  const status = error?.status ?? error?.response?.status
  if (status === 404) return CHORE_QUERY_STATE.NOT_FOUND
  if (status === 401 || status === 403) return CHORE_QUERY_STATE.FORBIDDEN

  const message = String(error?.message || '')
  if (
    error?.name === 'TypeError' ||
    /offline|failed to fetch|not available offline/i.test(message)
  ) {
    return CHORE_QUERY_STATE.NETWORK
  }

  return CHORE_QUERY_STATE.ERROR
}

/**
 * Network failures may use offline cache; authoritative denials must not.
 */
export const shouldUseOfflineChoreCache = error => {
  const status = error?.status ?? error?.response?.status
  if (status === 401 || status === 403 || status === 404) return false
  if (error?.name === 'TypeError') return true
  const message = String(error?.message || '')
  return /failed to fetch/i.test(message)
}

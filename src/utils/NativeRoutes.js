/** Native deep links resolve to approved-runtime routes, never legacy paths. */
export const nativeTaskPath = (choreID, autoComplete) => {
  const query = new URLSearchParams({ task: String(choreID) })
  if (autoComplete) query.set('auto_complete', autoComplete)
  return `/all-tasks?${query.toString()}`
}

export const nativeCapturePath = mode =>
  mode === 'scan' || mode === 'voice'
    ? `/all-tasks?create=1&mode=${mode}`
    : '/all-tasks?create=1'

export const nativeInvitePath = inviteCode =>
  `/settings?invite_code=${encodeURIComponent(inviteCode)}`

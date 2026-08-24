let passwordResetCredential = null

export const capturePasswordResetCredential = browserWindow => {
  const url = new URL(browserWindow.location.href)
  if (!url.pathname.endsWith('/password/update')) return null
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ''))
  const code = fragment.get('c') || url.searchParams.get('c')
  if (!code) return null

  passwordResetCredential = code
  fragment.delete('c')
  url.searchParams.delete('c')
  url.hash = fragment.toString() ? `#${fragment}` : ''
  browserWindow.history.replaceState(
    browserWindow.history.state,
    '',
    url.pathname + url.search + url.hash,
  )
  return code
}

export const consumePasswordResetCredential = () => {
  const code = passwordResetCredential
  passwordResetCredential = null
  return code
}

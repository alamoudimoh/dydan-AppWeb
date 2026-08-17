const SMOKE_TOKEN = 'smoke-test-token'

export const installSmokeSession = async page => {
  await page.addInitScript(() => {
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    localStorage.setItem('token', 'smoke-test-token')
    localStorage.setItem('token_expiry', expiry)
    localStorage.setItem('circleId', '3')
    localStorage.setItem('themeMode', JSON.stringify('light'))
    sessionStorage.removeItem('session_expired')
    sessionStorage.removeItem('return_path_pending')
  })
}

export const clearSmokeSession = async page => {
  await page.addInitScript(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('token_expiry')
    localStorage.removeItem('circleId')
  })
}

export { SMOKE_TOKEN }

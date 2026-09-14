/* global process */
const SMOKE_TOKEN = 'smoke-test-token'
const SMOKE_HOST = process.env.SMOKE_HOST || '127.0.0.1'

export const installRefreshCookie = async context => {
  await context.addCookies([
    {
      name: 'refresh_token',
      value: 'smoke-refresh-token',
      domain: SMOKE_HOST,
      path: '/api/v1',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
}

export const installSmokeSession = async page => {
  await installRefreshCookie(page.context())
  await page.addInitScript(() => {
    localStorage.setItem('circleId', '3')
    localStorage.setItem('themeMode', JSON.stringify('light'))
    sessionStorage.removeItem('session_expired')
    sessionStorage.removeItem('return_path_pending')
  })
}

export const clearSmokeSession = async page => {
  await page.context().clearCookies({ name: 'refresh_token' })
  await page.addInitScript(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('token_expiry')
    localStorage.removeItem('circleId')
  })
}

export { SMOKE_TOKEN }

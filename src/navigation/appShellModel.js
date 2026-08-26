const SHELL_FREE_ROUTES = new Set([
  '/landing',
  '/privacy',
  '/terms',
  '/payments/success',
  '/payments/cancel',
])

const SHELL_SPACER_ROUTES = new Set([
  '/signup',
  '/login',
  '/forgot-password',
  '/password/update',
  '/login/settings',
  '/welcome',
  '/onboarding',
  '/get-started',
  '/ready',
  '/circle/join',
])

export const resolveAppShellMode = pathname => {
  if (pathname.startsWith('/auth/')) return 'spacer'
  if (SHELL_SPACER_ROUTES.has(pathname)) return 'spacer'
  if (SHELL_FREE_ROUTES.has(pathname)) return 'none'
  return 'full'
}

export const hasAppShell = pathname => resolveAppShellMode(pathname) === 'full'

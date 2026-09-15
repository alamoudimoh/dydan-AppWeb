import { useColorScheme } from '@mui/joy'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { ImpersonateUserProvider } from './contexts/ImpersonateUserContext'
import { LocalizationProvider } from './contexts/LocalizationContext'
import ThemeContext from './contexts/ThemeContext'
import Landing from './views/Landing/Landing'

const PrivacyPolicyView = lazy(
  () => import('./views/PrivacyPolicy/PrivacyPolicyView'),
)
const TermsView = lazy(() => import('./views/Terms/TermsView'))

const page = element => <Suspense fallback={null}>{element}</Suspense>

const AppRedirect = () => {
  return <Landing />
}

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/privacy', element: page(<PrivacyPolicyView />) },
  { path: '/terms', element: page(<TermsView />) },
  { path: '*', element: <AppRedirect /> },
])

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { enabled: false, refetchOnWindowFocus: false, retry: false },
  },
})

const ThemeClass = () => {
  const { mode, systemMode } = useColorScheme()

  useEffect(() => {
    const storedMode = JSON.parse(localStorage.getItem('themeMode') || 'null')
    const selectedMode = storedMode || mode
    const isDark =
      selectedMode === 'dark' ||
      (selectedMode === 'system' && systemMode === 'dark')

    document.getElementById('root').classList.toggle('dark', isDark)
  }, [mode, systemMode])

  return null
}

const MarketingApp = () => (
  <ThemeContext>
    <ThemeClass />
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider>
        <ImpersonateUserProvider>
          <RouterProvider router={router} />
        </ImpersonateUserProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  </ThemeContext>
)

export default MarketingApp

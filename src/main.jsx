import './i18n/config'
import './index.css'
import '@fontsource-variable/comfortaa'
import '@fontsource-variable/ubuntu-sans'
import '@fontsource/cairo/400.css'
import '@fontsource/cairo/600.css'
import '@fontsource/cairo/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'

import React from 'react'
import ReactDOM from 'react-dom/client'

import { APP_BRAND_ID } from './config/AppBranding.js'
import { initSentry, SentryBoundary } from './observability/sentry.jsx'
import { capturePasswordResetCredential } from './utils/PasswordResetCredential.js'

capturePasswordResetCredential(window)
document.documentElement.dataset.theme = APP_BRAND_ID
// No-op unless VITE_SENTRY_DSN is configured; the SDK stays dormant otherwise.
initSentry()

const marketingHost = import.meta.env.VITE_DYDAN_MARKETING_HOST
const isMarketingSite =
  (marketingHost && window.location.hostname === marketingHost) ||
  (import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get('site') === 'marketing')

export const Site = React.lazy(() =>
  isMarketingSite ? import('./MarketingApp.jsx') : import('./Application.jsx'),
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <React.Suspense fallback={null}>
      <SentryBoundary>
        <Site />
      </SentryBoundary>
    </React.Suspense>
  </React.StrictMode>,
)

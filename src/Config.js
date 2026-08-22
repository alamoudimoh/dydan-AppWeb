// Empty VITE_APP_API_URL (the default) means same-origin API calls: the
// browser bundle talks to `/api/v1/...` relative to wherever it is served
// from, so self-hosted deployments work over any IP, hostname, or reverse
// proxy without rebuilding. Set a absolute URL here only for hosted builds
// whose API lives on a different origin.
const configuredApiUrl = import.meta.env.VITE_APP_API_URL

export const API_URL =
  configuredApiUrl === 'AUTO'
    ? window.location.origin
    : (configuredApiUrl ?? '')
export const REDIRECT_URL = import.meta.env.VITE_APP_REDIRECT_URL //|| 'http://localhost:3000'
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_APP_GOOGLE_CLIENT_ID
export const ENVIROMENT = import.meta.env.VITE_APP_ENVIROMENT

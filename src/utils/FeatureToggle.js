const viteEnv =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}

/** An explicitly configured hosted domain; absent for self-hosted-only builds. */
export const OFFICIAL_HOSTED_DOMAIN =
  viteEnv.VITE_DYDAN_HOSTED_DOMAIN?.toLowerCase() || ''

export const isOfficialHostedUrl = url =>
  Boolean(OFFICIAL_HOSTED_DOMAIN) &&
  typeof url === 'string' &&
  url.toLowerCase().includes(OFFICIAL_HOSTED_DOMAIN)

/**
 * Detect whether the app is pointed at the explicitly configured hosted cloud.
 */
export const isOfficialDydanInstance = async () => {
  try {
    const { Preferences } = await import('@capacitor/preferences')
    const { API_URL } = await import('../Config')

    const { value: customServerUrl } = await Preferences.get({
      key: 'customServerUrl',
    })

    const serverUrl = customServerUrl || API_URL
    return isOfficialHostedUrl(serverUrl)
  } catch (error) {
    console.warn('FeatureToggle: Error checking server instance:', error)
    return false
  }
}

/**
 * Synchronous hosted-cloud check based on the initialized API client URL.
 */
export const isOfficialDydanInstanceSync = () => {
  try {
    return import('./ApiClient')
      .then(({ apiClient }) => {
        const currentApiUrl =
          apiClient.baseURL || apiClient.customServerURL || ''
        if (!currentApiUrl || typeof currentApiUrl !== 'string') {
          return false
        }
        return isOfficialHostedUrl(currentApiUrl)
      })
      .catch(error => {
        console.warn(
          'FeatureToggle: Error checking server instance (sync):',
          error,
        )
        return false
      })
  } catch (error) {
    console.warn('FeatureToggle: Error checking server instance (sync):', error)
    return false
  }
}

export default {
  isOfficialDydanInstance,
  isOfficialDydanInstanceSync,
}

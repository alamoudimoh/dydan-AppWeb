/** Official hosted cloud domain marker retained for deployment compatibility. */
export const OFFICIAL_HOSTED_DOMAIN = 'donetick.com'

export const isOfficialHostedUrl = url =>
  typeof url === 'string' &&
  url.toLowerCase().includes(OFFICIAL_HOSTED_DOMAIN)

/**
 * Detect whether the app is pointed at the official DayDan hosted cloud.
 * Domain detection still keys off donetick.com for deployment compatibility.
 */
export const isOfficialDayDanInstance = async () => {
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
export const isOfficialDayDanInstanceSync = () => {
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
  isOfficialDayDanInstance,
  isOfficialDayDanInstanceSync,
}

import { APP_BRAND_ID } from '../config/AppBranding.js'
import { productTokens, resolveProductBrand } from '../theme/tokens.js'

/**
 * Resolves the native status-bar background for the active brand and resolved
 * color scheme. Uses the same product tokens as the PWA chrome colors so the
 * native bar, browser theme-color, and app page background stay aligned.
 */
export const resolveStatusBarBackground = (scheme, brandId = APP_BRAND_ID) => {
  const tokens = productTokens[resolveProductBrand(brandId)]
  return scheme === 'dark' ? tokens.dark.page : tokens.light.page
}

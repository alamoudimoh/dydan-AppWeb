/**
 * User-facing product branding (Polish Batch 5).
 * Internal package ids, deep links, and API contracts stay upstream-compatible.
 */

import { productTokens, resolveProductBrand } from '../theme/tokens.js'

const viteEnv =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}

export const APP_BRAND_ID = resolveProductBrand(viteEnv.VITE_APP_BRAND)
export const APP_DISPLAY_NAME = productTokens[APP_BRAND_ID].name

export const APP_DISPLAY_TAGLINE = 'Simplify tasks & chores, together.'

export const APP_MANIFEST_TITLE = `${APP_DISPLAY_NAME}: ${APP_DISPLAY_TAGLINE}`

/** PWA/browser chrome colors aligned with the selected product theme. */
export const APP_THEME_COLOR = productTokens[APP_BRAND_ID].light.page
export const APP_BACKGROUND_COLOR = productTokens[APP_BRAND_ID].light.page

export const APP_SUPPORT_URL =
  viteEnv.VITE_APP_SUPPORT_URL ||
  'https://github.com/alamoudimoh/dydan-app/issues'

export const formatPageTitle = detail =>
  detail ? `${APP_DISPLAY_NAME}: ${detail}` : APP_DISPLAY_NAME

export const formatSearchPlaceholder = () => `Search ${APP_DISPLAY_NAME}`

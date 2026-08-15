/**
 * User-facing product branding (Polish Batch 5).
 * Internal package ids, deep links, and API contracts stay upstream-compatible.
 */

const viteEnv =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : {}

export const APP_DISPLAY_NAME = 'DayDan'

export const APP_DISPLAY_TAGLINE = 'Simplify tasks & chores, together.'

export const APP_MANIFEST_TITLE = `${APP_DISPLAY_NAME}: ${APP_DISPLAY_TAGLINE}`

export const APP_SUPPORT_URL =
  viteEnv.VITE_APP_SUPPORT_URL ||
  'https://github.com/alamoudimoh/Taskier-App/issues'

export const formatPageTitle = detail =>
  detail ? `${APP_DISPLAY_NAME}: ${detail}` : APP_DISPLAY_NAME

export const formatSearchPlaceholder = () => `Search ${APP_DISPLAY_NAME}`

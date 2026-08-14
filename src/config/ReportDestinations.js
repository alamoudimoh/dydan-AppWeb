/**
 * DayDan / Taskier-owned report destinations. Self-hosted and failed cloud
 * delivery fall back here instead of upstream Donetick issue trackers.
 *
 * Cloud relay: set VITE_FEEDBACK_WEBHOOK_URL and/or VITE_ERROR_REPORT_WEBHOOK_URL
 * to a workers/feedback-style relay — never a raw Discord/Slack webhook.
 */

const viteEnv =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : {}

export const TASKIER_APP_REPO =
  viteEnv.VITE_TASKIER_APP_REPO_URL ||
  'https://github.com/alamoudimoh/Taskier-App'

export const FEEDBACK_ISSUES_NEW_URL =
  viteEnv.VITE_FEEDBACK_ISSUES_URL || `${TASKIER_APP_REPO}/issues/new`

export const APP_REPORT_SOURCE = 'taskier-app'

export const REPORT_ID_PREFIX = 'TD'

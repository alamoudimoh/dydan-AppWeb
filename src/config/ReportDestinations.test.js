import assert from 'node:assert/strict'
import test from 'node:test'

import {
  APP_REPORT_SOURCE,
  DAYDAN_APP_REPO,
  FEEDBACK_ISSUES_NEW_URL,
  REPORT_ID_PREFIX,
  resolveAppRepoUrl,
} from '../config/ReportDestinations.js'

test('report destinations default to DayDan-owned GitHub endpoints', () => {
  assert.equal(DAYDAN_APP_REPO, 'https://github.com/alamoudimoh/daydan-app')
  assert.equal(
    FEEDBACK_ISSUES_NEW_URL,
    'https://github.com/alamoudimoh/daydan-app/issues/new',
  )
  assert.equal(APP_REPORT_SOURCE, 'daydan-app')
  assert.equal(REPORT_ID_PREFIX, 'TD')
})

test('resolveAppRepoUrl prefers VITE_DAYDAN_APP_REPO_URL over legacy Taskier env', () => {
  assert.equal(
    resolveAppRepoUrl({
      VITE_DAYDAN_APP_REPO_URL: 'https://github.com/example/DayDan-App',
      VITE_TASKIER_APP_REPO_URL: 'https://github.com/example/Taskier-App',
    }),
    'https://github.com/example/DayDan-App',
  )
  assert.equal(
    resolveAppRepoUrl({
      VITE_TASKIER_APP_REPO_URL: 'https://github.com/example/Taskier-App',
    }),
    'https://github.com/example/Taskier-App',
  )
})

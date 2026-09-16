import assert from 'node:assert/strict'
import test from 'node:test'

import {
  APP_REPORT_SOURCE,
  DYDAN_APP_REPO,
  FEEDBACK_ISSUES_NEW_URL,
  REPORT_ID_PREFIX,
  resolveAppRepoUrl,
} from '../config/ReportDestinations.js'

test('report destinations preserve the current GitHub repository locator', () => {
  assert.equal(DYDAN_APP_REPO, 'https://github.com/alamoudimoh/DyDan-AppWeb')
  assert.equal(
    FEEDBACK_ISSUES_NEW_URL,
    'https://github.com/alamoudimoh/DyDan-AppWeb/issues/new',
  )
  assert.equal(APP_REPORT_SOURCE, 'dydan-app')
  assert.equal(REPORT_ID_PREFIX, 'TD')
})

test('resolveAppRepoUrl accepts an explicit Dydan repository URL', () => {
  assert.equal(
    resolveAppRepoUrl({
      VITE_DYDAN_APP_REPO_URL: 'https://github.com/example/Dydan-App',
    }),
    'https://github.com/example/Dydan-App',
  )
})

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  APP_REPORT_SOURCE,
  FEEDBACK_ISSUES_NEW_URL,
  REPORT_ID_PREFIX,
  TASKIER_APP_REPO,
} from '../config/ReportDestinations.js'

test('report destinations default to Taskier-owned GitHub endpoints', () => {
  assert.equal(TASKIER_APP_REPO, 'https://github.com/alamoudimoh/Taskier-App')
  assert.equal(
    FEEDBACK_ISSUES_NEW_URL,
    'https://github.com/alamoudimoh/Taskier-App/issues/new',
  )
  assert.equal(APP_REPORT_SOURCE, 'taskier-app')
  assert.equal(REPORT_ID_PREFIX, 'TD')
})

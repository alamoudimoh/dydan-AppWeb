import assert from 'node:assert/strict'
import test from 'node:test'

import {
  APP_REPORT_SOURCE,
  FEEDBACK_ISSUES_NEW_URL,
  REPORT_ID_PREFIX,
  DAYDAN_APP_REPO,
} from '../config/ReportDestinations.js'

test('report destinations default to DayDan-owned GitHub endpoints', () => {
  assert.equal(DAYDAN_APP_REPO, 'https://github.com/alamoudimoh/Taskier-App')
  assert.equal(
    FEEDBACK_ISSUES_NEW_URL,
    'https://github.com/alamoudimoh/Taskier-App/issues/new',
  )
  assert.equal(APP_REPORT_SOURCE, 'daydan-app')
  assert.equal(REPORT_ID_PREFIX, 'TD')
})

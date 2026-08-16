import assert from 'node:assert/strict'
import test from 'node:test'

import {
  isOfficialHostedUrl,
  OFFICIAL_HOSTED_DOMAIN,
} from './FeatureToggle.js'

test('official DayDan hosted detection still matches donetick.com URLs', () => {
  assert.equal(OFFICIAL_HOSTED_DOMAIN, 'donetick.com')
  assert.equal(isOfficialHostedUrl('https://api.donetick.com'), true)
  assert.equal(isOfficialHostedUrl('https://APP.DONETICK.COM'), true)
})

test('self-hosted server URLs remain non-official', () => {
  assert.equal(isOfficialHostedUrl('https://tasks.example.test'), false)
  assert.equal(isOfficialHostedUrl(''), false)
})

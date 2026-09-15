import assert from 'node:assert/strict'
import test from 'node:test'

import { isOfficialHostedUrl, OFFICIAL_HOSTED_DOMAIN } from './FeatureToggle.js'

test('without an explicitly configured hosted domain all URLs remain self-hosted', () => {
  assert.equal(OFFICIAL_HOSTED_DOMAIN, '')
  assert.equal(isOfficialHostedUrl('https://tasks.example.test'), false)
  assert.equal(isOfficialHostedUrl(''), false)
})

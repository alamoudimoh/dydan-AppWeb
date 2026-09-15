import assert from 'node:assert/strict'
import test from 'node:test'

import { DYDAN_FCM_CHANNEL_ID } from './notificationChannels.js'

test('Dydan FCM channel id is canonical for new notifications', () => {
  assert.equal(DYDAN_FCM_CHANNEL_ID, 'dydan_notifications')
})

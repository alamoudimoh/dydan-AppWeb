import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DAYDAN_FCM_CHANNEL_ID,
  LEGACY_DONETICK_FCM_CHANNEL_ID,
} from './notificationChannels.js'

test('DayDan FCM channel id is canonical for new notifications', () => {
  assert.equal(DAYDAN_FCM_CHANNEL_ID, 'daydan_notifications')
})

test('legacy Donetick FCM channel id remains available for compatibility', () => {
  assert.equal(LEGACY_DONETICK_FCM_CHANNEL_ID, 'donetick_notifications')
  assert.notEqual(LEGACY_DONETICK_FCM_CHANNEL_ID, DAYDAN_FCM_CHANNEL_ID)
})

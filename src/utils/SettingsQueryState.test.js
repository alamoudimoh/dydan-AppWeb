import assert from 'node:assert/strict'
import test from 'node:test'

import {
  resolveSettingsQueryState,
  SETTINGS_QUERY_STATE,
} from './SettingsQueryState.js'

test('resolveSettingsQueryState returns ready when data exists', () => {
  assert.equal(
    resolveSettingsQueryState({ isLoading: true, hasData: true }),
    SETTINGS_QUERY_STATE.READY,
  )
})

test('resolveSettingsQueryState returns loading while pending without data', () => {
  assert.equal(
    resolveSettingsQueryState({ isLoading: true, hasData: false }),
    SETTINGS_QUERY_STATE.LOADING,
  )
})

test('resolveSettingsQueryState returns error when settled without data', () => {
  assert.equal(
    resolveSettingsQueryState({ isLoading: false, hasData: false }),
    SETTINGS_QUERY_STATE.ERROR,
  )
  assert.equal(
    resolveSettingsQueryState({ isError: true, hasData: false }),
    SETTINGS_QUERY_STATE.ERROR,
  )
})

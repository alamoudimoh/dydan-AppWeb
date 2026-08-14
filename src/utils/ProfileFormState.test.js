import assert from 'node:assert/strict'
import test from 'node:test'

import { initialProfileForm } from './ProfileFormState.js'

test('profile form is not initialized before profile data exists', () => {
  assert.equal(initialProfileForm(undefined), null)
})

test('loaded display name and timezone initialize the editable form together', () => {
  assert.deepEqual(
    initialProfileForm({ displayName: 'Dana', timezone: 'Asia/Riyadh' }),
    { displayName: 'Dana', timezone: 'Asia/Riyadh' },
  )
})

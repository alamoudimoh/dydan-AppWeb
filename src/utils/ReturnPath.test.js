import assert from 'node:assert/strict'
import test from 'node:test'

const sessionStore = new Map()
globalThis.sessionStorage = {
  getItem: key => sessionStore.get(key) ?? null,
  setItem: (key, value) => sessionStore.set(key, String(value)),
  removeItem: key => sessionStore.delete(key),
}

const {
  consumeReturnPath,
  isPublicAppPath,
  isSafeInternalPath,
  storeReturnPath,
} = await import('./ReturnPath.js')

test('isSafeInternalPath rejects auth loops and external URLs', () => {
  assert.equal(isSafeInternalPath('/chores/42'), true)
  assert.equal(isSafeInternalPath('/login'), false)
  assert.equal(isSafeInternalPath('https://evil.test/chores'), false)
  assert.equal(isSafeInternalPath('//evil.test/chores'), false)
})

test('storeReturnPath and consumeReturnPath round-trip safe paths', () => {
  storeReturnPath('/family?tab=goals')
  assert.equal(consumeReturnPath('/chores'), '/family?tab=goals')
})

test('consumeReturnPath falls back when stored path is unsafe', () => {
  sessionStorage.setItem('return_path_pending', '/login')
  assert.equal(consumeReturnPath('/chores'), '/chores')
})

test('isPublicAppPath identifies auth and legal routes', () => {
  assert.equal(isPublicAppPath('/login'), true)
  assert.equal(isPublicAppPath('/auth/oauth2'), true)
  assert.equal(isPublicAppPath('/chores/42'), false)
})

import assert from 'node:assert/strict'
import test, { afterEach, beforeEach } from 'node:test'

import { COPY_ERRORS, copyToClipboard } from './Clipboard.js'

const originalClipboard = global.navigator?.clipboard
const originalDocument = global.document
const originalWindow = global.window

const installCopyEventDocument = () => {
  let copyHandler = null
  let copiedText = ''

  global.document = {
    addEventListener: (event, handler) => {
      if (event === 'copy') copyHandler = handler
    },
    removeEventListener: (event, handler) => {
      if (event === 'copy' && copyHandler === handler) copyHandler = null
    },
    execCommand: command => {
      if (command !== 'copy' || !copyHandler) return false
      copyHandler({
        clipboardData: {
          setData: (type, value) => {
            if (type === 'text/plain') copiedText = value
          },
        },
        preventDefault: () => {},
      })
      return true
    },
    getCopiedText: () => copiedText,
  }

  return () => {
    copiedText = ''
  }
}

beforeEach(() => {
  if (!global.navigator) {
    global.navigator = {}
  }
})

afterEach(() => {
  if (originalClipboard) {
    global.navigator.clipboard = originalClipboard
  } else {
    delete global.navigator.clipboard
  }
  global.document = originalDocument
  global.window = originalWindow
})

test('copyToClipboard rejects empty text', async () => {
  const result = await copyToClipboard('')
  assert.equal(result.ok, false)
  assert.equal(result.error, COPY_ERRORS.EMPTY)
})

test('copyToClipboard uses the Clipboard API in a secure context', async () => {
  let written = ''
  global.navigator.clipboard = {
    writeText: async value => {
      written = value
    },
  }
  Object.defineProperty(global, 'window', {
    configurable: true,
    value: { isSecureContext: true },
  })

  const result = await copyToClipboard('diagnostics')
  assert.equal(result.ok, true)
  assert.equal(written, 'diagnostics')
})

test('copyToClipboard falls back when Clipboard API is unavailable', async () => {
  delete global.navigator.clipboard
  Object.defineProperty(global, 'window', {
    configurable: true,
    value: { isSecureContext: false },
  })

  const resetCopiedText = installCopyEventDocument()

  const result = await copyToClipboard('fallback-copy')
  assert.equal(result.ok, true)
  assert.equal(global.document.getCopiedText(), 'fallback-copy')
  resetCopiedText()
})

test('copyToClipboard falls back when Clipboard API permission is denied', async () => {
  global.navigator.clipboard = {
    writeText: async () => {
      const error = new Error('denied')
      error.name = 'NotAllowedError'
      throw error
    },
  }
  Object.defineProperty(global, 'window', {
    configurable: true,
    value: { isSecureContext: true },
  })

  installCopyEventDocument()

  const result = await copyToClipboard('denied-then-fallback')
  assert.equal(result.ok, true)
  assert.equal(result.method, 'execCommand')
  assert.equal(global.document.getCopiedText(), 'denied-then-fallback')
})

test('copyToClipboard skips Clipboard API on insecure HTTP contexts', async () => {
  let clipboardCalled = false
  global.navigator.clipboard = {
    writeText: async () => {
      clipboardCalled = true
    },
  }
  Object.defineProperty(global, 'window', {
    configurable: true,
    value: { isSecureContext: false },
  })

  installCopyEventDocument()

  const result = await copyToClipboard('http-copy')
  assert.equal(result.ok, true)
  assert.equal(result.method, 'execCommand')
  assert.equal(clipboardCalled, false)
  assert.equal(global.document.getCopiedText(), 'http-copy')
})

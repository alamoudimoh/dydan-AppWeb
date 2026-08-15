import assert from 'node:assert/strict'
import test, { afterEach, beforeEach } from 'node:test'

import { copyToClipboard, COPY_ERRORS } from './Clipboard.js'

const originalClipboard = global.navigator?.clipboard

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

  const originalExecCommand = global.document?.execCommand
  const createdElements = []
  global.document = {
    body: {
      appendChild: node => createdElements.push(node),
      removeChild: node => {
        const index = createdElements.indexOf(node)
        if (index >= 0) createdElements.splice(index, 1)
      },
    },
    createElement: tag => {
      const element = {
        tag,
        value: '',
        style: {},
        focus: () => {},
        select: () => {},
        setSelectionRange: () => {},
        setAttribute: () => {},
      }
      return element
    },
    querySelector: () => createdElements.find(node => node.tag === 'textarea'),
    execCommand: command => command === 'copy',
  }

  const result = await copyToClipboard('fallback-copy')
  assert.equal(result.ok, true)

  if (originalExecCommand) {
    global.document.execCommand = originalExecCommand
  }
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

  const createdElements = []
  global.document = {
    body: {
      appendChild: node => createdElements.push(node),
      removeChild: node => {
        const index = createdElements.indexOf(node)
        if (index >= 0) createdElements.splice(index, 1)
      },
    },
    createElement: tag => {
      const element = {
        tag,
        value: '',
        style: {},
        focus: () => {},
        select: () => {},
        setSelectionRange: () => {},
        setAttribute: () => {},
      }
      return element
    },
    execCommand: command => command === 'copy',
  }

  const result = await copyToClipboard('denied-then-fallback')
  assert.equal(result.ok, true)
  assert.equal(result.method, 'execCommand')
})

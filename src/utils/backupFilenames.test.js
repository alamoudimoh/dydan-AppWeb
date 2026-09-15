import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildDefaultBackupFilename,
  DEFAULT_BACKUP_FILENAME_PREFIX,
} from './backupFilenames.js'

test('default backup export filename uses Dydan prefix', () => {
  assert.equal(
    buildDefaultBackupFilename('2026-08-16T12-00-00'),
    'dydan-backup-2026-08-16T12-00-00.backup',
  )
  assert.equal(DEFAULT_BACKUP_FILENAME_PREFIX, 'dydan-backup')
})

test('legacy Dydan backup filenames remain valid import targets', () => {
  assert.match('dydan-backup-2026-08-16T12-00-00.backup', /\.backup$/)
})

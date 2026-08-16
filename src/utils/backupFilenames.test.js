import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildDefaultBackupFilename,
  DEFAULT_BACKUP_FILENAME_PREFIX,
} from './backupFilenames.js'

test('default backup export filename uses DayDan prefix', () => {
  assert.equal(
    buildDefaultBackupFilename('2026-08-16T12-00-00'),
    'daydan-backup-2026-08-16T12-00-00.backup',
  )
  assert.equal(DEFAULT_BACKUP_FILENAME_PREFIX, 'daydan-backup')
})

test('legacy Donetick backup filenames remain valid import targets', () => {
  assert.match('donetick-backup-2026-08-16T12-00-00.backup', /\.backup$/)
})

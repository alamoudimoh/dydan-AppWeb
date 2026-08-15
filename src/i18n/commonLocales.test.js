import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localesDir = path.resolve(__dirname, '../../public/locales')

const REQUIRED_COMMON_KEYS = [
  'loading',
  'retry',
  'tryAgain',
  'login',
  'loadMore',
  'noMoreHistory',
  'navigation.openMenu',
  'notFound.title',
  'notFound.goToTasks',
  'errors.title',
  'errors.tasksLoadFailed',
  'errors.calendarLoadFailed',
  'errors.projectsLoadFailed',
  'errors.labelsLoadFailed',
  'errors.pleaseTryAgain',
  'errors.copyFailed',
  'errors.rewardsUnavailable',
  'search.noDirectMatchesTitle',
  'search.noDirectMatchesDescription',
]

const getNestedValue = (object, dottedKey) =>
  dottedKey.split('.').reduce((value, key) => value?.[key], object)

test('all supported common locales define shared UI keys', () => {
  const locales = fs
    .readdirSync(localesDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()

  assert.ok(locales.length > 0, 'expected at least one locale directory')

  for (const locale of locales) {
    const commonPath = path.join(localesDir, locale, 'common.json')
    assert.ok(fs.existsSync(commonPath), `${locale}/common.json is missing`)

    const common = JSON.parse(fs.readFileSync(commonPath, 'utf8'))
    const missing = REQUIRED_COMMON_KEYS.filter(
      key => typeof getNestedValue(common, key) !== 'string',
    )

    assert.deepEqual(
      missing,
      [],
      `${locale}/common.json is missing keys: ${missing.join(', ')}`,
    )
  }
})

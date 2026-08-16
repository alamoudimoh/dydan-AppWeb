import assert from 'node:assert/strict'
import test from 'node:test'

import { OFFLINE_DB, STORAGE_KEYS } from './storageKeys.js'

const localStore = new Map()

globalThis.localStorage = {
  getItem: key => localStore.get(key) ?? null,
  setItem: (key, value) => localStore.set(key, String(value)),
  removeItem: key => localStore.delete(key),
  clear: () => localStore.clear(),
}

const resetLocalStorage = () => {
  localStore.clear()
}

const createMemoryIndexedDb = () => {
  const databases = new Map()

  const ensureDb = (name, version) => {
    if (!databases.has(name)) {
      databases.set(name, { version, stores: new Map() })
    }
    const db = databases.get(name)
    for (const storeName of OFFLINE_DB.objectStores) {
      if (!db.stores.has(storeName)) {
        db.stores.set(storeName, new Map())
      }
    }
    db.version = Math.max(db.version || 0, version || 1)
    return db
  }

  return {
    databases: async () =>
      [...databases.entries()].map(([name, db]) => ({
        name,
        version: db.version,
      })),
    seedStore(dbName, storeName, records) {
      const db = ensureDb(dbName, OFFLINE_DB.version)
      const store = db.stores.get(storeName)
      for (const record of records) {
        const key =
          record.id ??
          record.key ??
          `${storeName}-${store.size + 1}`
        store.set(key, structuredClone(record))
      }
    },
    storeRecords(dbName, storeName) {
      const db = databases.get(dbName)
      if (!db) return []
      return [...(db.stores.get(storeName)?.values() || [])]
    },
    open(name, version) {
      const dbRecord = ensureDb(name, version)
      const request = {
        result: null,
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      }

      queueMicrotask(() => {
        const connection = {
          name,
          objectStoreNames: {
            contains: storeName => dbRecord.stores.has(storeName),
          },
          transaction(storeName, mode) {
            const storeData = dbRecord.stores.get(storeName)
            const tx = {
              error: null,
              oncomplete: null,
              onerror: null,
              objectStore() {
                return {
                  count() {
                    const countRequest = {
                      result: storeData.size,
                      onsuccess: null,
                      onerror: null,
                    }
                    queueMicrotask(() => countRequest.onsuccess?.())
                    return countRequest
                  },
                  getAll() {
                    const getAllRequest = {
                      result: [...storeData.values()],
                      onsuccess: null,
                      onerror: null,
                    }
                    queueMicrotask(() => getAllRequest.onsuccess?.())
                    return getAllRequest
                  },
                  put(record) {
                    const key =
                      record.id ??
                      record.key ??
                      `${storeName}-${storeData.size + 1}`
                    storeData.set(key, structuredClone(record))
                    return { onsuccess: null, onerror: null }
                  },
                }
              },
            }
            queueMicrotask(() => tx.oncomplete?.())
            return tx
          },
          close() {},
        }
        request.result = connection
        request.onsuccess?.({ target: request })
      })

      return request
    },
  }
}

const {
  isOfflineDbMigrationComplete,
  markOfflineDbMigrationComplete,
  migrateOfflineIndexedDbIfNeeded,
  readMigratedLocalStorageItem,
  readMigratedLocalStorageJSON,
  writeLocalStorageItem,
  writeLocalStorageJSON,
} = await import('./storageMigration.js')

test('fresh DayDan localStorage reads canonical key only', () => {
  resetLocalStorage()
  writeLocalStorageItem(STORAGE_KEYS.calendarView, 'month')

  assert.equal(
    readMigratedLocalStorageItem(STORAGE_KEYS.calendarView),
    'month',
  )
  assert.equal(
    localStorage.getItem(STORAGE_KEYS.calendarView.canonical),
    'month',
  )
})

test('legacy-only localStorage value migrates to DayDan key', () => {
  resetLocalStorage()
  localStorage.setItem('taskier.calendar.view', 'agenda')

  assert.equal(
    readMigratedLocalStorageItem(STORAGE_KEYS.calendarView),
    'agenda',
  )
  assert.equal(
    localStorage.getItem(STORAGE_KEYS.calendarView.canonical),
    'agenda',
  )
  assert.equal(localStorage.getItem('taskier.calendar.view'), 'agenda')
})

test('DayDan localStorage value wins when legacy also exists', () => {
  resetLocalStorage()
  localStorage.setItem('taskier.dashboard.upcomingRange', '14')
  localStorage.setItem(
    STORAGE_KEYS.dashboardUpcomingRange.canonical,
    '30',
  )

  assert.equal(
    readMigratedLocalStorageItem(STORAGE_KEYS.dashboardUpcomingRange),
    '30',
  )
})

test('localStorage migration is idempotent', () => {
  resetLocalStorage()
  localStorage.setItem('donetick.globalSearch.recents', JSON.stringify(['a']))

  assert.deepEqual(readMigratedLocalStorageJSON(STORAGE_KEYS.globalSearchRecents, []), [
    'a',
  ])
  assert.deepEqual(readMigratedLocalStorageJSON(STORAGE_KEYS.globalSearchRecents, []), [
    'a',
  ])
  assert.equal(
    localStorage.getItem(STORAGE_KEYS.globalSearchRecents.canonical),
    JSON.stringify(['a']),
  )
})

test('writeLocalStorageJSON always uses canonical key', () => {
  resetLocalStorage()
  writeLocalStorageJSON(STORAGE_KEYS.globalSearchRecents, [{ id: '1' }])
  assert.equal(
    localStorage.getItem(STORAGE_KEYS.globalSearchRecents.canonical),
    JSON.stringify([{ id: '1' }]),
  )
})

test('IndexedDB migration copies legacy offline data once', async () => {
  resetLocalStorage()
  const memoryDb = createMemoryIndexedDb()
  globalThis.indexedDB = memoryDb

  memoryDb.seedStore(OFFLINE_DB.legacy, 'cached_chores', [
    { id: 1, data: { id: 1, name: 'Dishes' }, syncVersion: 1, cachedAt: 1 },
  ])
  memoryDb.seedStore(OFFLINE_DB.legacy, 'sync_meta', [
    { key: 'lastSync', value: '123' },
  ])

  await migrateOfflineIndexedDbIfNeeded()
  assert.equal(isOfflineDbMigrationComplete(), true)

  const copiedChores = memoryDb.storeRecords(
    OFFLINE_DB.canonical,
    'cached_chores',
  )
  const copiedMeta = memoryDb.storeRecords(OFFLINE_DB.canonical, 'sync_meta')
  assert.equal(copiedChores.length, 1)
  assert.equal(copiedChores[0].data.name, 'Dishes')
  assert.equal(copiedMeta.length, 1)
  assert.equal(copiedMeta[0].value, '123')
  assert.equal(memoryDb.storeRecords(OFFLINE_DB.legacy, 'cached_chores').length, 1)
})

test('IndexedDB migration prefers existing DayDan database', async () => {
  resetLocalStorage()
  markOfflineDbMigrationComplete()
  const memoryDb = createMemoryIndexedDb()
  globalThis.indexedDB = memoryDb

  memoryDb.seedStore(OFFLINE_DB.canonical, 'cached_chores', [
    { id: 9, data: { id: 9, name: 'Canonical' }, syncVersion: 2, cachedAt: 2 },
  ])
  memoryDb.seedStore(OFFLINE_DB.legacy, 'cached_chores', [
    { id: 1, data: { id: 1, name: 'Legacy' }, syncVersion: 1, cachedAt: 1 },
  ])

  resetLocalStorage()
  await migrateOfflineIndexedDbIfNeeded()

  const canonical = memoryDb.storeRecords(OFFLINE_DB.canonical, 'cached_chores')
  assert.equal(canonical.length, 1)
  assert.equal(canonical[0].data.name, 'Canonical')
})

test('IndexedDB migration is idempotent', async () => {
  resetLocalStorage()
  const memoryDb = createMemoryIndexedDb()
  globalThis.indexedDB = memoryDb

  memoryDb.seedStore(OFFLINE_DB.legacy, 'cached_chores', [
    { id: 2, data: { id: 2, name: 'Laundry' }, syncVersion: 1, cachedAt: 1 },
  ])

  await migrateOfflineIndexedDbIfNeeded()
  await migrateOfflineIndexedDbIfNeeded()

  const copied = memoryDb.storeRecords(OFFLINE_DB.canonical, 'cached_chores')
  assert.equal(copied.length, 1)
  assert.equal(copied[0].data.name, 'Laundry')
})

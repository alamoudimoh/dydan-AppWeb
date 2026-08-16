import { OFFLINE_DB } from './storageKeys.js'

const getLocalStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage
  }
  return null
}

const hasLocalStorage = () => Boolean(getLocalStorage())

export const isOfflineDbMigrationComplete = () => {
  const storage = getLocalStorage()
  return storage?.getItem(OFFLINE_DB.migrationFlag) === '1'
}

export const markOfflineDbMigrationComplete = () => {
  const storage = getLocalStorage()
  if (!storage) return
  storage.setItem(OFFLINE_DB.migrationFlag, '1')
}

export const readMigratedLocalStorageItem = ({ canonical, legacy = [] }) => {
  const storage = getLocalStorage()
  if (!storage) return null

  const current = storage.getItem(canonical)
  if (current !== null) return current

  for (const legacyKey of legacy) {
    const legacyValue = storage.getItem(legacyKey)
    if (legacyValue !== null) {
      storage.setItem(canonical, legacyValue)
      return legacyValue
    }
  }

  return null
}

export const writeLocalStorageItem = ({ canonical }, value) => {
  const storage = getLocalStorage()
  if (!storage) return
  storage.setItem(canonical, value)
}

export const readMigratedLocalStorageJSON = (keyConfig, fallback) => {
  const raw = readMigratedLocalStorageItem(keyConfig)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export const writeLocalStorageJSON = (keyConfig, value) => {
  writeLocalStorageItem(keyConfig, JSON.stringify(value))
}

const openIndexedDb = (name, version) =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version)
    request.onupgradeneeded = event => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('cached_chores')) {
        db.createObjectStore('cached_chores', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('command_queue')) {
        const cmdStore = db.createObjectStore('command_queue', {
          keyPath: 'id',
          autoIncrement: true,
        })
        cmdStore.createIndex('entity_id', 'entityId', { unique: false })
        cmdStore.createIndex('created_at', 'createdAt', { unique: false })
        cmdStore.createIndex('status', 'status', { unique: false })
      }
      if (!db.objectStoreNames.contains('sync_meta')) {
        db.createObjectStore('sync_meta', { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains('cached_history')) {
        const histStore = db.createObjectStore('cached_history', {
          keyPath: 'id',
        })
        histStore.createIndex('chore_id', 'choreId', { unique: false })
        histStore.createIndex('performed_at', 'performedAt', {
          unique: false,
        })
        histStore.createIndex('pending', 'pending', { unique: false })
      }
    }
    request.onsuccess = event => resolve(event.target.result)
    request.onerror = event => reject(event.target.error)
  })

const idbRequest = request =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const idbStoreCount = async (db, storeName) => {
  if (!db.objectStoreNames.contains(storeName)) return 0
  const tx = db.transaction(storeName, 'readonly')
  return idbRequest(tx.objectStore(storeName).count())
}

const idbDatabaseHasRecords = async (db, storeNames) => {
  for (const storeName of storeNames) {
    if ((await idbStoreCount(db, storeName)) > 0) return true
  }
  return false
}

const listIndexedDbNames = async () => {
  if (typeof indexedDB === 'undefined') return []
  if (typeof indexedDB.databases === 'function') {
    const databases = await indexedDB.databases()
    return databases.map(entry => entry.name).filter(Boolean)
  }
  return []
}

const copyIndexedDbStore = async (sourceDb, targetDb, storeName) => {
  if (!sourceDb.objectStoreNames.contains(storeName)) return
  if (!targetDb.objectStoreNames.contains(storeName)) return

  const sourceTx = sourceDb.transaction(storeName, 'readonly')
  const records = await idbRequest(sourceTx.objectStore(storeName).getAll())

  const targetTx = targetDb.transaction(storeName, 'readwrite')
  const targetStore = targetTx.objectStore(storeName)
  for (const record of records) {
    targetStore.put(record)
  }

  await new Promise((resolve, reject) => {
    targetTx.oncomplete = () => resolve()
    targetTx.onerror = () => reject(targetTx.error)
  })
}

export const migrateOfflineIndexedDbIfNeeded = async () => {
  if (typeof indexedDB === 'undefined') return
  if (isOfflineDbMigrationComplete()) return

  const knownNames = await listIndexedDbNames()
  const legacyExists =
    knownNames.length === 0 || knownNames.includes(OFFLINE_DB.legacy)

  const targetDb = await openIndexedDb(
    OFFLINE_DB.canonical,
    OFFLINE_DB.version,
  )
  const targetHasRecords = await idbDatabaseHasRecords(
    targetDb,
    OFFLINE_DB.objectStores,
  )

  if (targetHasRecords) {
    targetDb.close()
    markOfflineDbMigrationComplete()
    return
  }

  if (!legacyExists) {
    targetDb.close()
    markOfflineDbMigrationComplete()
    return
  }

  let legacyDb
  try {
    legacyDb = await openIndexedDb(OFFLINE_DB.legacy, OFFLINE_DB.version)
    for (const storeName of OFFLINE_DB.objectStores) {
      await copyIndexedDbStore(legacyDb, targetDb, storeName)
    }
  } finally {
    legacyDb?.close()
    targetDb.close()
  }

  markOfflineDbMigrationComplete()
}

const sqliteTableNames = [
  'cached_chores',
  'command_queue',
  'sync_meta',
  'cached_history',
]

const sqliteCountRows = async (CapacitorSQLite, database, table) => {
  try {
    const result = await CapacitorSQLite.query({
      database,
      statement: `SELECT COUNT(*) AS count FROM ${table}`,
      values: [],
    })
    const row = (result?.values || []).find(
      entry => entry && typeof entry === 'object' && !('ios_columns' in entry),
    )
    return Number(row?.count || 0)
  } catch {
    return 0
  }
}

const sqliteDatabaseHasRecords = async (CapacitorSQLite, database) => {
  for (const table of sqliteTableNames) {
    if ((await sqliteCountRows(CapacitorSQLite, database, table)) > 0) {
      return true
    }
  }
  return false
}

const openSqliteDatabase = async (CapacitorSQLite, database) => {
  try {
    await CapacitorSQLite.createConnection({
      database,
      version: OFFLINE_DB.version,
      encrypted: false,
      mode: 'no-encryption',
    })
  } catch (err) {
    if (!err?.message?.includes('already exists')) throw err
  }
  await CapacitorSQLite.open({ database })
}

const copySqliteTable = async (
  CapacitorSQLite,
  sourceDb,
  targetDb,
  table,
) => {
  const result = await CapacitorSQLite.query({
    database: sourceDb,
    statement: `SELECT * FROM ${table}`,
    values: [],
  })
  const rows = (result?.values || []).filter(
    row => row && typeof row === 'object' && !('ios_columns' in row),
  )
  if (!rows.length) return

  for (const row of rows) {
    const columns = Object.keys(row)
    const placeholders = columns.map(() => '?').join(', ')
    await CapacitorSQLite.run({
      database: targetDb,
      statement: `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      values: columns.map(column => row[column]),
    })
  }
}

export const migrateNativeOfflineSqliteIfNeeded = async CapacitorSQLite => {
  if (isOfflineDbMigrationComplete()) return

  const targetHasRecords = await sqliteDatabaseHasRecords(
    CapacitorSQLite,
    OFFLINE_DB.canonical,
  )
  if (targetHasRecords) {
    markOfflineDbMigrationComplete()
    return
  }

  let legacyHasRecords = false
  try {
    await openSqliteDatabase(CapacitorSQLite, OFFLINE_DB.legacy)
    legacyHasRecords = await sqliteDatabaseHasRecords(
      CapacitorSQLite,
      OFFLINE_DB.legacy,
    )
  } catch {
    legacyHasRecords = false
  }

  if (!legacyHasRecords) {
    markOfflineDbMigrationComplete()
    return
  }

  for (const table of sqliteTableNames) {
    await copySqliteTable(
      CapacitorSQLite,
      OFFLINE_DB.legacy,
      OFFLINE_DB.canonical,
      table,
    )
  }

  markOfflineDbMigrationComplete()
}

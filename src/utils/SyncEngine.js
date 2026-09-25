import { networkManager } from '../hooks/NetworkManager'
import { apiClient } from './ApiClient'
import { syncOfflineImages } from './ImageCache'
import { offlineDB } from './OfflineDB'
import { isOfflineFeatureEnabled } from './OfflineFeatureToggle'

class SyncEngine {
  constructor() {
    this.isSyncing = false
    this.listeners = []
    // The run currently in flight, and the single follow-up run queued behind
    // it. See sync() for why a follow-up is needed rather than just waiting.
    this.inFlight = null
    this.queued = null
  }

  // Register listener for sync state changes
  onSyncStateChange(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  _notify(state) {
    this.listeners.forEach(cb => cb(state))
  }

  // Main sync entry point — returns true if sync succeeded, false otherwise.
  //
  // Concurrent callers are coalesced rather than dropped. Returning early while
  // another run is in flight used to lose writes: that run's /sync/changes
  // request may have been issued *before* the caller's change reached the
  // server, so its cursor skips past the change and the caller reads a cache
  // that will never contain it until something else triggers a sync. That is
  // why a task created from the modal could vanish on the refetch right after
  // it was created. Waiting for the in-flight run is not enough for the same
  // reason, so callers that arrive mid-run share one follow-up run instead.
  async sync() {
    if (!isOfflineFeatureEnabled()) return false

    if (this.inFlight) {
      if (!this.queued) {
        this.queued = this.inFlight
          .catch(() => false)
          .then(() => {
            this.queued = null
            return this.sync()
          })
      }
      return this.queued
    }

    this.inFlight = this._runSync().finally(() => {
      this.inFlight = null
    })
    return this.inFlight
  }

  async _runSync() {
    this.isSyncing = true
    this._notify({ syncing: true, error: null })

    try {
      // The application has no offline mutation producer. Sync is therefore a
      // read-only delta refresh of the local cache, not a dormant command queue.
      await this._deltaSync()

      // Sync succeeded — server is reachable (only sync success restores online status)
      networkManager.setServerReachable()
      this._notify({ syncing: false, lastSync: Date.now() })
      // Reconcile the offline image store against the full cached chore list
      // (prefetch referenced images, evict ones no longer referenced).
      // Fire-and-forget: image downloads must not block or fail the sync.
      offlineDB
        .getChores(true)
        .then(chores => syncOfflineImages(chores || []))
        .catch(() => {})
      return true
    } catch (err) {
      console.error('Sync failed:', err)
      this._notify({ syncing: false, error: err.message })
      return false
    } finally {
      this.isSyncing = false
    }
  }

  async _deltaSync() {
    const cursor = (await offlineDB.getSyncCursor()) || -1

    let hasMore = true
    let currentCursor = cursor

    while (hasMore && networkManager.deviceOnline) {
      // Use apiClient.get which handles auth and returns a fetch Response
      const response = await apiClient.get(
        `/sync/changes?since=${currentCursor}`,
      )

      if (!response || !response.ok) {
        const error = new Error(
          response
            ? `Delta sync failed: ${response.status}`
            : 'Delta sync failed: no response from server',
        )
        error.status = response?.status
        throw error
      }

      const data = await response.json()

      // Upsert changed chores first
      const changedChores = data.changes?.chores ?? []
      if (changedChores.length > 0) {
        await offlineDB.saveChores(changedChores)
      }

      // Upsert changed history entries (also clears any pending entries for the same chore IDs)
      const changedHistory = data.changes?.choreHistories ?? []
      if (changedHistory.length > 0) {
        await offlineDB.saveHistory(changedHistory)
      }

      // Hard-delete removed IDs after inserts (safe if the same ID somehow appears in both)
      const deletedIds = data.deletions?.chores ?? []
      if (deletedIds.length > 0) {
        await offlineDB.deleteChores(deletedIds)
      }

      const deletedHistoryIds = data.deletions?.choreHistories ?? []
      if (deletedHistoryIds.length > 0) {
        await offlineDB.deleteHistory(deletedHistoryIds)
      }

      // Always advance the cursor, even when there are no changes
      if (data.cursor != null) {
        currentCursor = data.cursor
      }

      hasMore = !!data.hasMore
    }

    await offlineDB.setSyncCursor(currentCursor)
    await offlineDB.setLastSyncTime(Date.now())
  }

  // Cache current chores (call after a successful online fetch).
  // Pass complete: true only when `chores` is the *full* list (including
  // archived) — then cached rows missing from it are server-side deletions
  // and get removed, so the offline cache doesn't keep ghost chores.
  async cacheChores(chores, { complete = false } = {}) {
    if (!isOfflineFeatureEnabled()) return
    if (!chores || chores.length === 0) return
    await offlineDB.saveChores(chores)

    if (complete) {
      try {
        const fetchedIds = new Set(chores.map(chore => String(chore.id)))
        const cached = await offlineDB.getChores(true)
        const staleIds = (cached || [])
          .filter(
            chore =>
              chore?.id != null &&
              !String(chore.id).startsWith('temp_') &&
              !fetchedIds.has(String(chore.id)),
          )
          .map(chore => chore.id)
        if (staleIds.length > 0) {
          await offlineDB.deleteChores(staleIds)
        }
      } catch (err) {
        console.error('Failed to reconcile cached chores', err)
      }
    }
    // Fire-and-forget: keep the offline image store in step with the data.
    // Reconcile against the *full* cached list — the passed list may exclude
    // archived chores, and eviction must only run against everything we have.
    offlineDB
      .getChores(true)
      .then(all => syncOfflineImages(all || []))
      .catch(() => {})
  }
}

export const syncEngine = new SyncEngine()

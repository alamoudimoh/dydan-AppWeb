import {
  readLocalStorageItem,
  removeLocalStorageItem,
  writeLocalStorageItem,
} from './storage.js'
import { STORAGE_KEYS } from './storageKeys.js'

/**
 * Device-local proof that a user has signed in on this browser.
 *
 * The web keeps its access token in memory only and restores it after a
 * reload through the server's HttpOnly refresh cookie, so a reload that
 * starts with NO cookie and a reload whose cookie was just rejected look
 * identical to the app. This marker is the only honest way to distinguish
 * "fresh visitor, redirect to login" from "signed-in user whose restore
 * failed, keep them on the page and let them sign back in".
 *
 * It is set whenever a session is established, cleared on logout/session
 * teardown, and never contains anything sensitive.
 */
export const markSignedIn = () => {
  writeLocalStorageItem(STORAGE_KEYS.signedIn, '1')
}

export const clearSignedIn = () => {
  removeLocalStorageItem(STORAGE_KEYS.signedIn)
}

export const wasSignedIn = () =>
  readLocalStorageItem(STORAGE_KEYS.signedIn) === '1'

const getLocalStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage)
    return window.localStorage
  if (typeof globalThis !== 'undefined' && globalThis.localStorage)
    return globalThis.localStorage
  return null
}

export const readLocalStorageItem = ({ canonical }) =>
  getLocalStorage()?.getItem(canonical) ?? null

export const writeLocalStorageItem = ({ canonical }, value) => {
  getLocalStorage()?.setItem(canonical, value)
}

export const readLocalStorageJSON = (keyConfig, fallback) => {
  const raw = readLocalStorageItem(keyConfig)
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

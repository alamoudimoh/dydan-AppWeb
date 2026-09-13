// Vitest 4 (pool=forks) + jsdom 25 + the Node webstorage experiment expose no
// working localStorage. Provide a spec-compliant in-memory shim once, so every
// test file shares the same storage instead of stubbing per file. Real-browser
// behavior is untouched; the shim only fills the missing environment globals.
const createStorage = () => {
  const store = new Map()
  return {
    getItem: key => (store.has(String(key)) ? store.get(String(key)) : null),
    setItem: (key, value) => {
      store.set(String(key), String(value))
    },
    removeItem: key => {
      store.delete(String(key))
    },
    clear: () => {
      store.clear()
    },
    key: index => [...store.keys()][index] ?? null,
    get length() {
      return store.size
    },
  }
}

const ensureStorage = () => {
  if (typeof localStorage === 'undefined') {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createStorage(),
      configurable: true,
    })
  }
  if (typeof window !== 'undefined' && !window.localStorage) {
    Object.defineProperty(window, 'localStorage', {
      value: createStorage(),
      configurable: true,
    })
  }
}

ensureStorage()

export { createStorage }
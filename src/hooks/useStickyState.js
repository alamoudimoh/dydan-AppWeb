import { useEffect, useState } from 'react'

const useStickyState = (defaultValue, key) => {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key)
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

export default useStickyState

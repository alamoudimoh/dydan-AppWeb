import { useColorScheme } from '@mui/joy'
import { useEffect } from 'react'

import { useProductTheme } from '../contexts/ThemeContext'
import statusBarManager from '../utils/StatusBarManager'

/**
 * Custom hook to manage status bar integration with Joy UI themes
 * This hook automatically syncs the status bar style with the current theme
 */
export const useStatusBar = () => {
  const { mode, systemMode } = useColorScheme()
  const { presentationReady } = useProductTheme()

  useEffect(() => {
    if (!presentationReady) return
    // Initialize status bar on mount
    const initializeStatusBar = async () => {
      await statusBarManager.initialize(mode)
    }

    initializeStatusBar()

    // Cleanup on unmount
    return () => {
      statusBarManager.cleanup()
    }
  }, [mode, presentationReady])

  useEffect(() => {
    if (!presentationReady) return
    // Update status bar when theme changes
    const updateStatusBarTheme = async () => {
      let resolvedTheme = mode

      // Handle system mode by using the detected system theme
      if (mode === 'system') {
        resolvedTheme = systemMode || 'light'
      }

      // Update the status bar with the resolved theme
      await statusBarManager.updateResolvedTheme(resolvedTheme)

      // Notify any custom listeners
      statusBarManager.notifyThemeChange(resolvedTheme)
    }

    updateStatusBarTheme()
  }, [mode, presentationReady, systemMode])

  return {
    statusBarManager,
    currentTheme: mode,
    resolvedTheme: mode === 'system' ? systemMode : mode,
  }
}

export default useStatusBar

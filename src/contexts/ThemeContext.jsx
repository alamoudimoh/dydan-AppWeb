import { CssBaseline, GlobalStyles } from '@mui/joy'
import { CssVarsProvider, useColorScheme } from '@mui/joy/styles'
import PropTypes from 'prop-types'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { APP_BRAND_ID } from '@/config/AppBranding'
import { createProductTheme, getProductGlobalStyles } from '@/theme/dydanTheme'
import { resolveProductBrand } from '@/theme/tokens'
import { readLocalStorageItem, writeLocalStorageItem } from '@/utils/storage'
import { STORAGE_KEYS } from '@/utils/storageKeys'

export const THEME_MODES = ['light', 'dark', 'system']
export const THEME_BRANDS = ['dydan', 'sovereign']

const ProductThemeContext = createContext(null)

const readThemeMode = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('themeMode'))
    return THEME_MODES.includes(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

/**
 * Bridges the persisted mode (themeMode) into Joy's color-scheme switch.
 * Must live inside CssVarsProvider so useColorScheme() resolves.
 */
const SchemeBridge = () => {
  const { mode } = useProductTheme()
  const { setMode } = useColorScheme()
  useEffect(() => {
    setMode(mode)
  }, [mode, setMode])
  return null
}

const ThemeContext = ({ children }) => {
  const [brand, setBrandState] = useState(() => {
    const stored = readLocalStorageItem(STORAGE_KEYS.productTheme)
    return stored === 'sovereign' ? 'sovereign' : APP_BRAND_ID
  })
  const [mode, setModeState] = useState(readThemeMode)

  // Keep the CSS shell layer (index.css [data-theme=...]) in sync. main.jsx
  // sets the attribute for the first paint; this covers runtime switching.
  useEffect(() => {
    document.documentElement.dataset.theme = brand
    return undefined
  }, [brand])

  const setBrand = useCallback(value => {
    const next = resolveProductBrand(value)
    setBrandState(next)
    writeLocalStorageItem(STORAGE_KEYS.productTheme, next)
  }, [])

  const setMode = useCallback(value => {
    const next = THEME_MODES.includes(value) ? value : 'system'
    setModeState(next)
    localStorage.setItem('themeMode', JSON.stringify(next))
  }, [])

  const theme = useMemo(() => createProductTheme(brand), [brand])
  const productGlobalStyles = useMemo(
    () => getProductGlobalStyles(brand),
    [brand],
  )
  const contextValue = useMemo(
    () => ({ brand, mode, setBrand, setMode }),
    [brand, mode, setBrand, setMode],
  )

  return (
    <ProductThemeContext.Provider value={contextValue}>
      <CssVarsProvider
        theme={theme}
        defaultMode={mode === 'system' ? 'system' : mode}
      >
        <CssBaseline />
        <GlobalStyles styles={productGlobalStyles} />
        <SchemeBridge />
        {children}
      </CssVarsProvider>
    </ProductThemeContext.Provider>
  )
}

export const useProductTheme = () => {
  const value = useContext(ProductThemeContext)
  if (!value) {
    throw new Error('useProductTheme must be used within ThemeContext')
  }
  return value
}

ThemeContext.propTypes = {
  children: PropTypes.node,
}

export default ThemeContext

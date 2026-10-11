import { useColorScheme } from '@mui/joy/styles'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
} from 'react'

/* ─────────────────────────────────────────────
   ThemeContext — production pattern
   brand : "dydan" | "sovereign"  (identity + token set)
   mode  : "light"  | "dark"       (follows brand by default)
   Also carries product-lens (view) and persona so the
   whole product state lives behind stable hooks.
───────────────────────────────────────────── */

export type Brand = 'dydan' | 'sovereign'
export type Mode = 'light' | 'dark' | 'system'
export type View = 'quest' | 'focus'
export type Persona = 'parent' | 'child' | 'solo'

type ThemeState = {
  brand: Brand
  setBrand: (b: Brand) => void
  mode: Mode
  setMode: (m: Mode) => void
  resolvePresentation: (brand: Brand, mode: Mode) => void
  suspendPresentation: () => void
  presentationReady: boolean
  view: View
  setView: (v: View) => void
  persona: Persona
  setPersona: (p: Persona) => void
}

const ThemeCtx = createContext<ThemeState | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [brand, setBrandState] = useState<Brand>('dydan')
  const [mode, setMode] = useState<Mode>('light')
  const [presentationResolved, setPresentationResolved] = useState(false)
  const { mode: joyMode, setMode: setJoyMode } = useColorScheme()
  const [view, setView] = useState<View>('focus')
  const [persona, setPersonaState] = useState<Persona>('parent')

  /* Sovereign is a dark-native identity; dydan is light-native. */
  const setBrand = useCallback((b: Brand) => {
    setBrandState(b)
    setMode(b === 'sovereign' ? 'dark' : 'light')
  }, [])

  // No browser cache is authoritative or reused across accounts. The shell
  // resolves the session first, then supplies the current server preference.
  const resolvePresentation = useCallback((b: Brand, m: Mode) => {
    setBrandState(b)
    setMode(m)
    setPresentationResolved(true)
  }, [])
  const suspendPresentation = useCallback(() => {
    document.documentElement.dataset['presentation'] = 'pending'
    setPresentationResolved(false)
  }, [])

  /* Children only ever see the Quest lens. */
  const setPersona = useCallback((p: Persona) => {
    setPersonaState(p)
    setView(p === 'child' ? 'quest' : 'focus')
  }, [])

  /* Drive the CSS token set + Joy color scheme. */
  useLayoutEffect(() => {
    if (!presentationResolved) return
    const html = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolvedMode =
        mode === 'system' ? (media.matches ? 'dark' : 'light') : mode
      html.setAttribute('data-joy-color-scheme', resolvedMode)
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute(
          'content',
          getComputedStyle(html).getPropertyValue('--page').trim(),
        )
    }
    const wasVisible = html.dataset['presentation'] === 'ready'
    if (wasVisible) document.body.classList.add('theme-transitioning')
    if (brand === 'sovereign') html.setAttribute('data-theme', 'sovereign')
    else html.removeAttribute('data-theme')
    apply()
    // Joy also owns component styling and native status-bar appearance.
    // Both owners must agree before any themed content becomes visible.
    setJoyMode(mode)
    if (joyMode === mode) html.dataset['presentation'] = 'ready'
    if (mode === 'system') media.addEventListener('change', apply)
    const t = setTimeout(
      () => document.body.classList.remove('theme-transitioning'),
      350,
    )
    return () => {
      clearTimeout(t)
      media.removeEventListener('change', apply)
    }
  }, [brand, joyMode, mode, presentationResolved, setJoyMode])

  return (
    <ThemeCtx.Provider
      value={{
        brand,
        setBrand,
        mode,
        setMode,
        resolvePresentation,
        suspendPresentation,
        presentationReady: presentationResolved && joyMode === mode,
        view,
        setView,
        persona,
        setPersona,
      }}
    >
      {children}
    </ThemeCtx.Provider>
  )
}

function useThemeState() {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('Theme hooks must be used within <ThemeProvider>')
  return ctx
}

/* Production-style granular hooks */
export function useProductBrand() {
  const { brand, setBrand } = useThemeState()
  return { brand, setBrand }
}
export function useProductTheme() {
  const {
    mode,
    presentationReady,
    resolvePresentation,
    setMode,
    suspendPresentation,
  } = useThemeState()
  return {
    mode,
    presentationReady,
    resolvePresentation,
    setMode,
    suspendPresentation,
  }
}
export function useProductView() {
  const { setView, view } = useThemeState()
  return { view, setView }
}
export function useProductPersona() {
  const { persona, setPersona } = useThemeState()
  return { persona, setPersona }
}

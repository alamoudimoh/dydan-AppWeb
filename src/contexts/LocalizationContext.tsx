import '../i18n'

import type { TFunction } from 'i18next'
import moment from 'moment'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'

/* ─────────────────────────────────────────────
   LocalizationContext — language + direction + formatting
   Real RTL: mirrors layout via dir="rtl" and swaps
   Cairo as the Arabic-glyph fallback after Comfortaa.
   Provides both approved-ui simple API and real app extended API.
───────────────────────────────────────────── */

export type Lang =
  'en' | 'ar' | 'ar-SA' | 'fr' | 'de' | 'es' | 'zh-CN' | 'pt' | 'ja'

export const DATE_FORMATS = {
  MDY: 'MM/DD/YYYY',
  DMY: 'DD/MM/YYYY',
  YMD: 'YYYY-MM-DD',
  LONG: 'MMMM D, YYYY',
  SHORT: 'MMM D, YYYY',
} as const

export const TIME_FORMATS = {
  HOUR_12: 'h:mm A',
  HOUR_24: 'HH:mm',
} as const

export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية' },
] as const

const resolveIntlLocale = (lang: Lang) =>
  lang.replace('-SA', '').replace('-CN', '-CN').toLowerCase()

type LocalizationState = {
  /* Approved-ui simple API */
  lang: Lang
  isRTL: boolean
  setLang: (l: Lang) => void
  toggleLang: () => void
  t: TFunction

  /* Real app extended API */
  language: Lang
  setLanguage: (l: Lang) => void
  dateFormat: (typeof DATE_FORMATS)[keyof typeof DATE_FORMATS]
  setDateFormat: (f: (typeof DATE_FORMATS)[keyof typeof DATE_FORMATS]) => void
  timeFormat: (typeof TIME_FORMATS)[keyof typeof TIME_FORMATS]
  setTimeFormat: (f: (typeof TIME_FORMATS)[keyof typeof TIME_FORMATS]) => void
  firstDayOfWeek: number
  setFirstDayOfWeek: (d: number) => void
  fmt: {
    formatDate: (date: string | Date | null, format?: string) => string
    formatTime: (date: string | Date | null, format?: string) => string
    formatIntlDateTime: (
      date: string | Date | null,
      options?: Intl.DateTimeFormatOptions,
    ) => string
    intlLocale: string
  }
}

const LocalizationCtx = createContext<LocalizationState | null>(null)

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const { i18n, t } = useTranslation()
  const [lang, setLangState] = useState<Lang>('en')
  const [dateFormat, setDateFormatState] = useState<
    (typeof DATE_FORMATS)[keyof typeof DATE_FORMATS]
  >(DATE_FORMATS.MDY)
  const [timeFormat, setTimeFormatState] = useState<
    (typeof TIME_FORMATS)[keyof typeof TIME_FORMATS]
  >(TIME_FORMATS.HOUR_12)
  const [firstDayOfWeek, setFirstDayOfWeekState] = useState<number>(0)
  const isRTL = lang.startsWith('ar')

  useEffect(() => {
    i18n.changeLanguage(lang)
    const momentLocale = lang.toLowerCase().startsWith('zh')
      ? 'zh-cn'
      : lang.toLowerCase().startsWith('pt')
        ? 'pt-br'
        : lang.split('-')[0]
    moment.locale(momentLocale)
  }, [lang, i18n])

  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('dir', isRTL ? 'rtl' : 'ltr')
    html.setAttribute('lang', lang)
  }, [lang, isRTL])

  const setLang = useCallback((l: Lang) => setLangState(l), [])
  const toggleLang = useCallback(
    () => setLangState(l => (l.startsWith('ar') ? 'en' : 'ar-SA')),
    [],
  )
  const setLanguage = useCallback((l: Lang) => setLangState(l), [])

  const setDateFormat = useCallback(
    (f: (typeof DATE_FORMATS)[keyof typeof DATE_FORMATS]) =>
      setDateFormatState(f),
    [],
  )
  const setTimeFormat = useCallback(
    (f: (typeof TIME_FORMATS)[keyof typeof TIME_FORMATS]) =>
      setTimeFormatState(f),
    [],
  )
  const setFirstDayOfWeek = useCallback(
    (d: number) => setFirstDayOfWeekState(d),
    [],
  )

  const fmt = useMemo(
    () => ({
      formatDate: (date: string | Date | null, format?: string) => {
        if (!date) return ''
        return moment(date).format(format ?? dateFormat)
      },
      formatTime: (date: string | Date | null, format?: string) => {
        if (!date) return ''
        return moment(date).format(format ?? timeFormat)
      },
      formatIntlDateTime: (
        date: string | Date | null,
        options?: Intl.DateTimeFormatOptions,
      ) => {
        if (!date) return ''
        const value = date instanceof Date ? date : new Date(date)
        if (Number.isNaN(value.getTime())) return ''
        return new Intl.DateTimeFormat(resolveIntlLocale(lang), options).format(
          value,
        )
      },
      intlLocale: resolveIntlLocale(lang),
    }),
    [lang, dateFormat, timeFormat],
  )

  const value = useMemo<LocalizationState>(
    () => ({
      lang,
      isRTL,
      setLang,
      toggleLang,
      t,
      language: lang,
      setLanguage,
      dateFormat,
      setDateFormat,
      timeFormat,
      setTimeFormat,
      firstDayOfWeek,
      setFirstDayOfWeek,
      fmt,
    }),
    [
      lang,
      isRTL,
      dateFormat,
      timeFormat,
      firstDayOfWeek,
      t,
      fmt,
      setLang,
      toggleLang,
      setLanguage,
      setDateFormat,
      setTimeFormat,
      setFirstDayOfWeek,
    ],
  )

  return (
    <LocalizationCtx.Provider value={value}>
      {children}
    </LocalizationCtx.Provider>
  )
}

export function useLocalization() {
  const ctx = useContext(LocalizationCtx)
  if (!ctx)
    throw new Error(
      'useLocalization must be used within <LocalizationProvider>',
    )
  return ctx
}

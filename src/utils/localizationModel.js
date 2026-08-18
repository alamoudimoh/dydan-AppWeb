export const INTL_LOCALE_MAP = Object.freeze({
  en: 'en-US',
  'ar-SA': 'ar-SA',
  ar: 'ar-SA',
  de: 'de-DE',
  es: 'es-ES',
  'es-ES': 'es-ES',
  fr: 'fr-FR',
  'fr-FR': 'fr-FR',
  nl: 'nl-NL',
  ja: 'ja-JP',
  pt: 'pt-BR',
  'zh-CN': 'zh-CN',
  zh: 'zh-CN',
})

/**
 * Maps app language codes to Intl-compatible locale tags.
 */
export const resolveIntlLocale = language => {
  if (!language) return INTL_LOCALE_MAP.en
  if (INTL_LOCALE_MAP[language]) return INTL_LOCALE_MAP[language]
  const base = String(language).split('-')[0]
  return INTL_LOCALE_MAP[base] || language
}

export const LANGUAGE_CODES = Object.freeze([
  'ar-SA',
  'de',
  'en',
  'es',
  'fr',
  'nl',
  'ja',
  'pt',
  'zh-CN',
])

/**
 * Localized language label with nativeName fallback from catalog metadata.
 */
export const getLanguageDisplayName = (code, t, catalog = []) => {
  const key = `localization.languages.${code}`
  const translated = t(key, { defaultValue: '' })
  if (translated) return translated

  const meta = catalog.find(lang => lang.code === code)
  return meta?.nativeName || code
}

export const RTL_BASE_LANGUAGES = Object.freeze(['ar', 'he', 'fa', 'ur'])

/**
 * Resolves the document direction ('rtl' | 'ltr') for a language code.
 */
export const resolveDirection = language =>
  RTL_BASE_LANGUAGES.includes(String(language).split('-')[0]) ? 'rtl' : 'ltr'

export const CALENDAR_LABEL_KEYS = Object.freeze({
  sameDay: 'common:dates.today',
  nextDay: 'common:dates.tomorrow',
  lastDay: 'common:dates.yesterday',
  lastWeek: 'common:dates.last',
})

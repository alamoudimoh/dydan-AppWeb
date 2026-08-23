import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

// Moment locale packs are loaded on demand (they add up to a significant
// share of the initial bundle). Maps a requested language to the closest
// available moment locale pack.
const MOMENT_LOCALE_PACKS = {
  ar: () => import('moment/locale/ar'),
  de: () => import('moment/locale/de'),
  es: () => import('moment/locale/es'),
  fr: () => import('moment/locale/fr'),
  ja: () => import('moment/locale/ja'),
  nl: () => import('moment/locale/nl'),
  'pt-br': () => import('moment/locale/pt-br'),
  pt: () => import('moment/locale/pt-br'),
  'zh-cn': () => import('moment/locale/zh-cn'),
  zh: () => import('moment/locale/zh-cn'),
}

const loadedMomentLocales = new Set()

export const loadMomentLocale = language => {
  const key = String(language || '').toLowerCase()
  const pack =
    MOMENT_LOCALE_PACKS[key] ||
    // Fall back to the base language for regional variants (e.g. ar-SA -> ar).
    MOMENT_LOCALE_PACKS[key.split('-')[0]]
  if (!pack || loadedMomentLocales.has(pack)) return
  loadedMomentLocales.add(pack)
  pack().catch(() => {
    loadedMomentLocales.delete(pack)
  })
}

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false,
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    ns: ['common', 'settings', 'chores', 'shoppingLists'],
    defaultNS: 'common',

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    react: {
      useSuspense: true,
    },
  })

loadMomentLocale(i18n.language)
i18n.on('languageChanged', loadMomentLocale)

export default i18n

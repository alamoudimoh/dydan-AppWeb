import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

/* ─────────────────────────────────────────────
   dydan localization — uses HttpBackend to load from
   /locales/{{lng}}/{{ns}}.json (real app translation files)
   with inline fallback for approved-ui shell keys.
───────────────────────────────────────────── */

const approvedResources = {
  en: {
    translation: {
      'app.name': 'dydan',
      'app.nameFull': 'dydan | continuous productivity',
      'mode.quest': 'Quest',
      'mode.focus': 'Focus',
      'mode.questMode': 'Quest mode',
      'mode.focusMode': 'Focus mode',
      'nav.home': 'Home',
      'nav.today': 'Today',
      'nav.allTasks': 'All Tasks',
      'nav.calendar': 'Calendar',
      'nav.projects': 'Projects',
      'nav.routines': 'Routines',
      'nav.maintenance': 'Maintenance',
      'nav.shopping': 'Shopping',
      'nav.goals': 'Goals',
      'nav.activity': 'Activity',
      'nav.notifications': 'Notifications',
      'nav.rewards': 'Rewards',
      'nav.progress': 'Progress',
      'nav.search': 'Search',
      'nav.settings': 'Settings',
      'nav.organize': 'Organize',
      'nav.team': 'Space',
      'nav.theme': 'Theme',
      'action.newTask': 'New task',
      'action.searchPlaceholder': 'Search…',
      'action.signOut': 'Sign out',
      'demo.persona': 'Demo persona',
      'demo.theme': 'Theme',
      'demo.parent': 'Parent',
      'demo.child': 'Child',
      'demo.solo': 'Solo',
      'demo.errorDemo': 'Error demo',
      'lang.toArabic': 'العربية (RTL)',
      'lang.toEnglish': 'Switch to English',
      'role.admin': 'Admin',
      'role.adult': 'Adult',
      'role.child': 'Child',
      'role.solo': 'Solo',
    },
  },
  ar: {
    translation: {
      'app.name': 'دَيْدَن',
      'app.nameFull': 'دَيْدَن | إنتاجية مستمرة',
      'mode.quest': 'المغامرة',
      'mode.focus': 'التركيز',
      'mode.questMode': 'وضع المغامرة',
      'mode.focusMode': 'وضع التركيز',
      'nav.home': 'الرئيسية',
      'nav.today': 'اليوم',
      'nav.allTasks': 'كل المهام',
      'nav.calendar': 'التقويم',
      'nav.projects': 'المشاريع',
      'nav.routines': 'الروتين',
      'nav.maintenance': 'الصيانة',
      'nav.shopping': 'التسوق',
      'nav.goals': 'الأهداف',
      'nav.activity': 'النشاط',
      'nav.notifications': 'الإشعارات',
      'nav.rewards': 'المكافآت',
      'nav.progress': 'التقدم',
      'nav.search': 'بحث',
      'nav.settings': 'الإعدادات',
      'nav.organize': 'تنظيم',
      'nav.team': 'المساحة',
      'nav.theme': 'السمة',
      'action.newTask': 'مهمة جديدة',
      'action.searchPlaceholder': 'بحث…',
      'action.signOut': 'تسجيل الخروج',
      'demo.persona': 'شخصية العرض',
      'demo.theme': 'السمة',
      'demo.parent': 'ولي أمر',
      'demo.child': 'طفل',
      'demo.solo': 'فردي',
      'demo.errorDemo': 'عرض الخطأ',
      'lang.toArabic': 'العربية (RTL)',
      'lang.toEnglish': 'English (LTR)',
      'role.admin': 'مشرف',
      'role.adult': 'بالغ',
      'role.child': 'طفل',
      'role.solo': 'فردي',
    },
  },
  // The app's RTL toggle targets the ar-SA locale (see LocalizationContext);
  // mirror the inline Arabic shell copy so nav labels resolve in RTL too.
  'ar-SA': {
    translation: {
      'app.name': 'دَيْدَن',
      'app.nameFull': 'دَيْدَن | إنتاجية مستمرة',
      'mode.quest': 'المغامرة',
      'mode.focus': 'التركيز',
      'mode.questMode': 'وضع المغامرة',
      'mode.focusMode': 'وضع التركيز',
      'nav.home': 'الرئيسية',
      'nav.today': 'اليوم',
      'nav.allTasks': 'كل المهام',
      'nav.calendar': 'التقويم',
      'nav.projects': 'المشاريع',
      'nav.routines': 'الروتين',
      'nav.maintenance': 'الصيانة',
      'nav.shopping': 'التسوق',
      'nav.goals': 'الأهداف',
      'nav.activity': 'النشاط',
      'nav.notifications': 'الإشعارات',
      'nav.rewards': 'المكافآت',
      'nav.progress': 'التقدم',
      'nav.search': 'بحث',
      'nav.settings': 'الإعدادات',
      'nav.organize': 'تنظيم',
      'nav.team': 'المساحة',
      'nav.theme': 'السمة',
      'action.newTask': 'مهمة جديدة',
      'action.searchPlaceholder': 'بحث…',
      'action.signOut': 'تسجيل الخروج',
      'demo.persona': 'شخصية العرض',
      'demo.theme': 'السمة',
      'demo.parent': 'ولي أمر',
      'demo.child': 'طفل',
      'demo.solo': 'فردي',
      'demo.errorDemo': 'عرض الخطأ',
      'lang.toArabic': 'العربية (RTL)',
      'lang.toEnglish': 'English (LTR)',
      'role.admin': 'مشرف',
      'role.adult': 'بالغ',
      'role.child': 'طفل',
      'role.solo': 'فردي',
    },
  },
}

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
    MOMENT_LOCALE_PACKS[key] || MOMENT_LOCALE_PACKS[key.split('-')[0]]
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
    resources: approvedResources,
    fallbackLng: 'en',
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false,
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    ns: [
      'common',
      'settings',
      'chores',
      'shoppingLists',
      'projects',
      'translation',
    ],
    // The app shell (App.tsx) resolves nav/mode/role/action labels from the
    // inline approved-ui `translation` namespace; screens render their labels
    // literally per the approved reference.
    defaultNS: 'translation',

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    react: {
      useSuspense: false,
    },
  })

// Override Arabic plural rules: i18next v25+ uses CLDR which generates
// 6 forms for Arabic (zero/one/two/few/many/other), but we only maintain
// _one/_other keys. Override to use simple one/other rule matching English.
const origGetRule = i18n.services.pluralResolver.getRule.bind(
  i18n.services.pluralResolver,
)
i18n.services.pluralResolver.getRule = (code, options = {}) => {
  if (code && String(code).startsWith('ar')) {
    return {
      resolvedOptions: () => ({ pluralCategories: ['one', 'other'] }),
      select: count => (count === 1 ? 'one' : 'other'),
    }
  }
  return origGetRule(code, options)
}
i18n.services.pluralResolver.clearCache()

loadMomentLocale(i18n.language)
i18n.on('languageChanged', loadMomentLocale)

export default i18n

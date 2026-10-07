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
      'action.cancel': 'Cancel',
      'maintenance.newAsset': 'New asset',
      'maintenance.newMeter': 'New meter',
      'maintenance.newThing': 'New thing',
      'maintenance.createAsset': 'Create asset',
      'maintenance.createMeter': 'Create meter',
      'maintenance.createThing': 'Create thing',
      'maintenance.assetNameLabel': 'New maintenance asset name',
      'maintenance.assetCategoryLabel': 'New maintenance asset category',
      'maintenance.assetDescriptionLabel': 'New maintenance asset description',
      'maintenance.assetNamePlaceholder': 'New asset name',
      'maintenance.assetCategoryPlaceholder': 'Category',
      'maintenance.assetDescriptionPlaceholder': 'Description (optional)',
      'maintenance.meterNameLabel': 'New meter name',
      'maintenance.meterUnitLabel': 'New meter unit',
      'maintenance.meterReadingLabel': 'New meter initial reading',
      'maintenance.meterNamePlaceholder': 'New meter name',
      'maintenance.meterReadingPlaceholder': 'Initial reading',
      'maintenance.thingNameLabel': 'New thing name',
      'maintenance.thingTypeLabel': 'New thing type',
      'maintenance.thingNamePlaceholder': 'New thing name',
      'demo.persona': 'Demo persona',
      'demo.theme': 'Theme',
      'demo.parent': 'Parent',
      'demo.child': 'Child',
      'demo.solo': 'Solo',
      'demo.errorDemo': 'Error demo',
      'lang.toArabic': 'العربية',
      'lang.toEnglish': 'English',
      'home.greeting.morning': 'Good morning',
      'home.greeting.afternoon': 'Good afternoon',
      'home.greeting.evening': 'Good evening',
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
      'action.cancel': 'إلغاء',
      'maintenance.newAsset': 'أصل جديد',
      'maintenance.newMeter': 'عداد جديد',
      'maintenance.newThing': 'شيء جديد',
      'maintenance.createAsset': 'إنشاء أصل',
      'maintenance.createMeter': 'إنشاء عداد',
      'maintenance.createThing': 'إنشاء شيء',
      'maintenance.assetNameLabel': 'اسم أصل الصيانة الجديد',
      'maintenance.assetCategoryLabel': 'فئة أصل الصيانة الجديد',
      'maintenance.assetDescriptionLabel': 'وصف أصل الصيانة الجديد',
      'maintenance.assetNamePlaceholder': 'اسم الأصل الجديد',
      'maintenance.assetCategoryPlaceholder': 'الفئة',
      'maintenance.assetDescriptionPlaceholder': 'الوصف (اختياري)',
      'maintenance.meterNameLabel': 'اسم العداد الجديد',
      'maintenance.meterUnitLabel': 'وحدة العداد الجديد',
      'maintenance.meterReadingLabel': 'القراءة الأولية للعداد الجديد',
      'maintenance.meterNamePlaceholder': 'اسم العداد الجديد',
      'maintenance.meterReadingPlaceholder': 'القراءة الأولية',
      'maintenance.thingNameLabel': 'اسم الشيء الجديد',
      'maintenance.thingTypeLabel': 'نوع الشيء الجديد',
      'maintenance.thingNamePlaceholder': 'اسم الشيء الجديد',
      'demo.persona': 'شخصية العرض',
      'demo.theme': 'السمة',
      'demo.parent': 'ولي أمر',
      'demo.child': 'طفل',
      'demo.solo': 'فردي',
      'demo.errorDemo': 'عرض الخطأ',
      'lang.toArabic': 'العربية',
      'lang.toEnglish': 'English',
      'home.greeting.morning': 'صباح الخير',
      'home.greeting.afternoon': 'طاب يومك',
      'home.greeting.evening': 'مساء الخير',
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
      'action.cancel': 'إلغاء',
      'maintenance.newAsset': 'أصل جديد',
      'maintenance.newMeter': 'عداد جديد',
      'maintenance.newThing': 'شيء جديد',
      'maintenance.createAsset': 'إنشاء أصل',
      'maintenance.createMeter': 'إنشاء عداد',
      'maintenance.createThing': 'إنشاء شيء',
      'maintenance.assetNameLabel': 'اسم أصل الصيانة الجديد',
      'maintenance.assetCategoryLabel': 'فئة أصل الصيانة الجديد',
      'maintenance.assetDescriptionLabel': 'وصف أصل الصيانة الجديد',
      'maintenance.assetNamePlaceholder': 'اسم الأصل الجديد',
      'maintenance.assetCategoryPlaceholder': 'الفئة',
      'maintenance.assetDescriptionPlaceholder': 'الوصف (اختياري)',
      'maintenance.meterNameLabel': 'اسم العداد الجديد',
      'maintenance.meterUnitLabel': 'وحدة العداد الجديد',
      'maintenance.meterReadingLabel': 'القراءة الأولية للعداد الجديد',
      'maintenance.meterNamePlaceholder': 'اسم العداد الجديد',
      'maintenance.meterReadingPlaceholder': 'القراءة الأولية',
      'maintenance.thingNameLabel': 'اسم الشيء الجديد',
      'maintenance.thingTypeLabel': 'نوع الشيء الجديد',
      'maintenance.thingNamePlaceholder': 'اسم الشيء الجديد',
      'demo.persona': 'شخصية العرض',
      'demo.theme': 'السمة',
      'demo.parent': 'ولي أمر',
      'demo.child': 'طفل',
      'demo.solo': 'فردي',
      'demo.errorDemo': 'عرض الخطأ',
      'lang.toArabic': 'العربية',
      'lang.toEnglish': 'English',
      'home.greeting.morning': 'صباح الخير',
      'home.greeting.afternoon': 'طاب يومك',
      'home.greeting.evening': 'مساء الخير',
      'role.admin': 'مشرف',
      'role.adult': 'بالغ',
      'role.child': 'طفل',
      'role.solo': 'فردي',
    },
  },
}

const MOMENT_LOCALE_PACKS: Record<string, () => Promise<unknown>> = {
  ar: () => import('moment/locale/ar.js'),
  de: () => import('moment/locale/de.js'),
  es: () => import('moment/locale/es.js'),
  fr: () => import('moment/locale/fr.js'),
  ja: () => import('moment/locale/ja.js'),
  nl: () => import('moment/locale/nl.js'),
  'pt-br': () => import('moment/locale/pt-br.js'),
  pt: () => import('moment/locale/pt-br.js'),
  'zh-cn': () => import('moment/locale/zh-cn.js'),
  zh: () => import('moment/locale/zh-cn.js'),
}

const loadedMomentLocales = new Set<() => Promise<unknown>>()

export const loadMomentLocale = (language: string) => {
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
i18n.services.pluralResolver.getRule = (code: string, options = {}) => {
  if (code && String(code).startsWith('ar')) {
    return {
      resolvedOptions: () => ({ pluralCategories: ['one', 'other'] }),
      select: (count: number) => (count === 1 ? 'one' : 'other'),
    }
  }
  return origGetRule(code, options)
}
i18n.services.pluralResolver.clearCache()

loadMomentLocale(i18n.language)
i18n.on('languageChanged', loadMomentLocale)

export default i18n

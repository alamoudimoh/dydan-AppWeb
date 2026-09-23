import i18n from "i18next";
import { initReactI18next } from "react-i18next";

/* ─────────────────────────────────────────────
   dydan localization — English + Arabic
   Shell chrome, navigation, and shared labels.
   Screens read these keys via useLocalization().
───────────────────────────────────────────── */

export const resources = {
  en: {
    translation: {
      "app.name": "dydan",
      "app.nameFull": "dydan | continuous productivity",
      "mode.quest": "Quest",
      "mode.focus": "Focus",
      "mode.questMode": "Quest mode",
      "mode.focusMode": "Focus mode",
      "nav.home": "Home",
      "nav.today": "Today",
      "nav.allTasks": "All Tasks",
      "nav.calendar": "Calendar",
      "nav.projects": "Projects",
      "nav.routines": "Routines",
      "nav.maintenance": "Maintenance",
      "nav.shopping": "Shopping",
      "nav.goals": "Goals",
      "nav.activity": "Activity",
      "nav.notifications": "Notifications",
      "nav.rewards": "Rewards",
      "nav.progress": "Progress",
      "nav.search": "Search",
      "nav.settings": "Settings",
      "nav.organize": "Organize",
      "nav.team": "Team",
      "action.newTask": "New task",
      "action.searchPlaceholder": "Search…",
      "demo.persona": "Demo persona",
      "demo.theme": "Theme",
      "demo.parent": "Parent",
      "demo.child": "Child",
      "demo.solo": "Solo",
      "demo.errorDemo": "Error demo",
      "lang.toArabic": "العربية (RTL)",
      "lang.toEnglish": "Switch to English",
      "role.admin": "Admin",
      "role.adult": "Adult",
      "role.child": "Child",
    },
  },
  ar: {
    translation: {
      "app.name": "دَيْدَن",
      "app.nameFull": "دَيْدَن | إنتاجية مستمرة",
      "mode.quest": "المغامرة",
      "mode.focus": "التركيز",
      "mode.questMode": "وضع المغامرة",
      "mode.focusMode": "وضع التركيز",
      "nav.home": "الرئيسية",
      "nav.today": "اليوم",
      "nav.allTasks": "كل المهام",
      "nav.calendar": "التقويم",
      "nav.projects": "المشاريع",
      "nav.routines": "الروتين",
      "nav.maintenance": "الصيانة",
      "nav.shopping": "التسوق",
      "nav.goals": "الأهداف",
      "nav.activity": "النشاط",
      "nav.notifications": "الإشعارات",
      "nav.rewards": "المكافآت",
      "nav.progress": "التقدم",
      "nav.search": "بحث",
      "nav.settings": "الإعدادات",
      "nav.organize": "تنظيم",
      "nav.team": "الفريق",
      "action.newTask": "مهمة جديدة",
      "action.searchPlaceholder": "بحث…",
      "demo.persona": "شخصية العرض",
      "demo.theme": "السمة",
      "demo.parent": "ولي أمر",
      "demo.child": "طفل",
      "demo.solo": "فردي",
      "demo.errorDemo": "عرض الخطأ",
      "lang.toArabic": "العربية (RTL)",
      "lang.toEnglish": "English (LTR)",
      "role.admin": "مشرف",
      "role.adult": "بالغ",
      "role.child": "طفل",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;

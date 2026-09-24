export type SettingsPreferences = {
  theme: 'dydan' | 'sovereign'
  appearance: 'light' | 'dark' | 'system'
  defaultView: 'focus' | 'quest'
  compactMode: boolean
  language: 'en' | 'ar-SA' | 'fr' | 'de' | 'es' | 'zh-CN' | 'pt' | 'ja'
  dateFormat:
    'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MMMM D, YYYY' | 'MMM D, YYYY'
  timeFormat: 'h:mm A' | 'HH:mm'
  firstDayOfWeek: number
  currency: 'USD' | 'GBP' | 'EUR' | 'AED' | 'SAR'
  sidebarCollapsed: boolean
  showItemBadges: boolean
  rememberSidebar: boolean
  notifications: Record<
    | 'taskReminders'
    | 'routineNudges'
    | 'familyActivity'
    | 'rewards'
    | 'weeklySummary'
    | 'quietHours'
    | 'pushChannel'
    | 'emailChannel',
    boolean
  >
  privacy: Record<'activityVisible' | 'analytics' | 'personalization', boolean>
  betaFeatures: boolean
  verboseLogging: boolean
}

export const DEFAULT_SETTINGS_PREFERENCES: SettingsPreferences = {
  theme: 'dydan',
  appearance: 'light',
  defaultView: 'focus',
  compactMode: false,
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: 'h:mm A',
  firstDayOfWeek: 0,
  currency: 'USD',
  sidebarCollapsed: false,
  showItemBadges: true,
  rememberSidebar: true,
  notifications: {
    taskReminders: true,
    routineNudges: true,
    familyActivity: false,
    rewards: true,
    weeklySummary: false,
    quietHours: false,
    pushChannel: true,
    emailChannel: false,
  },
  privacy: { activityVisible: true, analytics: true, personalization: true },
  betaFeatures: false,
  verboseLogging: false,
}

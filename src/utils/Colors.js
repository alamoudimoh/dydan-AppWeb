// ---------------------------------------------------------------------------
// Persisted entity colors (DATA, not theme).
//
// These hex values are user-selectable and stored on backend records (labels,
// projects, saved filters). They round-trip through the database, so they must
// never be renumbered, renamed, or re-mapped to theme tokens: doing so would
// corrupt existing rows. Presentation code should render them verbatim and use
// getTextColorFromBackgroundColor() for contrast.
// ---------------------------------------------------------------------------
const LABEL_COLORS = [
  { name: 'Default', value: '#FFFFFF' },
  { name: 'Salmon', value: '#ff7961' },
  { name: 'Teal', value: '#26a69a' },
  { name: 'Sky Blue', value: '#80d8ff' },
  { name: 'Grape', value: '#7e57c2' },
  { name: 'Sunshine', value: '#ffee58' },
  { name: 'Coral', value: '#ff7043' },
  { name: 'Lavender', value: '#ce93d8' },
  { name: 'Rose', value: '#f48fb1' },
  { name: 'Charcoal', value: '#616161' },
  { name: 'Sienna', value: '#8d6e63' },
  { name: 'Mint', value: '#a7ffeb' },
  { name: 'Amber', value: '#ffc107' },
  { name: 'Cobalt', value: '#3f51b5' },
  { name: 'Emerald', value: '#4caf50' },
  { name: 'Peach', value: '#ffab91' },
  { name: 'Ocean', value: '#0288d1' },
  { name: 'Mustard', value: '#ffca28' },
  { name: 'Ruby', value: '#d32f2f' },
  { name: 'Periwinkle', value: '#b39ddb' },
  { name: 'Turquoise', value: '#00bcd4' },
  { name: 'Lime', value: '#cddc39' },
  { name: 'Blush', value: '#f8bbd0' },
  { name: 'Ash', value: '#90a4ae' },
  { name: 'Sand', value: '#d7ccc8' },
]

export const FILTER_COLORS = [
  ...LABEL_COLORS.filter(color => color.name !== 'Default'),
]

export const PROJECT_COLORS = [
  ...LABEL_COLORS.filter(color => color.name !== 'Default'),
]

export const COLORS = {
  salmon: '#ff7961',
  teal: '#26a69a',
  skyBlue: '#80d8ff',
  grape: '#7e57c2',
  sunshine: '#ffee58',
  coral: '#ff7043',
  lavender: '#ce93d8',
  rose: '#f48fb1',
  charcoal: '#616161',
  sienna: '#8d6e63',
  mint: '#a7ffeb',
  amber: '#ffc107',
  cobalt: '#3f51b5',
  emerald: '#4caf50',
  peach: '#ffab91',
  ocean: '#0288d1',
  mustard: '#ffca28',
  ruby: '#d32f2f',
  periwinkle: '#b39ddb',
  turquoise: '#00bcd4',
  lime: '#cddc39',
  blush: '#f8bbd0',
  ash: '#90a4ae',
  sand: '#d7ccc8',
  white: '#FFFFFF',
}
// ---------------------------------------------------------------------------
// Presentation-only UI state colors. These are never persisted; they describe
// task/calendar state in charts, badges, and calendar views. They stay literal
// (not theme tokens) because charts need fixed hues across both brands, but
// new code should prefer CSS variables from src/theme/tokens.js when the
// color participates in normal UI chrome.
// ---------------------------------------------------------------------------
export const NOTIFICATION_TYPE = {
  PREDUE: '#4ec1a2',
  DUE_DATE: '#f6ad55',
  POSTDUE: '#F03A47',
}

export const TASK_COLOR = {
  COMPLETED: '#4ec1a2',
  LATE: '#f6ad55',
  MISSED: '#F03A47',
  UPCOMING: '#AF5B5B',
  SKIPPED: '#E2C2FF',
  IN_PROGRESS: '#00bcd4',
  // PENDING_REVIEW: '#b39ddb',
  OVERDUE: '#F03A47',
  SCHEDULED: '#10B982',
  PENDING_REVIEW: '#8B6CE1',

  // For the calendar
  TODAY: '#ffc107',
  TOMORROW: '#4ec1a2',
  NEXT_7_DAYS: '#00bcd4',
  LATER_THIS_MONTH: '#b39ddb',
  FUTURE: '#d7ccc8',
  ANYTIME: '#90a4ae',

  // Legacy colors for backward compatibility
  IN_A_WEEK: '#4ec1a2',
  THIS_MONTH: '#00bcd4',
  LATER: '#d7ccc8',

  // FOR ASSIGNEE:
  ASSIGNED_TO_ME: '#4ec1a2',
  ASSIGNED_TO_OTHER: '#b39ddb',
  UNASSIGNED: '#ffc107',

  // FOR PRIORITY:
  // PRIORITY_1: '#F03A47',
  // PRIORITY_2: '#ffc107',
  // PRIORITY_3: '#00bcd4',
  // PRIORITY_4: '#7e57c2',
  // NO_PRIORITY: '#90a4ae',
  // FOR PRIORITY:
  // PRIORITY_1: '#F03A4780',
  // PRIORITY_2: '#ffc10780',
  // PRIORITY_3: '#00bcd480',
  // PRIORITY_4: '#7e57c280',
  PRIORITY_1: '#d32f2f',
  PRIORITY_2: '#ed6c02',
  PRIORITY_3: '#0288d1',
  // PRIORITY_4: '#388e3c',
  PRIORITY_4: '#90a4ae',
  NO_PRIORITY: '#90a4ae80',
}
export { LABEL_COLORS }
export default LABEL_COLORS

/**
 * Fallback for entity colors missing on a record (legacy rows, partial API
 * responses). Matches the LABEL_COLORS "Ash" entry so dots/chips stay stable.
 */
export const ENTITY_COLOR_FALLBACK = '#90a4ae'

/**
 * Display identity of the synthetic "Default Project". Persisted nowhere, but
 * rendered wherever a project lacks a color; keep in one place so Chores,
 * Projects, and pickers agree.
 */
export const DEFAULT_PROJECT_COLOR = '#1976d2'

export const getTextColorFromBackgroundColor = bgColor => {
  if (!bgColor) return ''
  const hex = bgColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000000' : '#ffffff'
}

export const getPriorityColor = priority => {
  switch (priority) {
    case 1:
      return TASK_COLOR.PRIORITY_1
    case 2:
      return TASK_COLOR.PRIORITY_2
    case 3:
      return TASK_COLOR.PRIORITY_3
    case 4:
      return TASK_COLOR.PRIORITY_4
    default:
      return TASK_COLOR.NO_PRIORITY
  }
}

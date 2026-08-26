export const REFERENCE_PAGE_IDS = Object.freeze([
  'dashboard',
  'tasks',
  'routines',
  'projects',
  'shopping',
  'calendar',
  'progress',
  'meters',
  'rewards',
  'notifications',
  'settings',
  'sessions',
  'components',
  'states',
  'arabic',
])

export const REFERENCE_BRANDS = Object.freeze({
  daydan: {
    id: 'daydan',
    name: 'DayDan',
    tagline: 'Simplify tasks & chores, together.',
    wordmarkFont: "'Comfortaa Variable', 'Comfortaa', sans-serif",
  },
  sovereign: {
    id: 'sovereign',
    name: 'Sovereign',
    tagline: 'A calmer command center for family life.',
    wordmarkFont: "'Ubuntu Sans Variable', 'Ubuntu', sans-serif",
  },
})

export const normalizePageId = pageId =>
  REFERENCE_PAGE_IDS.includes(pageId) ? pageId : REFERENCE_PAGE_IDS[0]

export const resolveReferenceDirection = language =>
  String(language).toLowerCase().startsWith('ar') ? 'rtl' : 'ltr'

export const getReferenceBrand = brandId =>
  REFERENCE_BRANDS[brandId] || REFERENCE_BRANDS.daydan

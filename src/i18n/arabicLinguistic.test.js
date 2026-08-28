import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localesDir = path.resolve(__dirname, '../../public/locales')
const NAMESPACES = ['common', 'settings', 'chores', 'shoppingLists']

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flatten(value, fullKey)
    }
    return [[fullKey, value]]
  })

const loadNamespace = (locale, ns) =>
  flatten(
    JSON.parse(
      fs.readFileSync(path.join(localesDir, locale, `${ns}.json`), 'utf8'),
    ),
  )

// Arabic plural categories per i18next: _zero(0), _one(1), _two(2), _few(3-10), _many(11-99), _other(100+)
// Keys ending in _one should use singular noun forms; _other should use plural.

const SINGULAR_PLURAL_PAIRS = [
  // [oneKey, otherKey, singularNounPattern, pluralNounPattern, description]
  [
    'dashboard.remaining_one',
    'dashboard.remaining_other',
    /مهمة/,
    /مهام/,
    'remaining tasks',
  ],
  [
    'dashboard.tasksToday_one',
    'dashboard.tasksToday_other',
    /مهمة/,
    /مهام/,
    'tasks today',
  ],
  [
    'filters.filterTasksCount_one',
    'filters.filterTasksCount_other',
    /مهمة/,
    /مهام/,
    'filter task count',
  ],
  [
    'routines.countTasks_one',
    'routines.countTasks_other',
    /مهمة/,
    /مهام/,
    'routine task count',
  ],
  [
    'routines.tasksCreated_one',
    'routines.tasksCreated_other',
    /مهمة/,
    /مهام/,
    'tasks created',
  ],
  [
    'routines.createTasks_one',
    'routines.createTasks_other',
    /مهمة/,
    /مهام/,
    'create tasks',
  ],
  [
    'multiselect.selected_one',
    'multiselect.selected_other',
    /مهمة/,
    /مهام/,
    'selected tasks',
  ],
  [
    'shortcuts.allIncludingCollapsed_one',
    'shortcuts.allIncludingCollapsed_other',
    /مهمة/,
    /مهام/,
    'all including collapsed',
  ],
  [
    'shortcuts.allTasksIncludingCollapsed_one',
    'shortcuts.allTasksIncludingCollapsed_other',
    /مهمة/,
    /مهام/,
    'all tasks including collapsed',
  ],
]

test('_one forms use singular noun, _other forms use plural noun', () => {
  for (const ns of NAMESPACES) {
    const ar = new Map(loadNamespace('ar', ns))
    for (const [
      oneKey,
      otherKey,
      singularPat,
      pluralPat,
      desc,
    ] of SINGULAR_PLURAL_PAIRS) {
      const oneVal = ar.get(oneKey)
      const otherVal = ar.get(otherKey)
      if (!oneVal || !otherVal) continue // key not in this namespace

      assert.ok(
        singularPat.test(oneVal),
        `ar/${ns}.json:${oneKey} (_one) should contain singular noun for "${desc}": "${oneVal}"`,
      )
      assert.ok(
        pluralPat.test(otherVal),
        `ar/${ns}.json:${otherKey} (_other) should contain plural noun for "${desc}": "${otherVal}"`,
      )
    }
  }
})

test('no slash alternatives in Arabic product text (except keyboard shortcuts and separators)', () => {
  const SKIP_KEYS = new Set([
    'multiselect.skipSelected', // keyboard shortcut indicator "(X)"
    'routines.startApplyDate', // separator "A / B"
  ])
  for (const ns of NAMESPACES) {
    for (const [key, value] of loadNamespace('ar', ns)) {
      if (SKIP_KEYS.has(key)) continue
      assert.ok(
        !String(value).includes('مهمة/مهام') &&
          !String(value).includes('manın/'),
        `ar/${ns}.json:${key} contains slash alternatives: "${value}"`,
      )
    }
  }
})

test('no truncated or dangling tanween in Arabic values', () => {
  // Tanween marks: \u064B (fathatan), \u064C (dammatan), \u064D (kasratan)
  const TANWEEN = /[\u064B-\u064D]/
  for (const ns of NAMESPACES) {
    for (const [key, value] of loadNamespace('ar', ns)) {
      const str = String(value)
      // A value ending with ONLY tanween (no letter after) is truncated
      if (str.length > 0 && TANWEEN.test(str) && TANWEEN.test(str.slice(-1))) {
        assert.fail(
          `ar/${ns}.json:${key} ends with dangling tanween: "${value}"`,
        )
      }
    }
  }
})

test('passwordRequired uses feminine predicate for كلمة', () => {
  const ar = new Map(loadNamespace('ar', 'common'))
  const val = ar.get('auth.passwordRequired')
  assert.ok(
    val.includes('مطلوبة'),
    `auth.passwordRequired should use feminine "مطلوبة" (كلمة is feminine): "${val}"`,
  )
})

test('familyProgress.days uses noun-first order withbroken plural', () => {
  const ar = new Map(loadNamespace('ar', 'common'))
  const val = ar.get('familyProgress.days')
  assert.ok(
    val.startsWith('أيام'),
    `familyProgress.days should start with broken plural "أيام": "${val}"`,
  )
  assert.ok(
    val.includes('{{count}}'),
    `familyProgress.days must contain {{count}} placeholder: "${val}"`,
  )
})

test('no Arabic text ends with dangling preposition without noun', () => {
  // Prepositions that should not end a string: لـ, إلى, من, في, على, عن, بين, تحت, فوق
  // Exclude legitimate label patterns where the preposition is completed by UI context
  const DANGLING_PREPS = [
    / لـ$/,
    / إلى$/,
    / من$/,
    / في$/,
    / على$/,
    / عن$/,
    / بين$/,
  ]
  const LABEL_EXEMPTIONS = new Set([
    'assignedTo', // "Assigned to" — name follows in UI
    'choreView.createdBy', // "Created by" — name follows in UI
    'toolbar.createdBy', // "Created by" — name follows in UI
    'filters.createdBy', // "Created by" — name follows in UI
  ])
  for (const ns of NAMESPACES) {
    for (const [key, value] of loadNamespace('ar', ns)) {
      if (LABEL_EXEMPTIONS.has(key)) continue
      const str = String(value)
      for (const pat of DANGLING_PREPS) {
        assert.ok(
          !pat.test(str),
          `ar/${ns}.json:${key} ends with dangling preposition: "${value}"`,
        )
      }
    }
  }
})

test('notificationsCenter.emptyTitle is complete and not truncated', () => {
  const ar = new Map(loadNamespace('ar', 'common'))
  const val = ar.get('notificationsCenter.emptyTitle')
  assert.ok(
    val && val.length > 5,
    `notificationsCenter.emptyTitle appears truncated: "${val}"`,
  )
  assert.ok(
    val.endsWith('.') || val.endsWith('!') || val.endsWith('؟'),
    `notificationsCenter.emptyTitle should end with punctuation: "${val}"`,
  )
})

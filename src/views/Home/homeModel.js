/**
 * Pure adapters that map DayDan contracts to the Figma Home/Today task model.
 * Kept free of UI and query libraries so every branch is unit-testable
 * against deterministic fixtures (authority: design-source/figma-make).
 */
import { normalizeCircleMembers } from '../../utils/PermissionModel'

export const HOME_STATUS = Object.freeze({
  DONE: 'done',
  TODO: 'todo',
  OVERDUE: 'overdue',
  UPCOMING: 'upcoming',
})

export const MEMBER_COLOR_TOKENS = Object.freeze(
  Array.from({ length: 6 }, (_, i) => `var(--member-${i + 1})`),
)

/** Stable avatar accent per circle member (index-based, wraps past 6). */
export const memberColorFor = index => MEMBER_COLOR_TOKENS[Math.abs(index) % 6]

export const initialsOf = name => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  return parts
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

const pad = value => String(value).padStart(2, '0')

export const dayKeyOf = (value, timeZone = 'UTC') => {
  if (value === null || value === undefined || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

const parseKey = key => {
  const [year, month, day] = String(key).split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

/** Moves an ISO date key (YYYY-MM-DD) by a whole number of days. */
export const addDaysToKey = (key, amount) => {
  if (!key) return null
  const date = new Date(parseKey(key) + amount * 86_400_000)
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`
}

/** Relative calendar label: Today / Tomorrow / Yesterday / N days overdue / weekday / day month. */
export const formatDate = (
  dateKey,
  { locale = 'en-GB', now = new Date(), t, timeZone = 'UTC' },
) => {
  if (!dateKey) return null
  const today = dayKeyOf(now, timeZone)
  const diff = Math.round((parseKey(dateKey) - parseKey(today)) / 86_400_000)
  if (diff === 0) return t('homeToday.today')
  if (diff === 1) return t('homeToday.tomorrow')
  if (diff === -1) return t('homeToday.yesterday')
  if (diff < 0) {
    return t('homeToday.daysOverdue', { count: Math.abs(diff) })
  }
  if (diff < 7) {
    return new Intl.DateTimeFormat(locale, {
      timeZone: 'UTC',
      weekday: 'long',
    }).format(new Date(parseKey(dateKey)))
  }
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
  }).format(new Date(parseKey(dateKey)))
}

/** Relative time label ("Nm ago", "Nh ago", "Nd ago") — clamps to now. */
export const formatTimestamp = (timestamp, { now = new Date(), t }) => {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  const mins = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / 60_000),
  )
  if (mins < 60) return t('homeToday.minutesAgo', { count: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t('homeToday.hoursAgo', { count: hours })
  const days = Math.floor(hours / 24)
  return t('homeToday.daysAgo', { count: days })
}

const toPriority = priority => {
  const value = Number(priority)
  if (value === 1 || value >= 3) return 'high'
  if (value === 2) return 'medium'
  return 'low'
}

/**
 * A chore counts as recurring when it carries a frequency that schedules a
 * repeat. `once` / `no_repeat` are one-shots and `trigger` fires on demand,
 * so none of them are recurring. Mirrors ChoreCard's frequencyType logic.
 */
export const isRecurringChore = chore => {
  if (chore?.frequencyType) {
    return !['once', 'no_repeat', 'trigger'].includes(chore.frequencyType)
  }
  return chore?.scheduleType === 'recurring'
}

const isCompletedHistory = entry => Number(entry?.status) === 1

/** Number of consecutive days (ending today or yesterday) with a completion. */
export const streakFromHistory = (
  history,
  memberId,
  { now = new Date(), timeZone = 'UTC' } = {},
) => {
  if (!memberId) return 0
  const doneDays = new Set()
  for (const entry of history || []) {
    if (!isCompletedHistory(entry)) continue
    if (String(entry.completedBy) !== String(memberId)) continue
    const key = dayKeyOf(entry.performedAt, timeZone)
    if (key) doneDays.add(key)
  }
  let cursor = dayKeyOf(now, timeZone)
  if (!doneDays.has(cursor)) cursor = addDaysToKey(cursor, -1)
  let streak = 0
  while (cursor && doneDays.has(cursor)) {
    streak += 1
    cursor = addDaysToKey(cursor, -1)
  }
  return streak
}

/**
 * Workload per member for the household card: completed count + assigned count.
 * `completed` comes from approved/completed history, `assigned` from open chores.
 */
export const buildWorkload = (
  chores,
  history,
  members,
  { now = new Date(), timeZone = 'UTC' } = {},
) => {
  const completedBy = {}
  for (const entry of history || []) {
    if (!isCompletedHistory(entry)) continue
    const key = String(entry.completedBy ?? '')
    completedBy[key] = (completedBy[key] || 0) + 1
  }
  const assignedBy = {}
  const openChores = (chores || []).filter(
    chore => chore?.isArchived !== true && Number(chore?.status) !== 3,
  )
  for (const chore of openChores) {
    if (chore?.assignedTo === null || chore?.assignedTo === undefined) continue
    const key = String(chore.assignedTo)
    assignedBy[key] = (assignedBy[key] || 0) + 1
  }
  const rows = (members || []).map((member, index) => {
    const id = String(member.id)
    return {
      id,
      name: member.name,
      initials: member.initials,
      color: member.color || memberColorFor(index),
      tasksCompleted: completedBy[id] || 0,
      tasksAssigned: assignedBy[id] || 0,
    }
  })
  const maxCompleted = rows.reduce(
    (max, row) => Math.max(max, row.tasksCompleted),
    0,
  )
  return { rows, maxCompleted }
}

/**
 * Maps a chore to the Figma Task shape. Done status requires a same-day
 * completion; anything due before today is overdue; due today is todo;
 * later (or undated) chores are upcoming.
 */
export const choreToTask = (
  chore,
  { categoryColorById = {}, doneToday = {} },
) => {
  const id = String(chore?.id ?? '')
  const dueStamp = chore?.nextDueDate || chore?.dueDate || null
  const dueDate = dueStamp ? String(dueStamp).slice(0, 10) : null
  const dueTime =
    dueStamp && /\d{2}:\d{2}/.test(String(dueStamp))
      ? String(dueStamp).slice(11, 16)
      : null
  const points = Number(chore?.points) > 0 ? Number(chore.points) : null
  const categoryColor =
    chore?.category?.color ||
    categoryColorById[chore?.category?.id] ||
    categoryColorById[chore?.categoryID] ||
    null
  return {
    id,
    title: chore?.name || '',
    status: doneToday[id] ? HOME_STATUS.DONE : null,
    priority: toPriority(chore?.priority),
    assigneeId:
      chore?.assignedTo !== null && chore?.assignedTo !== undefined
        ? String(chore.assignedTo)
        : null,
    dueDate,
    dueTime,
    category: chore?.category?.name || chore?.categoryName || null,
    categoryColor,
    points,
    isRecurring: isRecurringChore(chore),
    subtasks: null,
    choreId: id,
  }
}

const assignStatus = (task, todayKey) => {
  if (task.status) return task
  if (!task.dueDate) {
    task.status = HOME_STATUS.UPCOMING
    return task
  }
  if (task.dueDate < todayKey) task.status = HOME_STATUS.OVERDUE
  else if (task.dueDate === todayKey) task.status = HOME_STATUS.TODO
  else task.status = HOME_STATUS.UPCOMING
  return task
}

/** Same-day completions keyed by chore id, shared by the list builders. */
const collectDoneToday = (history, todayKey, timeZone) => {
  const doneToday = {}
  for (const entry of history || []) {
    if (!isCompletedHistory(entry)) continue
    if (dayKeyOf(entry.performedAt, timeZone) !== todayKey) continue
    const id = String(entry.choreId ?? '')
    if (doneToday[id]) continue
    doneToday[id] = {
      performedAt: entry.performedAt,
      completedBy: entry.completedBy ?? null,
      points: Number(entry.points) > 0 ? Number(entry.points) : null,
    }
  }
  return doneToday
}

/**
 * Tasks due after today (or undated), sorted by due date — the Figma
 * "Coming up" list on the focus home.
 */
export const buildUpcoming = (
  chores,
  { categoryById = {}, history = [], now = new Date(), timeZone = 'UTC' } = {},
) => {
  const todayKey = dayKeyOf(now, timeZone)
  const doneToday = collectDoneToday(history, todayKey, timeZone)
  const categoryColorById = {}
  for (const category of Object.values(categoryById || {})) {
    if (category?.id === null || category?.id === undefined) continue
    categoryColorById[category.id] = category.color
  }
  const tasks = (chores || [])
    .filter(chore => chore?.isArchived !== true)
    .map(chore => {
      const task = choreToTask(chore, { doneToday, categoryColorById })
      return assignStatus(task, todayKey)
    })
  return tasks
    .filter(task => task.status === HOME_STATUS.UPCOMING)
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
}

/**
 * The single source of the Home/Today task lists.
 * Fixture semantics: done-today chores, overdue chores, and chores due today.
 */
export const buildHomeLists = ({
  categoryById = {},
  chores = [],
  history = [],
  now = new Date(),
  timeZone = 'UTC',
}) => {
  const todayKey = dayKeyOf(now, timeZone)
  const doneToday = collectDoneToday(history, todayKey, timeZone)
  const categoryColorById = {}
  for (const category of Object.values(categoryById || {})) {
    if (category?.id === null || category?.id === undefined) continue
    categoryColorById[category.id] = category.color
  }
  const tasks = (chores || [])
    .filter(chore => chore?.isArchived !== true)
    .map(chore => {
      const task = choreToTask(chore, { doneToday, categoryColorById })
      return assignStatus(task, todayKey)
    })
    .filter(task => task.status !== HOME_STATUS.UPCOMING)
  const overdue = tasks.filter(task => task.status === HOME_STATUS.OVERDUE)
  const todo = tasks.filter(
    task =>
      task.status === HOME_STATUS.TODO ||
      (task.status === HOME_STATUS.OVERDUE && task.dueDate === todayKey),
  )
  const done = tasks.filter(task => task.status === HOME_STATUS.DONE)
  return {
    todayKey,
    todayTasks: tasks,
    overdue,
    todo,
    done,
    doneToday,
  }
}

/** Member card model for the Today household section, ordered to match circle. */
export const buildHousehold = (members, tasks, { myId }) =>
  (members || []).map(member => {
    const memberTasks = tasks.filter(task => task.assigneeId === member.id)
    const memberDone = memberTasks.filter(
      task => task.status === HOME_STATUS.DONE,
    )
    return {
      ...member,
      tasks: memberTasks.length,
      done: memberDone.length,
    }
  })

export const sumTaskPoints = tasks =>
  (tasks || []).reduce((total, task) => total + (task.points || 0), 0)

/** Family goal card derived from /progress/goals (empty when no goal). */
export const pickFamilyGoal = (goals, { fallbackName, fallbackUnit }) => {
  const list = Array.isArray(goals) ? goals : []
  if (list.length === 0) {
    return {
      id: null,
      name: '',
      progress: 0,
      target: 1,
      unit: fallbackUnit,
      percent: 0,
    }
  }
  const goal =
    list.find(candidate => candidate.status !== 'INACTIVE') || list[0]
  const target = Math.max(1, Number(goal.target) || 1)
  const progress = Math.max(0, Number(goal.progress) || 0)
  return {
    id: String(goal.id ?? ''),
    name: String(goal.name || fallbackName),
    progress,
    target,
    unit: String(goal.unit || fallbackUnit),
    percent: Math.round((progress / target) * 100),
  }
}

/** Emoji palette for rewards/goals that carry no icon in the API contract. */
export const EMOJI_PALETTE = ['🎬', '🎮', '🕹️', '🌙', '🍕', '⭐']

export const emojiForId = (id, offset = 0) => {
  const numeric = Number(
    String(id ?? '')
      .replace(/\D/g, '')
      .slice(-2),
  )
  const index =
    Number.isFinite(numeric) && numeric > 0 ? numeric % EMOJI_PALETTE.length : 0
  return EMOJI_PALETTE[(index + offset) % EMOJI_PALETTE.length]
}

/** Normalised reward card: cost + emoji, filtering inactive rewards. */
export const buildRewards = (rewards, { fallbackName }) =>
  (Array.isArray(rewards) ? rewards : [])
    .filter(reward => reward?.isActive !== false)
    .map((reward, index) => ({
      id: String(reward.id ?? index),
      name: String(reward.name || fallbackName),
      pointsCost: Math.max(1, Number(reward.costPoints) || 1),
      icon: reward.icon || emojiForId(reward.id, index),
    }))

/** Recent activity feed derived from completed history entries. */
export const buildActivityFeed = (
  history,
  membersById,
  { limit = 6, now = new Date(), t },
) => {
  const events = (history || [])
    .filter(entry => isCompletedHistory(entry) && entry?.performedAt)
    .map(entry => {
      const member = membersById[entry.completedBy] || null
      const performed = dayKeyOf(entry.performedAt, 'UTC')
      return {
        id: String(entry.id ?? entry.choreId ?? Math.random()),
        type: 'completed',
        actorId: String(entry.completedBy ?? ''),
        actor: member,
        text: member
          ? t('homeToday.memberCompletedTask', {
              member: member.name,
              task: entry.choreName || t('homeToday.aTask'),
            })
          : t('homeToday.completedTask', {
              task: entry.choreName || t('homeToday.aTask'),
            }),
        timestamp: String(entry.performedAt),
        timestampKey: performed,
        points: Number(entry.points) > 0 ? Number(entry.points) : null,
      }
    })
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    .slice(0, limit)
  return {
    events,
    relative: event => formatTimestamp(event.timestamp, { now, t }),
  }
}

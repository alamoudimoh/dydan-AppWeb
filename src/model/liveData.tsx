/* ─────────────────────────────────────────────
   Live data context — the single live-data hub.

   Fetches every collection from the real backend
   (via hooks/useHousehold + the real Fetcher) and
   exposes it in the exact UI shapes the approved
   screens already consume (Task, Member, Project,
   Routine, …). No mock records anywhere.

   Usage: <LiveDataProvider> → useLiveData()
───────────────────────────────────────────── */
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { subscribeTokenChanges } from '../utils/TokenStorage'
import { toNotifications } from './notifications'
import { dayKey, todayKey, toTasks } from './tasks'
export { dayKey, todayKey } // screens import these from liveData

import type {
  ActivityItem,
  CalendarEvent,
  Goal,
  MaintenanceItem,
  Member,
  Meter,
  Notification,
  Project,
  Reward,
  RewardRequest,
  Routine,
  ShoppingList,
  Task,
  Thing,
} from '../data'
import {
  useArchivedChores,
  useChoreHistory,
  useChores,
  useCircleMembers,
  useGoals,
  useMaintenance,
  useMeters,
  useNotifications,
  useProjects,
  useRewardRequests,
  useRewards,
  useRoutines,
  useShoppingLists,
  useThings,
  useUserProfile,
} from '../hooks/useHousehold'
import type {
  ApiChore,
  ApiChoreHistory,
  ApiCircleMember,
  ApiGoal,
  ApiMaintenanceCenter,
  ApiMeter,
  ApiProfile,
  ApiProject,
  ApiReward,
  ApiRewardRequest,
  ApiRoutinePack,
  ApiShoppingList,
  ApiThing,
} from './api'

/* ── small helpers ─────────────────────────── */

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const MEMBER_PALETTE = [
  'var(--member-sarah)',
  'var(--member-daniel)',
  'var(--member-liam)',
]
const PROJECT_PALETTE = [
  'var(--project-1)',
  'var(--project-2)',
  'var(--project-3)',
]
const GOAL_PALETTE = ['var(--goal-1)', 'var(--goal-2)', 'var(--goal-3)']
const ROUTINE_ICONS = ['🌅', '🌙', '🏠', '🎒', '🧺', '🍽️', '🚿', '📚']

/* ── adapters ───────────────────────────────── */

function toMembers(
  profile: ApiProfile | null,
  circleMembers: ApiCircleMember[],
): Member[] {
  const sorted = [...circleMembers].sort((a, b) => a.userId - b.userId)
  return sorted.map((m, i) => {
    const isCurrentUser = profile ? m.userId === profile.id : false
    // Profile updates are authoritative for the signed-in user. Circle-member
    // records can lag behind /users/profile, which previously made a successful
    // profile save appear not to update in the approved settings UI.
    const name =
      (isCurrentUser ? profile?.displayName : undefined) ||
      m.displayName ||
      m.username ||
      `Member ${m.userId}`
    return {
      id: String(m.userId),
      name,
      initials: initialsOf(name),
      role:
        m.role === 'admin' ? 'admin' : m.isManagedAccount ? 'child' : 'adult',
      avatarColor: MEMBER_PALETTE[i % MEMBER_PALETTE.length],
      email: profile && m.userId === profile.id ? profile.email : '',
      points:
        m.pointsAvailable ??
        (m.points ?? 0) - (m.pointsRedeemed ?? 0) - (m.pointsAdjusted ?? 0),
      streak: m.streak ?? 0,
      tasksCompleted: m.tasksCompleted ?? 0,
      tasksAssigned: 0,
      isCurrentUser,
    }
  })
}

/** Most recent completion per chore (status 1 = completed). */
function toProjects(projects: ApiProject[], tasks: Task[]): Project[] {
  return projects.map((p, i) => {
    const taskIds = tasks
      .filter(t => t.projectId === String(p.id))
      .map(t => t.id)
    const doneCount = tasks.filter(
      t => t.projectId === String(p.id) && t.status === 'done',
    ).length
    const progress = taskIds.length
      ? Math.round((doneCount / taskIds.length) * 100)
      : 0
    return {
      id: String(p.id),
      name: p.name,
      description: p.description ?? '',
      color: p.color ?? PROJECT_PALETTE[i % PROJECT_PALETTE.length],
      icon: p.icon ?? undefined,
      progress,
      taskIds,
      owner: String(p.createdBy),
      status: 'active',
    }
  })
}

function toRoutines(routines: ApiRoutinePack[]): Routine[] {
  return routines.map((pack, i) => {
    const first = pack.items[0]
    const frequency = first?.frequencyType ?? 'once'
    const schedule =
      frequency === 'daily'
        ? 'Daily'
        : frequency === 'weekly'
          ? 'Weekly'
          : frequency === 'monthly'
            ? 'Monthly'
            : frequency === 'days_of_the_week'
              ? 'Selected days'
              : frequency === 'once'
                ? 'Once'
                : 'Recurring'
    const assignee = first?.assignedTo ?? first?.assigneeIds?.[0] ?? null
    const strategy =
      first?.assignStrategy === 'least_assigned' ||
      first?.assignStrategy === 'least_completed' ||
      first?.assignStrategy === 'keep_last_assigned' ||
      first?.assignStrategy === 'round_robin'
        ? 'rotating'
        : first?.assignStrategy === 'random' ||
            first?.assignStrategy === 'random_except_last_assigned'
          ? 'random'
          : 'specific'
    return {
      id: `routine-${pack.id}`,
      name: pack.name,
      description: pack.description || undefined,
      schedule,
      time: undefined,
      taskTitles: pack.items.map(item => item.name),
      streak: 0,
      assigneeId: assignee != null ? String(assignee) : undefined,
      icon: ROUTINE_ICONS[i % ROUTINE_ICONS.length],
      active: pack.isActive,
      assignmentStrategy: strategy,
      requiresApproval: pack.items.some(item => item.requireApproval),
      pointsPerTask:
        pack.items.find(item => item.points != null)?.points ?? undefined,
    }
  })
}

function toShoppingLists(
  lists: ApiShoppingList[],
  members: Member[],
): ShoppingList[] {
  const currentUser = members.find(m => m.isCurrentUser)
  return lists.map((l, i) => ({
    id: String(l.id),
    name: l.name,
    isShared: l.circleId != null,
    ownerId:
      l.createdBy != null ? String(l.createdBy) : (currentUser?.id ?? '0'),
    emoji: ['🛒', '✏️', '🔧', '🧹', '📦'][i % 5],
    items: (l.items ?? []).map(item => ({
      id: String(item.id),
      text: item.name,
      done: item.isChecked,
      addedById: item.createdBy != null ? String(item.createdBy) : undefined,
      quantity: item.quantity ?? undefined,
    })),
  }))
}

function toGoals(goals: ApiGoal[]): Goal[] {
  const units: Record<string, string> = {
    chores_completed: 'chores',
    tasks_completed: 'tasks',
    points_earned: 'points',
    streak_days: 'days',
    days: 'days',
  }
  const icons: Record<string, string> = {
    chores_completed: '🏆',
    tasks_completed: '✅',
    points_earned: '⭐',
    streak_days: '🔥',
  }
  return goals.map((g, i) => ({
    id: String(g.id),
    name: g.name,
    description: undefined,
    isFamily: g.circleId != null,
    progress: g.progress ?? 0,
    target: g.target,
    unit: units[g.metricType] ?? 'units',
    emoji: icons[g.metricType] ?? '🎯',
    color: GOAL_PALETTE[i % GOAL_PALETTE.length],
    metricType: g.metricType as Goal['metricType'],
    startDate: g.startDate?.slice(0, 10),
    endDate: g.endDate?.slice(0, 10),
    status: g.status,
  }))
}

function toRewards(rewards: ApiReward[]): Reward[] {
  const icons = ['🎁', '🎮', '🍕', '🌙', '🎬']
  return rewards.map((r, i) => ({
    id: String(r.id),
    name: r.name,
    description: r.description,
    pointsCost: r.costPoints,
    icon: icons[i % icons.length],
    isActive: r.isActive,
  }))
}

function toRewardRequests(requests: ApiRewardRequest[]): RewardRequest[] {
  return requests.map(r => ({
    id: String(r.id),
    rewardId: String(r.rewardId),
    requesterId:
      r.userId != null
        ? String(r.userId)
        : (r.requesterName ?? String(r.createdBy ?? 0)),
    status: (r.status === 'approved' || r.status === 'rejected'
      ? r.status
      : 'pending') as RewardRequest['status'],
    requestedAt: r.requestedAt ?? '',
    resolvedAt: r.resolvedAt ?? undefined,
    resolvedById: r.resolvedBy != null ? String(r.resolvedBy) : undefined,
  }))
}

function toActivity(
  history: ApiChoreHistory[],
  tasks: Task[],
  members: Member[],
): ActivityItem[] {
  const taskName = new Map(tasks.map(t => [t.id, t.title]))
  return history
    .filter(row => !row.voidedAt)
    .map(row => {
      const name =
        taskName.get(String(row.choreId)) ?? row.choreName ?? 'a household task'
      const actor = members.find(m => m.id === String(row.completedBy))
      const actorName = actor?.name ?? `Member ${row.completedBy}`
      const skipped = row.status === 2
      return {
        id: `h${row.id ?? row.choreId}-${row.createdAt ?? row.performedAt ?? ''}`,
        type: (skipped ? 'points' : 'completed') as ActivityItem['type'],
        actorId: String(row.completedBy),
        text: skipped
          ? `${actorName} skipped ${name}`
          : `${actorName} completed ${name}`,
        timestamp: row.performedAt ?? row.createdAt ?? '',
        icon: skipped ? '⏭️' : '✓',
        points: row.points ?? undefined,
      }
    })
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
}

function toMaintenance(center: ApiMaintenanceCenter | null): MaintenanceItem[] {
  if (!center) return []
  const mapStatus = (entry: {
    status?: string
    dueByTime?: boolean
  }): MaintenanceItem['status'] => {
    if (entry.status === 'due') return entry.dueByTime ? 'overdue' : 'due-soon'
    if (entry.status === 'approaching') return 'due-soon'
    return 'ok'
  }
  const all = [
    ...(center.due ?? []),
    ...(center.approaching ?? []),
    ...(center.upcoming ?? []),
  ]
  return all.map(entry => {
    const iconMap: Record<string, string> = {
      '💧': '💧',
      '⚡': '⚡',
      '🚗': '🚗',
      '🔥': '🔥',
      '🌡️': '🌡️',
    }
    return {
      id: `maint-${entry.choreId}`,
      name: entry.name,
      description: entry.assetName,
      lastDone: entry.lastService?.performedAt
        ? entry.lastService.performedAt.slice(0, 10)
        : undefined,
      nextDue: entry.nextDueDate ? entry.nextDueDate.slice(0, 10) : '',
      intervalDays: 0,
      category: entry.assetName ?? 'Maintenance',
      assigneeId: undefined,
      status: mapStatus(entry),
      icon: iconMap[entry.assetName ?? ''] ?? '🔧',
    }
  })
}

function toMeters(meters: ApiMeter[], members: Member[]): Meter[] {
  const today = todayKey()
  const icons = ['💧', '⚡', '🔥', '🚗', '📊']
  return meters.map((m, i) => {
    const lastReading = m.lastReadingAt
      ? m.lastReadingAt.slice(0, 10)
      : undefined
    let status: Meter['status'] = 'ok'
    if (m.currentValue == null) status = 'ok'
    else if (m.lastReadingAt) {
      // Meters carry their own due logic via schedule; fall back to 30 days.
      const dueDate = new Date(
        new Date(m.lastReadingAt).getTime() + 30 * 86400000,
      )
      const dueKey = dayKey(dueDate)
      if (dueKey < today) status = 'overdue'
      else if (dueKey === today) status = 'due-soon'
    }
    return {
      id: String(m.id),
      name: m.name,
      unit: m.unit ?? '',
      currentReading: m.currentValue ?? 0,
      previousReading: undefined,
      lastUpdated: lastReading ?? '',
      reminderDays: 30,
      assigneeId: members.find(mm => mm.isCurrentUser)?.id,
      nextDue: lastReading
        ? dayKey(new Date(new Date(lastReading).getTime() + 30 * 86400000))
        : '',
      status,
      icon: m.icon ?? icons[i % icons.length],
    }
  })
}

function toThings(things: ApiThing[]): Thing[] {
  const icons = ['🚪', '🌿', '🌡️', '🐕', '🍽️', '💡', '🔧']
  return things.map((t, i) => {
    const value = t.state ?? '—'
    return {
      id: String(t.id),
      name: t.name,
      type: t.type ?? 'text',
      state: value,
      lastChanged: t.createdAt ?? '',
      history: [],
      icon: t.icon ?? icons[i % icons.length],
      category: t.category?.name,
    }
  })
}

function toCalendarEvents(chores: ApiChore[]): CalendarEvent[] {
  return chores
    .filter(c => c.nextDueDate)
    .map(c => ({
      id: `chore-${c.id}`,
      title: c.name,
      date: c.nextDueDate!.slice(0, 10),
      time:
        c.nextDueDate!.length > 10 ? c.nextDueDate!.slice(11, 16) : undefined,
      allDay: false,
      color:
        (c.assignedTo != null ? c.assignedTo % 3 : (c.id ?? 0) % 3) === 0
          ? 'var(--member-sarah)'
          : c.assignedTo != null && c.assignedTo % 3 === 1
            ? 'var(--member-daniel)'
            : 'var(--member-liam)',
      assigneeId: c.assignedTo != null ? String(c.assignedTo) : undefined,
      type: 'task' as const,
    }))
}

/* ── context ───────────────────────────────── */

export type LiveDataValue = {
  ready: boolean
  isLoading: boolean
  isError: boolean
  error: unknown
  refetch: () => void
  profile: ApiProfile | null
  members: Member[]
  currentUser: Member | null
  tasks: Task[]
  projects: Project[]
  routines: Routine[]
  shoppingLists: ShoppingList[]
  goals: Goal[]
  rewards: Reward[]
  rewardRequests: RewardRequest[]
  activity: ActivityItem[]
  maintenanceItems: MaintenanceItem[]
  meters: Meter[]
  things: Thing[]
  notifications: Notification[]
  calendarEvents: CalendarEvent[]
  taskById: (id: string) => Task | undefined
  memberById: (id: string) => Member | undefined
  tasksByAssignee: (assigneeId: string) => Task[]
  todayTasks: () => Task[]
  overdueTasks: () => Task[]
  upcomingTasks: () => Task[]
  childTasks: () => Task[]
}

const LiveDataContext = createContext<LiveDataValue | null>(null)

type LiveDataProviderProps = {
  children: ReactNode
}

/**
 * Re-render on access-token lifecycle changes (sign-in / sign-out / session
 * restore). The provider sits above the auth gate, so without this the
 * useHousehold queries would keep their initial `enabled: false` forever.
 */
function useTokenVersion() {
  const [, setVersion] = useState(0)
  useEffect(() => subscribeTokenChanges(() => setVersion(v => v + 1)), [])
}

export function LiveDataProvider({ children }: LiveDataProviderProps) {
  useTokenVersion()
  const profileQ = useUserProfile()
  const membersQ = useCircleMembers()
  const choresQ = useChores()
  const projectsQ = useProjects()
  const routinesQ = useRoutines()
  const shoppingQ = useShoppingLists()
  const goalsQ = useGoals()
  const rewardsQ = useRewards()
  const requestsQ = useRewardRequests()
  const notificationsQ = useNotifications()
  const metersQ = useMeters()
  const thingsQ = useThings()
  const maintenanceQ = useMaintenance()
  const historyQ = useChoreHistory(14, true)
  const archivedQ = useArchivedChores()

  const value = useMemo<LiveDataValue>(() => {
    const profile = profileQ.data ?? null
    const members = toMembers(profile, membersQ.data ?? [])
    const tasks = toTasks(
      choresQ.data ?? [],
      archivedQ.data ?? [],
      historyQ.data ?? [],
      todayKey(),
    )
    const projects = toProjects(projectsQ.data ?? [], tasks)
    const routines = toRoutines(routinesQ.data ?? [])
    const shoppingLists = toShoppingLists(shoppingQ.data ?? [], members)
    const goals = toGoals(goalsQ.data ?? [])
    const rewards = toRewards(rewardsQ.data ?? [])
    const rewardRequests = toRewardRequests(requestsQ.data ?? [])
    const activity = toActivity(historyQ.data ?? [], tasks, members)
    const maintenanceItems = toMaintenance(maintenanceQ.data ?? null)
    const meters = toMeters(metersQ.data ?? [], members)
    const things = toThings(thingsQ.data ?? [])
    const notifications = toNotifications(notificationsQ.data ?? [])
    const calendarEvents = toCalendarEvents(choresQ.data ?? [])

    const memberById = (id: string) => members.find(m => m.id === id)
    const taskById = (id: string) => tasks.find(t => t.id === id)
    const tasksByAssignee = (assigneeId: string) =>
      tasks.filter(t => t.assigneeId === assigneeId)
    const todayTasks = () => {
      const today = todayKey()
      return tasks.filter(
        t =>
          t.dueDate === today ||
          t.status === 'overdue' ||
          (t.status === 'done' && t.completedAt?.startsWith(today)),
      )
    }
    const overdueTasks = () => tasks.filter(t => t.status === 'overdue')
    const upcomingTasks = () => tasks.filter(t => t.status === 'upcoming')
    const childTasks = () => {
      const childIds = new Set(
        members.filter(m => m.role === 'child').map(m => m.id),
      )
      return tasks.filter(t => t.assigneeId && childIds.has(t.assigneeId))
    }

    // Enrich member stats from live tasks.
    for (const m of members) {
      m.tasksCompleted = tasks.filter(
        t => t.assigneeId === m.id && t.status === 'done',
      ).length
      m.tasksAssigned = tasks.filter(t => t.assigneeId === m.id).length
    }

    const anyLoading =
      profileQ.isLoading ||
      membersQ.isLoading ||
      choresQ.isLoading ||
      historyQ.isLoading ||
      archivedQ.isLoading

    return {
      ready: Boolean(profile) && Boolean(choresQ.data),
      isLoading: anyLoading,
      isError: Boolean(profileQ.isError || choresQ.isError),
      error: profileQ.error ?? choresQ.error,
      refetch: () => {
        profileQ.refetch()
        choresQ.refetch()
        archivedQ.refetch()
      },
      profile,
      members,
      currentUser: members.find(m => m.isCurrentUser) ?? null,
      tasks,
      projects,
      routines,
      shoppingLists,
      goals,
      rewards,
      rewardRequests,
      activity,
      maintenanceItems,
      meters,
      things,
      notifications,
      calendarEvents,
      taskById,
      memberById,
      tasksByAssignee,
      todayTasks,
      overdueTasks,
      upcomingTasks,
      childTasks,
    }
  }, [
    profileQ.data,
    membersQ.data,
    choresQ.data,
    projectsQ.data,
    routinesQ.data,
    shoppingQ.data,
    goalsQ.data,
    rewardsQ.data,
    requestsQ.data,
    notificationsQ.data,
    metersQ.data,
    thingsQ.data,
    maintenanceQ.data,
    historyQ.data,
    archivedQ.data,
    profileQ.isLoading,
    membersQ.isLoading,
    choresQ.isLoading,
    historyQ.isLoading,
    archivedQ.isLoading,
    profileQ.isError,
    choresQ.isError,
    profileQ.error,
    choresQ.error,
  ])

  return (
    <LiveDataContext.Provider value={value}>
      {children}
    </LiveDataContext.Provider>
  )
}

export function useLiveData(): LiveDataValue {
  const ctx = useContext(LiveDataContext)
  if (!ctx) {
    throw new Error('useLiveData must be used within a LiveDataProvider')
  }
  return ctx
}

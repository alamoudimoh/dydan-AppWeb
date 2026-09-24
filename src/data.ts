/* ─────────────────────────────────────────────
   dydan UI data shapes + shared formatters.

   This module defines the shapes the approved
   screens consume. All records come from the live
   backend via `useLiveData()` (model/liveData.tsx);
   there are no mock users, mock tasks, or mock
   notifications anywhere in the app.
───────────────────────────────────────────── */

export type Task = {
  id: string
  title: string
  description?: string
  status: 'todo' | 'done' | 'overdue' | 'upcoming'
  priority: 'high' | 'medium' | 'low'
  assigneeId?: string
  dueDate?: string
  dueTime?: string
  category?: string
  categoryColor?: string
  projectId?: string
  routineId?: string
  points?: number
  isRecurring?: boolean
  recurrence?: string
  tags?: string[]
  subtasks?: SubTask[]
  completedAt?: string
  notes?: string
}

export type SubTask = {
  id: string
  title: string
  done: boolean
}

export type Member = {
  id: string
  name: string
  initials: string
  role: 'admin' | 'adult' | 'child'
  avatarColor: string
  email: string
  points: number
  streak: number
  tasksCompleted: number
  tasksAssigned: number
  isCurrentUser?: boolean
}

export type Project = {
  id: string
  name: string
  description: string
  color: string
  icon?: string
  progress: number
  taskIds: string[]
  owner: string
  dueDate?: string
  status: 'active' | 'paused' | 'done'
}

export type Routine = {
  id: string
  name: string
  description?: string
  schedule: string
  time?: string
  taskTitles: string[]
  streak: number
  assigneeId?: string
  lastCompleted?: string
  icon: string
  active?: boolean
  assignmentStrategy?: 'specific' | 'rotating' | 'random'
  requiresApproval?: boolean
  pointsPerTask?: number
}

export type ShoppingList = {
  id: string
  name: string
  isShared: boolean
  ownerId: string
  items: ShoppingItem[]
  emoji: string
}

export type ShoppingItem = {
  id: string
  text: string
  done: boolean
  addedById?: string
  quantity?: string
}

export type Goal = {
  id: string
  name: string
  description?: string
  isFamily: boolean
  progress: number
  target: number
  unit: string
  reward?: string
  contributorIds?: string[]
  emoji: string
  color: string
  metricType?: 'TASK_COMPLETIONS' | 'CATEGORY_COMPLETIONS' | 'POINTS_EARNED'
  startDate?: string
  endDate?: string
  status?: string
}

export type Reward = {
  id: string
  name: string
  description?: string
  pointsCost: number
  icon: string
  isActive?: boolean
  forMemberId?: string // Backward compatibility with existing prototype rewards
  forMemberIds?: string[] // Empty or absent (without forMemberId) means everyone
}

export type ActivityItem = {
  id: string
  type: 'completed' | 'assigned' | 'reward' | 'points' | 'goal' | 'streak'
  actorId: string
  text: string
  timestamp: string
  icon: string
  points?: number
}

export type MaintenanceItem = {
  id: string
  name: string
  description?: string
  lastDone?: string
  nextDue: string
  intervalDays: number
  category: string
  assigneeId?: string
  status: 'ok' | 'due-soon' | 'overdue'
  icon: string
}

export type CalendarEvent = {
  id: string
  title: string
  date: string
  time?: string
  allDay?: boolean
  color: string
  assigneeId?: string
  type: 'task' | 'routine' | 'event'
}

export type NotificationType =
  | 'task_due'
  | 'task_assigned'
  | 'task_approved'
  | 'task_rejected'
  | 'reward_available'
  | 'reward_request'
  | 'goal_achieved'
  | 'streak_milestone'
  | 'circle_invite'
  | 'system'

export type Notification = {
  id: string
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  timestamp: string
  actorId?: string
}

export type Meter = {
  id: string
  name: string
  unit: string
  currentReading: number
  previousReading?: number
  lastUpdated: string
  reminderDays: number
  assigneeId?: string
  nextDue: string
  status: 'ok' | 'due-soon' | 'overdue'
  icon: string
  notes?: string
}

export type Thing = {
  id: string
  name: string
  type: 'toggle' | 'numeric' | 'text'
  state: string
  lastChanged: string
  history: { value: string; at: string }[]
  icon: string
  category?: string
}

export type RewardRequest = {
  id: string
  rewardId: string
  requesterId: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string
  resolvedAt?: string
  resolvedById?: string
}

/* ─── Shared formatters (pure, real time) ───── */

const OVERDUE_DATE_MS = 86400000

export function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(diff / OVERDUE_DATE_MS)
  return `${days}d ago`
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  const startOf = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((startOf(d) - startOf(new Date())) / OVERDUE_DATE_MS)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff < 0) return `${Math.abs(diff)} days overdue`
  if (diff < 7) return d.toLocaleDateString('en-GB', { weekday: 'long' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

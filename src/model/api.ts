/* ─────────────────────────────────────────────
   Real API models (DyDan-Server JSON shapes)
   Used by useHousehold (data layer) and the
   adapter layer in model/liveData.tsx.
───────────────────────────────────────────── */

export type ApiProfile = {
  id: number
  displayName: string
  username: string
  email: string
  provider?: string
  circleID: number
  image: string
  timezone: string
  parentUserId?: number | null
  userType: number
  mfaEnabled?: boolean
  subscription?: string | null
  expiration?: string | null
}

export type ApiCircleMember = {
  id?: number
  userId: number
  circleId?: number
  role: 'admin' | 'manager' | 'member'
  isActive: boolean
  points?: number
  pointsRedeemed?: number
  pointsAdjusted?: number
  pointsAvailable?: number
  username?: string
  displayName?: string
  image?: string
  isManagedAccount?: boolean
  streak?: number
  tasksCompleted?: number
}

export type ApiSubTask = {
  id: number
  title: string
  completedAt?: string | null
  done?: boolean
}

export type ApiChore = {
  id: number
  name: string
  description?: string | null
  frequencyType?: string
  frequency?: number
  nextDueDate?: string | null
  isRolling?: boolean
  assignedTo?: number | null
  assignees?: Array<{ userId: number }>
  assignStrategy?: string
  isActive: boolean
  status?: number
  priority?: number | null
  completionWindow?: number | null
  points?: number | null
  categoryId?: number | null
  category?: { id: number; name: string; color?: string } | null
  projectId?: number | null
  subTasks?: ApiSubTask[]
  requireApproval?: boolean
  isPrivate?: boolean
  createdBy?: number | null
  createdAt?: string
  updatedAt?: string
}

export type ApiOccurrence = {
  occurrenceId: string
  choreId: number
  name: string
  dueAt: string
  actionable?: boolean
  projected?: boolean
  overdue?: boolean
  points?: number | null
  assigneeId?: number | null
}

export type ApiCalendarProjection = {
  occurrences: ApiOccurrence[]
  overdue: ApiOccurrence[]
  timeZone?: string
}

export type ApiProject = {
  id: number
  name: string
  description?: string | null
  color?: string | null
  icon?: string | null
  circleId: number
  createdBy: number
  createdAt?: string
  updatedAt?: string | null
}

export type ApiRoutineItem = {
  id: number
  packId: number
  position: number
  name: string
  description?: string | null
  frequencyType: string
  frequency?: number
  isRolling?: boolean
  assigneeIds?: number[]
  assignedTo?: number | null
  assignStrategy?: string
  points?: number | null
  requiresApproval?: boolean
}

export type ApiRoutinePack = {
  id: number
  circleId: number
  name: string
  description?: string
  isActive: boolean
  createdBy: number
  createdAt?: string
  updatedAt?: string
  items: ApiRoutineItem[]
}

export type ApiShoppingItem = {
  id: number
  listId: number
  name: string
  quantity?: string | null
  isChecked: boolean
  sortOrder?: number
  createdBy?: number
  checkedBy?: number | null
  checkedAt?: string | null
}

export type ApiShoppingList = {
  id: number
  name: string
  circleId?: number | null
  createdBy?: number
  archivedAt?: string | null
  createdAt?: string
  updatedAt?: string
  items: ApiShoppingItem[]
}

export type ApiGoal = {
  id: number
  circleId?: number
  name: string
  metricType: string
  target: number
  categoryId?: number | null
  startDate: string
  endDate: string
  status: string
  createdBy?: number
  createdAt?: string
  updatedAt?: string
}

export type ApiReward = {
  id: number
  circleId?: number | null
  name: string
  description?: string
  costPoints: number
  isActive: boolean
  createdBy?: number
  createdAt?: string
}

export type ApiRewardRequest = {
  id: number
  rewardId: number
  rewardName: string
  costPoints: number
  status: string
  createdBy?: number
  requesterName?: string
  userId?: number
  requestedAt?: string
  resolvedAt?: string | null
  resolvedBy?: number | null
}

export type ApiMaintenanceItem = {
  id: number
  name: string
  itemType?: string
  intervalDays?: number | null
  nextDueDate?: string | null
  lastServiceDate?: string | null
  isActive?: boolean
  assignedTo?: number | null
  notes?: string | null
  createdAt?: string
}

export type ApiMaintenanceEntry = {
  choreId: number
  assetId?: number
  assetName?: string
  name: string
  nextDueDate?: string | null
  dueByTime?: boolean
  dueReason?: string
  status?: string
  lastService?: {
    id: number
    choreId: number
    choreName?: string
    performedAt?: string
    completedBy?: number
  } | null
}

export type ApiMaintenanceCenter = {
  due: ApiMaintenanceEntry[]
  approaching: ApiMaintenanceEntry[]
  upcoming: ApiMaintenanceEntry[]
  assets: Array<{
    thingId?: number
    id?: number
    name: string
    category?: string
    status?: string
    maintenance?: ApiMaintenanceEntry[]
  }>
}

export type ApiMeter = {
  id: number
  name: string
  unit?: string
  icon?: string | null
  currentValue?: number | null
  targetValue?: number | null
  lastReadingAt?: string | null
  createdAt?: string
  updatedAt?: string
  isTracked?: boolean
  schedule?: unknown
  updateReminder?: unknown
}

export type ApiThing = {
  id: number
  name: string
  description?: string | null
  icon?: string | null
  location?: string | null
  categoryId?: number | null
  category?: { id: number; name: string } | null
  createdAt?: string
  isActive?: boolean
}

export type ApiNotification = {
  id: number
  type?: string
  title?: string
  body?: string
  message?: string
  createdAt: string
  read?: boolean
  isRead?: boolean
  readAt?: string | null
  metadata?: Record<string, unknown> | null
}

export type ApiChoreHistory = {
  id?: number
  choreId: number
  choreName?: string
  performedAt?: string | null
  completedBy: number
  assignedTo?: number | null
  notes?: string | null
  dueDate?: string | null
  createdAt?: string
  updatedAt?: string | null
  status: number // 1 = completed, 2 = skipped
  points?: number | null
  voidedAt?: string | null
  voidedBy?: number | null
}

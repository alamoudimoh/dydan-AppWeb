/* ─────────────────────────────────────────────
   Task mapping — pure helpers.

   Converts the server's chore model (active chores +
   archived chores + completion history) into the Task
   shape the approved UI consumes.

   The server deactivates a chore when it is completed
   (is_active=false) and records the completion in
   /chores/history, so completed tasks must be
   reconciled from the archived list to stay visible
   as "done" in the UI.
───────────────────────────────────────────── */
import type { Task } from '../data'
import type { ApiChore, ApiChoreHistory } from './api'

export function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayKey(): string {
  return dayKey(new Date())
}

export function latestCompletions(
  history: ApiChoreHistory[],
): Map<number, Date> {
  const map = new Map<number, Date>()
  for (const row of history) {
    if (!row || row.status !== 1) continue
    const at = row.performedAt ?? row.createdAt
    if (!at) continue
    const d = new Date(at)
    const prev = map.get(row.choreId)
    if (!prev || d > prev) map.set(row.choreId, d)
  }
  return map
}

function toPriority(priority: number | null | undefined): Task['priority'] {
  if (priority == null) return 'medium'
  if (priority >= 4) return 'high'
  if (priority <= 2) return 'low'
  return 'medium'
}

function isTaskDone(
  chore: ApiChore,
  completed: Date | undefined,
  today: string,
): boolean {
  if (!completed) return false
  if (!chore.nextDueDate) return dayKey(completed) === today
  return completed.getTime() >= new Date(chore.nextDueDate).getTime()
}

function toTask(
  chore: ApiChore,
  completedFor: Date | undefined,
  today: string,
  forceDone: boolean,
): Task {
  const done = forceDone || isTaskDone(chore, completedFor, today)
  const dueDate = chore.nextDueDate ? new Date(chore.nextDueDate) : null
  let status: Task['status']
  if (done) status = 'done'
  else if (!dueDate) status = 'todo'
  else {
    const dueDay = dayKey(dueDate)
    if (dueDay < today) status = 'overdue'
    else if (dueDay === today) status = 'todo'
    else status = 'upcoming'
  }
  const assignee = chore.assignedTo ?? chore.assignees?.[0]?.userId ?? null
  return {
    id: String(chore.id),
    title: chore.name,
    description: chore.description ?? undefined,
    status,
    priority: toPriority(chore.priority),
    assigneeId: assignee != null ? String(assignee) : undefined,
    dueDate: chore.nextDueDate ? chore.nextDueDate.slice(0, 10) : undefined,
    dueTime: chore.nextDueDate ? chore.nextDueDate.slice(11, 16) : undefined,
    category: chore.category?.name,
    categoryColor: chore.category?.color,
    categoryId: chore.categoryId ?? chore.category?.id ?? null,
    projectId: chore.projectId != null ? String(chore.projectId) : undefined,
    points: chore.points ?? undefined,
    isRecurring: Boolean(chore.frequencyType && chore.frequencyType !== 'once'),
    recurrence: chore.frequencyType,
    tags: [],
    subtasks: (chore.subTasks ?? []).map(st => ({
      id: String(st.id),
      title: st.title,
      done: Boolean(st.completedAt || st.done),
    })),
    completedAt: done && completedFor ? completedFor.toISOString() : undefined,
    notes: chore.description ?? undefined,
  }
}

export function toTasks(
  chores: ApiChore[],
  archived: ApiChore[],
  history: ApiChoreHistory[],
  today: string,
): Task[] {
  const completed = latestCompletions(history)
  const activeIds = new Set(chores.map(chore => chore.id))

  const active = chores.map(chore =>
    toTask(chore, completed.get(chore.id), today, false),
  )

  // Archived chores with a recorded completion surface as done tasks so
  // completed work stays visible (the server archives chores on completion).
  const archivedDone = archived
    .filter(chore => !activeIds.has(chore.id) && completed.has(chore.id))
    .map(chore => toTask(chore, completed.get(chore.id), today, true))

  return [...active, ...archivedDone]
}

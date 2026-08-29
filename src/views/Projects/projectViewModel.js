import { taskStatus } from '../Chores/taskViewModel'

export const DEFAULT_PROJECT_ID = 'default'

export const choreProjectId = chore => {
  const id = chore?.projectId || chore?.project_id || chore?._projectId
  if (!id || id === '') return DEFAULT_PROJECT_ID
  return id
}

export const isProjectTaskDone = chore =>
  !!chore.isCompleted || chore.status === 4

const toDateKey = value => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

export const projectTasks = (chores, projectId, now = new Date()) => {
  const id = projectId || DEFAULT_PROJECT_ID
  return (chores || [])
    .filter(chore => choreProjectId(chore) === id)
    .map(chore => ({
      id: chore.id,
      title: chore.name,
      status: taskStatus(chore, now),
      dueDate: toDateKey(chore.nextDueDate || chore.dueDate),
      subtasks:
        Array.isArray(chore.subtasks) && chore.subtasks.length
          ? chore.subtasks.map(subtask => ({
              id: subtask.id,
              title: subtask.title || subtask.name,
              done: !!(
                subtask.done ||
                subtask.isCompleted ||
                subtask.completedAt
              ),
            }))
          : null,
    }))
}

export const projectProgress = (chores, projectId) => {
  const list = (chores || []).filter(
    chore => choreProjectId(chore) === (projectId || DEFAULT_PROJECT_ID),
  )
  if (list.length === 0) return 0
  const done = list.filter(isProjectTaskDone).length
  return Math.round((done / list.length) * 100)
}

export const projectStatus = (chores, projectId) => {
  const list = (chores || []).filter(
    chore => choreProjectId(chore) === (projectId || DEFAULT_PROJECT_ID),
  )
  if (list.length > 0 && list.every(isProjectTaskDone)) return 'done'
  return 'active'
}

export const initialsFor = name =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || '?'

export const projectOwner = (project, members, profile) => {
  const ownerId = project?.created_by
  if (!ownerId) return null
  const member = (members || []).find(
    candidate => String(candidate.userId) === String(ownerId),
  )
  const name = member
    ? member.displayName || member.name
    : String(profile?.id) === String(ownerId)
      ? profile?.name || profile?.username || profile?.email
      : null
  if (!name) return null
  return {
    name,
    initials: member ? member.initials || initialsFor(name) : initialsFor(name),
    avatarColor: member?.avatarColor || 'var(--brand)',
  }
}

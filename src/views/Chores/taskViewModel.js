const toDateKey = value => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

export const taskStatus = (chore, now = new Date()) => {
  if (chore.isCompleted || chore.status === 4) return 'done'

  const due = toDateKey(chore.nextDueDate || chore.dueDate)
  const today = toDateKey(now)
  if (due && due < today) return 'overdue'
  if (due && due > today) return 'upcoming'
  return 'todo'
}

export const taskGroups = (chores, groupBy, members, now = new Date()) => {
  const tasks = chores.map(chore => ({
    ...chore,
    taskStatus: taskStatus(chore, now),
  }))
  const labels = {
    overdue: 'overdue',
    todo: 'todo',
    upcoming: 'upcoming',
    done: 'done',
  }

  if (groupBy === 'status') {
    return ['overdue', 'todo', 'upcoming', 'done']
      .map(key => ({
        key,
        label: labels[key],
        chores: tasks.filter(task => task.taskStatus === key),
      }))
      .filter(group => group.chores.length > 0)
  }

  if (groupBy === 'assignee') {
    const assigned = members
      .map(member => ({
        key: String(member.userId),
        label: member.displayName || member.name || member.username,
        chores: tasks.filter(
          task => String(task.assignedTo) === String(member.userId),
        ),
      }))
      .filter(group => group.chores.length > 0)
    const unassigned = tasks.filter(task => task.assignedTo === null)
    return unassigned.length
      ? [
          ...assigned,
          { key: 'unassigned', label: 'unassigned', chores: unassigned },
        ]
      : assigned
  }

  if (groupBy === 'category') {
    const categories = [
      ...new Set(
        tasks.map(
          task => task.category?.name || task.categoryName || 'uncategorized',
        ),
      ),
    ]
    return categories.map(category => ({
      key: category,
      label: category,
      chores: tasks.filter(
        task =>
          (task.category?.name || task.categoryName || 'uncategorized') ===
          category,
      ),
    }))
  }

  return [1, 2, 3, 4]
    .map(priority => ({
      key: String(priority),
      label: priority === 1 ? 'high' : `P${priority}`,
      chores: tasks.filter(task => Number(task.priority) === priority),
    }))
    .filter(group => group.chores.length > 0)
}

export const taskStatusCounts = (chores, now = new Date()) =>
  chores.reduce(
    (counts, chore) => {
      counts[taskStatus(chore, now)] += 1
      return counts
    },
    { overdue: 0, todo: 0, upcoming: 0, done: 0 },
  )

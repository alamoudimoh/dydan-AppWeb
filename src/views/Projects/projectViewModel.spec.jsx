import { describe, expect, it } from 'vitest'

import {
  choreProjectId,
  initialsFor,
  isProjectTaskDone,
  projectOwner,
  projectProgress,
  projectStatus,
  projectTasks,
} from './projectViewModel'

const chores = [
  {
    id: 'c1',
    name: 'Tidy room',
    projectId: 'p1',
    isCompleted: true,
    status: 4,
  },
  {
    id: 'c2',
    name: 'Laundry',
    project_id: 'p2',
    status: 1,
    nextDueDate: '2026-01-10',
  },
  { id: 'c3', name: 'Unassigned', status: 0 },
]

describe('choreProjectId', () => {
  it('falls back to default project when unassigned', () => {
    expect(choreProjectId(chores[2])).toBe('default')
    expect(choreProjectId({ projectId: '' })).toBe('default')
  })
  it('accepts both snake and camel case fields', () => {
    expect(choreProjectId(chores[0])).toBe('p1')
    expect(choreProjectId(chores[1])).toBe('p2')
  })
})

describe('isProjectTaskDone', () => {
  it('treats completed chores and status 4 as done', () => {
    expect(isProjectTaskDone(chores[0])).toBe(true)
    expect(isProjectTaskDone({ status: 4 })).toBe(true)
    expect(isProjectTaskDone(chores[1])).toBe(false)
  })
})

describe('projectProgress', () => {
  it('counts done chores within a project only', () => {
    expect(projectProgress(chores, 'p1')).toBe(100)
    expect(projectProgress(chores, 'default')).toBe(0)
    expect(projectProgress([], 'p1')).toBe(0)
  })
})

describe('projectStatus', () => {
  it('marks a project done only when every task is done', () => {
    expect(projectStatus(chores, 'p2')).toBe('active')
    expect(projectStatus([chores[0]], 'p1')).toBe('done')
    expect(projectStatus([], 'p3')).toBe('active')
  })
})

describe('projectTasks', () => {
  it('maps chores with status and due date', () => {
    const tasks = projectTasks(chores, 'p1', new Date('2026-01-15T12:00:00Z'))
    expect(tasks).toHaveLength(1)
    expect(tasks[0]).toMatchObject({
      id: 'c1',
      title: 'Tidy room',
      status: 'done',
    })
    expect(tasks[0].subtasks).toBeNull()
  })
  it('formats due dates as ISO date keys', () => {
    const tasks = projectTasks(chores, 'p2', new Date('2026-01-15T12:00:00Z'))
    expect(tasks[0].dueDate).toBe('2026-01-10')
  })
})

describe('initialsFor', () => {
  it('derives initials from a name', () => {
    expect(initialsFor('Lina Smith')).toBe('LS')
    expect(initialsFor('no-surname')).toBe('N')
    expect(initialsFor('')).toBe('?')
  })
})

describe('projectOwner', () => {
  const members = [
    { userId: 7, displayName: 'Lina Smith', avatarColor: '#c084fc' },
  ]
  const profile = { id: 7, name: 'Lina Smith' }
  it('resolves an owner from members by created_by', () => {
    expect(projectOwner({ created_by: 7 }, members, profile)).toMatchObject({
      name: 'Lina Smith',
      initials: 'LS',
      avatarColor: '#c084fc',
    })
  })
  it('falls back to the current profile when created_by matches', () => {
    expect(projectOwner({ created_by: 7 }, [], profile)).toMatchObject({
      name: 'Lina Smith',
    })
  })
  it('returns null when no owner can be resolved', () => {
    expect(projectOwner({}, [], profile)).toBeNull()
  })
})

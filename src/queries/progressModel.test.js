import assert from 'node:assert/strict'
import test from 'node:test'

import {
  normalizeGoals,
  normalizeReport,
  normalizeWorkload,
} from './progressModel.js'

test('normalizes null and omitted workload collections to arrays', () => {
  assert.deepEqual(normalizeWorkload({ tasks: null }), {
    tasks: [],
    members: [],
    categories: [],
    unassigned: 0,
    canViewFamily: false,
  })
  assert.deepEqual(normalizeWorkload(), {
    tasks: [],
    members: [],
    categories: [],
    unassigned: 0,
    canViewFamily: false,
  })
})

test('preserves normal authorized manager workload and unassigned work', () => {
  const response = {
    canViewFamily: true,
    members: [{ userId: 1, name: 'Manager' }],
    tasks: [{ id: 2, assignedTo: null }],
    categories: [{ categoryId: 7, name: 'Home', count: 1 }],
    unassigned: 1,
  }
  assert.deepEqual(normalizeWorkload(response), response)
})

test('keeps restricted workload empty without manufacturing private details', () => {
  const normalized = normalizeWorkload({
    canViewFamily: false,
    members: [{ userId: 3, name: 'Member' }],
    tasks: null,
    categories: null,
  })
  assert.equal(normalized.canViewFamily, false)
  assert.deepEqual(normalized.tasks, [])
  assert.deepEqual(normalized.categories, [])
  assert.deepEqual(normalized.members, [{ userId: 3, name: 'Member' }])
})

test('normalizes every report and goals collection rendered by Family Progress', () => {
  assert.deepEqual(
    normalizeReport({
      insights: null,
      categories: null,
      members: null,
      rewards: null,
      points: null,
      maintenance: null,
    }),
    {
      insights: [],
      categories: [],
      members: [],
      rewards: [],
      points: {},
      maintenance: {},
      canViewFamily: false,
    },
  )
  assert.deepEqual(normalizeGoals({ goals: null }), {
    goals: [],
    canManage: false,
  })
})

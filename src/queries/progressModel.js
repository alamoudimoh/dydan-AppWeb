const list = value => (Array.isArray(value) ? value : [])

export const normalizeWorkload = value => ({
  ...(value && typeof value === 'object' ? value : {}),
  members: list(value?.members),
  tasks: list(value?.tasks),
  categories: list(value?.categories),
  unassigned: Number.isFinite(value?.unassigned) ? value.unassigned : 0,
  canViewFamily: value?.canViewFamily === true,
})

export const normalizeReport = value => ({
  ...(value && typeof value === 'object' ? value : {}),
  insights: list(value?.insights),
  categories: list(value?.categories),
  members: list(value?.members),
  rewards: list(value?.rewards),
  points: value?.points && typeof value.points === 'object' ? value.points : {},
  maintenance:
    value?.maintenance && typeof value.maintenance === 'object'
      ? value.maintenance
      : {},
  canViewFamily: value?.canViewFamily === true,
})

export const normalizeGoals = value => ({
  ...(value && typeof value === 'object' ? value : {}),
  goals: list(value?.goals),
  canManage: value?.canManage === true,
})

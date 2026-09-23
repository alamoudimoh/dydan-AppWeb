/* ─────────────────────────────────────────────
   Real data layer (react-query) — replaces the
   prototype `useTasks`/`useTaskMutations` mock
   cycle. Every hook talks to the live
   DyDan-Server backend via the real Fetcher.
───────────────────────────────────────────── */
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type {
  ApiCalendarProjection,
  ApiChore,
  ApiChoreHistory,
  ApiCircleMember,
  ApiGoal,
  ApiMaintenanceCenter,
  ApiMeter,
  ApiNotification,
  ApiProfile,
  ApiProject,
  ApiReward,
  ApiRewardRequest,
  ApiRoutinePack,
  ApiShoppingList,
  ApiThing,
} from '../model/api'
import * as Fetcher from '../utils/Fetcher'
import { getAccessToken } from '../utils/TokenStorage'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false },
  },
})

const authEnabled = () => Boolean(getAccessToken())

/** Unwrap a raw `Response` (or an already-parsed `{ res }` body) into data. */
export async function parseRes<T>(
  resp: Response | { res?: unknown } | Promise<Response | { res?: unknown }>,
): Promise<T> {
  const r = await Promise.resolve(resp)
  if (r instanceof Response) {
    const body = await r.json().catch(() => ({}))
    if (!r.ok) {
      throw new Error(
        typeof body?.error === 'string'
          ? body.error
          : `Request failed (${r.status})`,
      )
    }
    return (body?.res ?? body) as T
  }
  return (r?.res ?? r) as T
}

export const KEYS = {
  chores: ['chores'] as const,
  calendar: (from: string, to: string) => ['calendar', from, to] as const,
  projects: ['projects'] as const,
  routines: ['routines'] as const,
  shopping: ['shopping-lists'] as const,
  goals: ['goals'] as const,
  rewards: ['rewards'] as const,
  rewardRequests: ['rewards', 'requests'] as const,
  notifications: ['notifications'] as const,
  meters: ['meters'] as const,
  things: ['things'] as const,
  maintenance: ['maintenance'] as const,
  history: (limit: number) => ['history', limit] as const,
  members: ['circle', 'members'] as const,
  profile: ['user', 'profile'] as const,
  points: (circleID: number, userId?: number) =>
    ['points', circleID, userId ?? 'all'] as const,
}

/* ── Queries ─────────────────────────────── */

export function useUserProfile() {
  return useQuery({
    queryKey: KEYS.profile,
    queryFn: () => parseRes<ApiProfile>(Fetcher.GetUserProfile()),
    enabled: authEnabled(),
  })
}

export function useCircleMembers() {
  return useQuery({
    queryKey: KEYS.members,
    queryFn: () => parseRes<ApiCircleMember[]>(Fetcher.GetAllCircleMembers()),
    enabled: authEnabled(),
  })
}

export function useChores() {
  return useQuery({
    queryKey: KEYS.chores,
    queryFn: () => parseRes<ApiChore[]>(Fetcher.GetChores()),
    enabled: authEnabled(),
  })
}

export function useArchivedChores() {
  return useQuery({
    queryKey: [...KEYS.chores, 'archived'],
    queryFn: () => parseRes<ApiChore[]>(Fetcher.GetArchivedChores()),
    enabled: authEnabled(),
  })
}

export function useCalendar(from: string, to: string) {
  return useQuery({
    queryKey: KEYS.calendar(from, to),
    queryFn: () =>
      parseRes<ApiCalendarProjection>(Fetcher.GetCalendar(from, to)),
    enabled: authEnabled() && Boolean(from) && Boolean(to),
  })
}

export function useProjects() {
  return useQuery({
    queryKey: KEYS.projects,
    queryFn: () => parseRes<ApiProject[]>(Fetcher.GetProjects()),
    enabled: authEnabled(),
  })
}

export function useRoutines() {
  return useQuery({
    queryKey: KEYS.routines,
    queryFn: () => parseRes<ApiRoutinePack[]>(Fetcher.GetRoutines()),
    enabled: authEnabled(),
  })
}

export function useShoppingLists() {
  return useQuery({
    queryKey: KEYS.shopping,
    queryFn: () => parseRes<ApiShoppingList[]>(Fetcher.GetShoppingLists()),
    enabled: authEnabled(),
  })
}

export function useGoals() {
  return useQuery({
    queryKey: KEYS.goals,
    // The goals endpoint returns { canManage, goals: [...] } — unwrap the list.
    queryFn: async () => {
      const body = await Fetcher.GetGoals().then(r => r.json())
      return (body?.goals ?? []) as ApiGoal[]
    },
    enabled: authEnabled(),
  })
}

export function useRewards() {
  return useQuery({
    queryKey: KEYS.rewards,
    queryFn: () => parseRes<ApiReward[]>(Fetcher.GetRewards()),
    enabled: authEnabled(),
  })
}

export function useNotifications() {
  return useQuery({
    queryKey: KEYS.notifications,
    queryFn: () => parseRes<ApiNotification[]>(Fetcher.GetNotifications()),
    enabled: authEnabled(),
  })
}

export function useMeters() {
  return useQuery({
    queryKey: KEYS.meters,
    queryFn: () => parseRes<ApiMeter[]>(Fetcher.GetMeters()),
    enabled: authEnabled(),
  })
}

export function useThings() {
  return useQuery({
    queryKey: KEYS.things,
    queryFn: () => parseRes<ApiThing[]>(Fetcher.GetThings()),
    enabled: authEnabled(),
  })
}

export function useMaintenance() {
  return useQuery({
    queryKey: KEYS.maintenance,
    queryFn: () => parseRes<ApiMaintenanceCenter>(Fetcher.GetMaintenance()),
    enabled: authEnabled(),
  })
}

export function useChoreHistory(limit = 14, includeMembers = true) {
  return useQuery({
    queryKey: KEYS.history(limit),
    queryFn: () =>
      parseRes<ApiChoreHistory[]>(
        Fetcher.GetChoresHistory(limit, includeMembers),
      ),
    enabled: authEnabled(),
  })
}

export function useRewardRequests() {
  return useQuery({
    queryKey: KEYS.rewardRequests,
    queryFn: () => parseRes<ApiRewardRequest[]>(Fetcher.GetRewardRequests()),
    enabled: authEnabled(),
    retry: false,
  })
}

/* ── Task mutations (backed by real chore endpoints) ── */

export type TaskMutationInput = {
  id?: number | string
  title?: string
  description?: string
  assigneeId?: number | string | null | undefined
  dueDate?: string | null | undefined
  priority?: number | null | undefined
  points?: number | null | undefined
  projectId?: number | string | null | undefined
  frequencyType?: string
  isPrivate?: boolean
  requireApproval?: boolean
  [key: string]: unknown
}

export function useTaskMutations() {
  const client = useQueryClient()
  const invalidateTasks = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: KEYS.chores }),
      client.invalidateQueries({ queryKey: ['calendar'] }),
      client.invalidateQueries({ queryKey: KEYS.history(0) }),
      client.invalidateQueries({ queryKey: KEYS.points(0) }),
      client.invalidateQueries({ queryKey: KEYS.goals }),
    ])

  const completeTask = useMutation({
    mutationFn: async (id: number | string) => {
      const resp = await Fetcher.MarkChoreComplete(
        String(id),
        {},
        new Date().toISOString(),
        undefined,
      )
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(
          typeof body?.error === 'string'
            ? body.error
            : 'Failed to complete the task',
        )
      }
      return resp
    },
    onSuccess: () => invalidateTasks(),
  })

  const undoTask = useMutation({
    mutationFn: async (id: number | string) => {
      const resp = await Fetcher.UndoChoreAction(String(id))
      if (!resp.ok) throw new Error('Failed to undo task')
      return resp
    },
    onSuccess: () => invalidateTasks(),
  })

  const skipTask = useMutation({
    mutationFn: async (id: number | string) => {
      const resp = await Fetcher.SkipChore(String(id))
      if (!resp.ok) throw new Error('Failed to skip task')
      return resp
    },
    onSuccess: () => invalidateTasks(),
  })

  const createTask = useMutation({
    mutationFn: async (input: TaskMutationInput) => {
      const resp = await Fetcher.CreateChore({
        name: input.title ?? '',
        frequencyType: (input.frequencyType as string) ?? 'once',
        assignStrategy: 'no_assignee',
        description: input.description ?? '',
        assignedTo: input.assigneeId ? Number(input.assigneeId) : null,
        nextDueDate: input.dueDate
          ? new Date(input.dueDate).toISOString()
          : null,
        priority: typeof input.priority === 'number' ? input.priority : 2,
        points: typeof input.points === 'number' ? input.points : null,
        isPrivate: Boolean(input.isPrivate),
        requireApproval: Boolean(input.requireApproval),
        projectId: input.projectId ? Number(input.projectId) : null,
      })
      const body = await resp.json().catch(() => ({}))
      if (!resp.ok)
        throw new Error(
          typeof body?.error === 'string'
            ? body.error
            : 'Failed to create task',
        )
      return body?.res ?? body
    },
    onSuccess: () => invalidateTasks(),
  })

  const updateTask = useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: TaskMutationInput & { id: number | string }) => {
      // Preserve recurring settings from the cached chore while patching
      // the editable fields (name/notes/assignee/due date/priority).
      const cached = client.getQueryData<ApiChore[]>(KEYS.chores)
      const original = cached?.find(c => String(c.id) === String(id))
      const resp = await Fetcher.SaveChore({
        id: Number(id),
        name: patch.title ?? original?.name ?? '',
        frequencyType: original?.frequencyType ?? 'once',
        assignStrategy: original?.assignStrategy ?? 'no_assignee',
        description: patch.description ?? original?.description ?? '',
        assignedTo:
          patch.assigneeId != null
            ? Number(patch.assigneeId)
            : (original?.assignedTo ?? null),
        nextDueDate:
          patch.dueDate != null
            ? new Date(patch.dueDate).toISOString()
            : (original?.nextDueDate ?? null),
        priority:
          typeof patch.priority === 'number'
            ? patch.priority
            : (original?.priority ?? 2),
      })
      const body = await resp.json().catch(() => ({}))
      if (!resp.ok)
        throw new Error(
          typeof body?.error === 'string'
            ? body.error
            : 'Failed to update task',
        )
      return body?.res ?? body
    },
    onSuccess: () => invalidateTasks(),
  })

  const archiveTask = useMutation({
    mutationFn: async (id: number | string) => {
      // ArchiveChore endpoint is `PUT /chores/:id/archive` (parseRes-safe).
      return parseRes(Fetcher.ArchiveChore(String(id)))
    },
    onSuccess: () => invalidateTasks(),
  })

  const assignTask = useMutation({
    mutationFn: async ({
      assigneeId,
      id,
    }: {
      id: number | string
      assigneeId: number | null
    }) => {
      const resp = await Fetcher.UpdateChoreAssignee(String(id), assigneeId)
      if (!resp.ok) throw new Error('Failed to assign task')
      return resp
    },
    onSuccess: () => invalidateTasks(),
  })

  const updatePriority = useMutation({
    mutationFn: async ({
      id,
      priority,
    }: {
      id: number | string
      priority: number
    }) => {
      const resp = await Fetcher.UpdateChorePriority(String(id), priority)
      if (!resp.ok) throw new Error('Failed to update priority')
      return resp
    },
    onSuccess: () => invalidateTasks(),
  })

  const updateDueDate = useMutation({
    mutationFn: async ({
      dueDate,
      id,
    }: {
      id: number | string
      dueDate: string | null
    }) => {
      const resp = await Fetcher.UpdateDueDate(String(id), dueDate)
      if (!resp.ok) throw new Error('Failed to update due date')
      return resp
    },
    onSuccess: () => invalidateTasks(),
  })

  const removeTask = useMutation({
    mutationFn: async (id: number | string) => {
      const resp = await Fetcher.DeleteChore(String(id))
      if (!resp.ok) throw new Error('Failed to delete task')
      return resp
    },
    onSuccess: () => invalidateTasks(),
  })

  return {
    completeTask,
    undoTask,
    skipTask,
    createTask,
    updateTask,
    archiveTask,
    assignTask,
    updatePriority,
    updateDueDate,
    removeTask,
  }
}

export type TaskMutations = ReturnType<typeof useTaskMutations>

/* ── Shopping-list mutations (used by ShoppingScreen) ── */

export function useShoppingMutations() {
  const client = useQueryClient()
  const invalidate = () => client.invalidateQueries({ queryKey: KEYS.shopping })
  const createList = useMutation({
    mutationFn: async (name: string) =>
      parseRes(Fetcher.CreateShoppingList({ name, scope: 'circle' })),
    onSuccess: () => invalidate(),
  })
  const toggleItem = useMutation({
    mutationFn: async ({
      checked,
      itemId,
      listId,
    }: {
      listId: number
      itemId: number
      checked: boolean
    }) =>
      parseRes(
        Fetcher.UpdateShoppingListItem(listId, itemId, { isChecked: checked }),
      ),
    onSuccess: () => invalidate(),
  })
  const addItem = useMutation({
    mutationFn: async ({
      listId,
      name,
      quantity,
    }: {
      listId: number
      name: string
      quantity?: string
    }) =>
      parseRes(
        Fetcher.CreateShoppingListItem(listId, {
          name,
          quantity: quantity ?? '',
        }),
      ),
    onSuccess: () => invalidate(),
  })
  const removeItem = useMutation({
    mutationFn: async ({
      itemId,
      listId,
    }: {
      listId: number
      itemId: number
    }) => parseRes(Fetcher.DeleteShoppingListItem(listId, itemId)),
    onSuccess: () => invalidate(),
  })
  return { createList, toggleItem, addItem, removeItem }
}

/* ── Reward + reward-request mutations (used by RewardsScreen) ── */

export function useRewardMutations() {
  const client = useQueryClient()
  const invalidate = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: KEYS.rewards }),
      client.invalidateQueries({ queryKey: KEYS.rewardRequests }),
      client.invalidateQueries({ queryKey: KEYS.points(0) }),
    ])

  const createReward = useMutation({
    mutationFn: async (reward: {
      name: string
      description?: string
      costPoints: number
    }) => parseRes(Fetcher.CreateReward(reward)),
    onSuccess: () => invalidate(),
  })

  const updateReward = useMutation({
    mutationFn: async ({
      id,
      ...reward
    }: {
      id: number | string
      name: string
      description?: string
      costPoints: number
    }) => parseRes(Fetcher.UpdateReward(Number(id), reward)),
    onSuccess: () => invalidate(),
  })

  const requestReward = useMutation({
    mutationFn: async (rewardId: number | string) =>
      parseRes(Fetcher.CreateRewardRequest(Number(rewardId))),
    onSuccess: () => invalidate(),
  })

  const approveRequest = useMutation({
    mutationFn: async (id: number | string) =>
      parseRes(Fetcher.ApproveRewardRequest(Number(id))),
    onSuccess: () => invalidate(),
  })

  const rejectRequest = useMutation({
    mutationFn: async (id: number | string) =>
      parseRes(Fetcher.RejectRewardRequest(Number(id))),
    onSuccess: () => invalidate(),
  })

  const cancelRequest = useMutation({
    mutationFn: async (id: number | string) =>
      parseRes(Fetcher.CancelRewardRequest(Number(id))),
    onSuccess: () => invalidate(),
  })

  const redeem = useMutation({
    mutationFn: async ({
      points,
      userId,
    }: {
      userId: number
      points: number
    }) => {
      const profile = client.getQueryData<ApiProfile>(KEYS.profile)
      if (!profile) throw new Error('No profile loaded — cannot redeem points')
      return parseRes(Fetcher.RedeemPoints(userId, points, profile.circleID))
    },
    onSuccess: () => invalidate(),
  })

  return {
    createReward,
    updateReward,
    requestReward,
    approveRequest,
    rejectRequest,
    cancelRequest,
    redeem,
  }
}

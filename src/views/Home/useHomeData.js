import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import { hasActiveFamilyCircle } from '../../navigation/navModel'
import {
  useChores,
  useChoresHistory,
  useMarkChoreComplete,
} from '../../queries/ChoreQueries'
import { useGoals, useReport, useStreak } from '../../queries/ProgressQueries'
import { useMyRewardRequests, useRewards } from '../../queries/RewardQueries'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries'
import {
  EFFECTIVE_ROLES,
  normalizeCircleMembers,
  resolveEffectiveRole,
} from '../../utils/PermissionModel'
import { useProjects } from '../Projects/ProjectQueries'
import {
  buildActivityFeed,
  buildHomeLists,
  buildHousehold,
  buildRewards,
  buildUpcoming,
  buildWorkload,
  initialsOf,
  memberColorFor,
  pickFamilyGoal,
  streakFromHistory,
} from './homeModel'

const nameOf = profile => {
  if (!profile) return 'Member'
  return (
    profile.name ||
    profile.displayName ||
    profile.username ||
    'Member'
  ).trim()
}

/**
 * Binds the Figma Home/Today screens to the live DayDan query layer.
 * Resolves the persona (quest = child) exactly like the rest of the app and
 * derives every list/stat through the pure adapters in ./homeModel.
 */
export const useHomeData = () => {
  const queryClient = useQueryClient()
  const profileQuery = useUserProfile()
  const membersQuery = useCircleMembers()
  const choresQuery = useChores(false)
  const historyQuery = useChoresHistory(90, false)
  const reportQuery = useReport('week')
  const streakQuery = useStreak()
  const goalsQuery = useGoals()
  const rewardsQuery = useRewards(false)
  const requestsQuery = useMyRewardRequests()
  const projectsQuery = useProjects()
  const completeMutation = useMarkChoreComplete()

  const profile = profileQuery.data
  const rawMembers = membersQuery.data
  const profileLoading = profileQuery.isLoading && profile === undefined
  const membersLoading = membersQuery.isLoading && rawMembers === undefined
  const choresLoading = choresQuery.isLoading && choresQuery.data === undefined
  const historyLoading =
    historyQuery.isLoading && historyQuery.data === undefined

  const timeZone =
    profile?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    'UTC'

  const now = useMemo(() => new Date(), [])

  const role = resolveEffectiveRole(profile, rawMembers)
  const isChild = role === EFFECTIVE_ROLES.CHILD
  const isSolo = !hasActiveFamilyCircle(profile, rawMembers)

  const members = useMemo(() => {
    const list = normalizeCircleMembers(rawMembers)
    const selfId = profile ? String(profile.id) : null
    return list
      .filter(member => member?.isActive !== false)
      .map((member, index) => ({
        id: String(member.userId ?? member.id ?? index),
        name: member.displayName || member.name || 'Member',
        initials: initialsOf(member.displayName || member.name),
        color: memberColorFor(index),
        isSelf:
          selfId !== null &&
          selfId !== undefined &&
          String(member.userId ?? member.id) === selfId,
      }))
  }, [rawMembers, profile])

  const membersById = useMemo(
    () => Object.fromEntries(members.map(member => [member.id, member])),
    [members],
  )

  const selfId = profile ? String(profile.id) : null
  const currentMember =
    (selfId && membersById[selfId]) ||
    (profile && {
      id: selfId,
      name: nameOf(profile),
      initials: initialsOf(nameOf(profile)),
      color: memberColorFor(0),
      isSelf: true,
    }) ||
    null

  const chores = useMemo(() => choresQuery.data?.res || [], [choresQuery.data])
  const history = useMemo(() => historyQuery.data || [], [historyQuery.data])

  const lists = useMemo(
    () => buildHomeLists({ chores, history, now, timeZone }),
    [chores, history, now, timeZone],
  )

  const upcoming = useMemo(
    () => buildUpcoming(chores, { history, now, timeZone }),
    [chores, history, now, timeZone],
  )

  // Rewards/goals/balance are readonly adjacent data the home surfaces.
  const rewards = useMemo(
    () => buildRewards(rewardsQuery.data?.res),
    [rewardsQuery.data],
  )
  const goals = goalsQuery.data?.goals || []
  const familyGoal = isSolo ? pickFamilyGoal([]) : pickFamilyGoal(goals)
  const hasGoal = familyGoal.id !== null
  const balance =
    requestsQuery.data?.balance || (requestsQuery.data ? {} : null)
  const pendingRequests = (requestsQuery.data?.res || []).filter(
    item => item.status === 'pending',
  )
  const pointsAvailable = Number(reportQuery.data?.points?.available) || 0

  const workload = useMemo(
    () => buildWorkload(chores, history, members, { now, timeZone }),
    [chores, history, members, now, timeZone],
  )

  const household = useMemo(
    () => buildHousehold(members, lists.todayTasks, { myId: selfId }),
    [members, lists.todayTasks, selfId],
  )

  const activityFeed = useMemo(
    () => buildActivityFeed(history, membersById, { limit: 6, now }),
    [history, membersById, now],
  )

  const activeProjects = (projectsQuery.data || []).filter(
    project => project?.status === 'active',
  )

  const streak = streakFromHistory(history, selfId, { now, timeZone })

  const myTasks = lists.todayTasks.filter(task => task.assigneeId === selfId)
  const myDone = myTasks.filter(task => task.status === 'done')
  const myTodo = lists.todo.filter(task => task.assigneeId === selfId)

  const makeTaskDone = task => {
    if (!task?.choreId || task.status === 'done') return
    completeMutation.mutate(
      {
        body: selfId ? { completedBy: Number(selfId) } : null,
        choreId: task.choreId,
        completedDate: null,
        performer: null,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['choresHistory'] })
          queryClient.invalidateQueries({ queryKey: ['userProfile'] })
        },
      },
    )
  }

  const ready =
    !profileLoading && !choresLoading && !historyLoading && !membersLoading

  return {
    view: isChild ? 'quest' : 'focus',
    isChild,
    isSolo,
    hasFamily: !isSolo,
    ready,
    profile,
    currentMember,
    members,
    membersById,
    chores,
    timeZone,
    now,
    todayKey: lists.todayKey,
    tasks: lists.todayTasks,
    todayTasks: lists.todayTasks,
    overdue: lists.overdue,
    todo: lists.todo,
    done: lists.done,
    myTasks,
    myDone,
    myTodo,
    upcoming,
    upcomingCount: upcoming.length,
    workload,
    household,
    streak,
    bestStreak: Number(streakQuery.data?.best) || 0,
    familyGoal,
    hasGoal,
    rewards,
    balance,
    pendingRequests,
    pointsAvailable,
    activityFeed,
    activeProjects,
    goals,
    makeTaskDone,
    completing: Boolean(completeMutation.isPending),
    loading: !ready,
    error: choresQuery.error || profileQuery.error || historyQuery.error,
    refetch: async () => {
      await Promise.all([
        choresQuery.refetch(),
        historyQuery.refetch(),
        profileQuery.refetch(),
      ])
    },
  }
}

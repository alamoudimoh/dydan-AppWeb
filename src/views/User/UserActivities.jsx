import {
  CalendarMonth,
  Check,
  Checklist,
  EventBusy,
  EventNote,
  HourglassEmpty,
  Person,
  Redo,
  RunningWithErrors,
  Schedule,
  Style,
  ThumbDown,
  Toll,
} from '@mui/icons-material'
import { Box, Container } from '@mui/joy'
import { useEffect, useMemo, useState } from 'react'

import FilterBar from '../../components/common/FilterBar'
import QueryLoadingView from '../../components/common/QueryLoadingView'
import { useFilter } from '../../hooks/useFilter'
import {
  useChores,
  useChoresHistory,
  useDeleteChoreHistory,
  useUpdateChoreHistory,
} from '../../queries/ChoreQueries'
import { useCircleMembers, useUserProfile } from '../../queries/UserQueries.jsx'
import { listPageContainerSx } from '../../theme/appLayout'
import { ChoresGrouper } from '../../utils/Chores'
import { COLORS, TASK_COLOR } from '../../utils/Colors'
import { useLabels } from '../Labels/LabelQueries'
import EditHistoryModal from '../Modals/EditHistoryModal'
import HistoryDetailModal from '../Modals/HistoryDetailModal'
import NoteViewerModal from '../Modals/Inputs/NoteViewerModal'
import { activityEvents } from './activityViewModel'
import FigmaActivityScreen from './FigmaActivityScreen'

const USER_FILTER = (history, userId) => {
  if (userId === undefined || userId === 'all') return true
  return history.completedBy === userId
}

const UserActivites = () => {
  const { data: userProfile } = useUserProfile()

  const [tabValue, setTabValue] = React.useState(7)
  const [selectedHistory, setSelectedHistory] = React.useState([])
  const [enrichedHistory, setEnrichedHistory] = React.useState([])
  const [selectedChart, setSelectedChart] = React.useState('history')
  const [noteViewerConfig, setNoteViewerConfig] = useState({ isOpen: false })
  const [detailModalConfig, setDetailModalConfig] = useState({ isOpen: false })
  const [editModalConfig, setEditModalConfig] = useState({ isOpen: false })
  const [editHistoryRecord, setEditHistoryRecord] = useState(null)
  const updateChoreHistory = useUpdateChoreHistory()
  const deleteChoreHistory = useDeleteChoreHistory()

  const [historyPieChartData, setHistoryPieChartData] = React.useState([])
  const [choreDuePieChartData, setChoreDuePieChartData] = React.useState([])
  const [choresPriorityChartData, setChoresPriorityChartData] = React.useState(
    [],
  )
  const [choresLabelsChartData, setChoresLabelsChartData] = React.useState([])
  const [choresLabelsDurationChartData, setChoresLabelsDurationChartData] =
    React.useState([])
  const [tasksTimeChartData, setTasksTimeChartData] = React.useState([])
  const [
    choresAssigneeBreakdownChartData,
    setChoresAssigneeBreakdownChartData,
  ] = React.useState([])
  const { data: userLabels } = useLabels()
  const { data: choresData, isLoading: isChoresLoading } = useChores(true)
  const {
    data: choresHistory,
    handleLimitChange: refetchHistory,
    isLoading: isChoresHistoryLoading,
  } = useChoresHistory(tabValue ? tabValue : 30, true)
  const { data: circleMembersData } = useCircleMembers()
  const [selectedUser, setSelectedUser] = React.useState('all')
  const [circleUsers, setCircleUsers] = useState([])

  useEffect(() => {
    if (circleMembersData) {
      setCircleUsers(circleMembersData.res)
    }
  }, [circleMembersData])

  // Client-side filters applied on top of the user+time-window slice
  const clientFilterDefs = useMemo(
    () => [
      {
        id: 'status',
        label: 'Status',
        type: 'multi-select',
        icon: <Checklist />,
        options: [
          {
            value: 1,
            label: 'Completed',
            color: 'success',
            icon: <Check sx={{ fontSize: 14 }} />,
          },
          {
            value: 2,
            label: 'Skipped',
            color: 'warning',
            icon: <Redo sx={{ fontSize: 14 }} />,
          },
          {
            value: 3,
            label: 'Pending',
            color: 'neutral',
            icon: <HourglassEmpty sx={{ fontSize: 14 }} />,
          },
          {
            value: 4,
            label: 'Rejected',
            color: 'danger',
            icon: <ThumbDown sx={{ fontSize: 14 }} />,
          },
          {
            value: 5,
            label: 'Missed',
            color: 'danger',
            icon: <RunningWithErrors sx={{ fontSize: 14 }} />,
          },
          {
            value: 6,
            label: 'Rescheduled',
            color: 'warning',
            icon: <Schedule sx={{ fontSize: 14 }} />,
          },
        ],
        filterFn: (item, values) => values.includes(item.status),
      },
      ...(userLabels?.length > 0
        ? [
            {
              id: 'label',
              label: 'Labels',
              type: 'multi-select',
              icon: <Style />,
              options: userLabels.map(l => ({
                value: l.id,
                label: l.name,
                icon: (
                  <Box
                    component='span'
                    sx={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: l.color || '#90a4ae',
                      flexShrink: 0,
                    }}
                  />
                ),
              })),
              filterFn: (item, values) =>
                item.labelsV2?.some(l => values.includes(l.id)) ?? false,
            },
          ]
        : []),
      {
        id: 'hasNotes',
        label: 'Has Notes',
        type: 'boolean',
        icon: <EventNote />,
        filterFn: item => !!item.notes,
      },
      {
        id: 'hasPoints',
        label: 'Has Points',
        type: 'boolean',
        icon: <Toll />,
        filterFn: item => (item.points ?? 0) > 0,
      },
    ],
    [userLabels],
  )

  const {
    activeFilters: clientActiveFilters,
    clearAll: clearClientFilters,
    filteredData: filteredTimeline,
    setFilter: setClientFilter,
  } = useFilter(selectedHistory, clientFilterDefs)

  // All filter defs merged for FilterBar display
  const filterDefs = useMemo(
    () => [
      {
        id: 'timePeriod',
        label: 'Time Period',
        type: 'single-select',
        icon: <CalendarMonth />,
        defaultValue: 7,
        options: [
          { value: 7, label: '7 Days' },
          { value: 30, label: '30 Days' },
          { value: 90, label: '90 Days' },
          { value: 365, label: 'All Time' },
        ],
      },
      {
        id: 'completedBy',
        label: 'User',
        type: 'single-select',
        icon: <Person />,
        options: circleUsers.map(u => ({
          value: u.userId,
          label: u.displayName,
          avatar: u.image,
        })),
      },
      ...clientFilterDefs,
    ],
    [circleUsers, clientFilterDefs],
  )

  // Merge server-driven and client-driven active filter states for the bar
  const activeFilters = useMemo(
    () => ({
      timePeriod: tabValue,
      ...(selectedUser !== 'all' ? { completedBy: selectedUser } : {}),
      ...clientActiveFilters,
    }),
    [tabValue, selectedUser, clientActiveFilters],
  )

  const handleSetFilter = (id, value) => {
    if (id === 'completedBy') {
      const userId = value ?? 'all'
      setSelectedUser(userId)
      setSelectedHistory(enrichedHistory.filter(h => USER_FILTER(h, userId)))
    } else if (id === 'timePeriod') {
      const days = value ?? 7
      setTabValue(days)
      refetchHistory(days)
    } else {
      setClientFilter(id, value)
    }
  }

  const handleClearAll = () => {
    setSelectedUser('all')
    setSelectedHistory(enrichedHistory)
    setTabValue(7)
    refetchHistory(7)
    clearClientFilters()
  }

  useEffect(() => {
    if (
      !isChoresHistoryLoading &&
      !isChoresLoading &&
      choresHistory &&
      choresData?.res
    ) {
      const enrichedHistory = choresHistory.map(item => {
        const chore = choresData.res.find(chore => chore.id === item.choreId)
        return {
          ...item,
          choreName: chore?.name,
          labelsV2: chore?.labelsV2,
        }
      })
      setEnrichedHistory(enrichedHistory)

      const filteredHistory = enrichedHistory.filter(h =>
        USER_FILTER(h, selectedUser),
      )
      setSelectedHistory(filteredHistory)
      setHistoryPieChartData(generateHistoryPieChartData(filteredHistory))

      // Generate labels duration chart data when both chores and history are available
      setChoresLabelsDurationChartData(
        generateChoreLabelsWithDurationChartData(
          choresData.res,
          filteredHistory,
        ),
      )

      // Generate tasks time chart data
      setTasksTimeChartData(generateTasksTimeChartData(filteredHistory))
    } else {
      // Reset data when loading or no data
      setEnrichedHistory([])
      setSelectedHistory([])
      setHistoryPieChartData([])
      setChoresLabelsDurationChartData([])
      setTasksTimeChartData([])
    }
  }, [
    isChoresHistoryLoading,
    isChoresLoading,
    choresHistory,
    choresData?.res,
    selectedUser,
  ])

  useEffect(() => {
    if (!isChoresLoading && choresData) {
      // Filter chores based on selected user
      const filteredChores =
        selectedUser === 'all' || selectedUser === undefined
          ? choresData.res
          : choresData.res.filter(chore => chore.assignedTo === selectedUser)

      const generateChorePriorityPieChartData = chores => {
        const groups = ChoresGrouper('priority', chores, null)
        return groups
          .map(group => {
            return {
              label: group.name,
              value: group.content.length,
              color: group.color,
              id: group.name,
            }
          })
          .filter(item => item.value > 0)
      }

      const generateChoreLabelsChartData = chores => {
        const labelCounts = {}
        let unlabeledCount = 0

        chores.forEach(chore => {
          if (chore.labelsV2 && chore.labelsV2.length > 0) {
            chore.labelsV2.forEach(label => {
              if (labelCounts[label.id]) {
                labelCounts[label.id].count++
              } else {
                labelCounts[label.id] = {
                  label: label.name,
                  count: 1,
                  color: label.color || TASK_COLOR.ANYTIME,
                  id: label.id,
                }
              }
            })
          } else {
            unlabeledCount++
          }
        })

        const result = Object.values(labelCounts)
          .map(item => ({
            label: item.label,
            value: item.count,
            color: item.color,
            id: item.id,
          }))
          .filter(item => item.value > 0)
          .sort((a, b) => b.value - a.value) // Sort by count descending

        // Add unlabeled tasks if there are any
        if (unlabeledCount > 0) {
          result.push({
            label: 'No Labels',
            value: unlabeledCount,
            color: TASK_COLOR.ANYTIME,
            id: 'unlabeled',
          })
        }

        return result
      }

      const generateChoreAssigneeBreakdownChartData = chores => {
        const assigneeCounts = {}

        // Define a set of distinct colors for different assignees

        const assigneeColors = Object.values(COLORS)

        let colorIndex = 0

        chores.forEach(chore => {
          const assignee = circleUsers.find(
            user => user.userId === chore.assignedTo,
          )
          const assigneeName = assignee ? assignee.displayName : 'Unassigned'
          const assigneeId = chore.assignedTo || 'unassigned'

          if (assigneeCounts[assigneeId]) {
            assigneeCounts[assigneeId].count++
          } else {
            assigneeCounts[assigneeId] = {
              label: assigneeName,
              count: 1,
              color:
                assigneeId === 'unassigned'
                  ? TASK_COLOR.ANYTIME
                  : assigneeColors[colorIndex % assigneeColors.length],
              id: assigneeId,
            }
            if (assigneeId !== 'unassigned') {
              colorIndex++
            }
          }
        })

        return Object.values(assigneeCounts)
          .map(item => ({
            label: item.label,
            value: item.count,
            color: item.color,
            id: item.id,
          }))
          .filter(item => item.value > 0)
          .sort((a, b) => b.value - a.value) // Sort by count descending
      }

      const choreDuePieChartData = generateChoreDuePieChartData(filteredChores)
      setChoreDuePieChartData(choreDuePieChartData)
      setChoresPriorityChartData(
        generateChorePriorityPieChartData(filteredChores),
      )
      setChoresLabelsChartData(generateChoreLabelsChartData(filteredChores))
      setChoresAssigneeBreakdownChartData(
        generateChoreAssigneeBreakdownChartData(filteredChores),
      )
    }
  }, [isChoresLoading, choresData, userProfile?.id, circleUsers, selectedUser])

  const generateChoreLabelsWithDurationChartData = (chores, history) => {
    if (!chores || !history || chores.length === 0 || history.length === 0) {
      return []
    }

    const labelDurations = {}
    let unlabeledDuration = 0

    // Iterate through ChoreHistory to get actual time spent
    history.forEach(historyItem => {
      const duration = historyItem.duration || 0 // duration in seconds from ChoreHistory

      // Find the corresponding chore to get its labels
      const chore = chores.find(c => c.id === historyItem.choreId)

      if (chore && chore.labelsV2 && chore.labelsV2.length > 0) {
        // If chore has labels, add duration to each label
        chore.labelsV2.forEach(label => {
          if (labelDurations[label.id]) {
            labelDurations[label.id].duration += duration
          } else {
            labelDurations[label.id] = {
              label: label.name,
              duration: duration,
              color: label.color || TASK_COLOR.ANYTIME,
              id: label.id,
            }
          }
        })
      } else {
        // If chore has no labels or chore not found, add to unlabeled
        unlabeledDuration += duration
      }
    })

    // Convert seconds to hours for better readability
    const result = Object.values(labelDurations)
      .map(item => ({
        label: item.label,
        value: Math.round((item.duration / 3600) * 10) / 10, // Convert to hours and round to 1 decimal
        color: item.color,
        id: item.id,
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value) // Sort by duration descending

    // Add unlabeled tasks duration if there is any
    if (unlabeledDuration > 0) {
      result.push({
        label: 'No Labels',
        value: Math.round((unlabeledDuration / 3600) * 10) / 10, // Convert to hours and round to 1 decimal
        color: TASK_COLOR.ANYTIME,
        id: 'unlabeled',
      })
    }

    return result
  }

  const generateTasksTimeChartData = history => {
    if (!history || history.length === 0) {
      return []
    }

    const taskDurations = {}
    const colorValues = Object.values(COLORS)

    // Iterate through ChoreHistory to get actual time spent per task
    history.forEach(historyItem => {
      const duration = historyItem.duration || 0 // duration in seconds from ChoreHistory
      const taskName = historyItem.choreName || 'Unknown Task'

      if (taskDurations[taskName]) {
        taskDurations[taskName].duration += duration
        taskDurations[taskName].count += 1
      } else {
        taskDurations[taskName] = {
          taskName: taskName,
          duration: duration,
          count: 1,
        }
      }
    })

    // Convert seconds to hours and prepare chart data
    const result = Object.values(taskDurations)
      .map((item, index) => ({
        label: item.taskName,
        value: Math.round((item.duration / 3600) * 10) / 10, // Convert to hours and round to 1 decimal
        count: item.count,
        color: colorValues[index % colorValues.length],
        id: item.taskName,
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value) // Sort by time spent descending
      .slice(0, 10) // Show top 10 tasks only

    return result
  }

  const generateChoreDuePieChartData = chores => {
    if (!chores || chores.length === 0) {
      return []
    }

    const groups = ChoresGrouper('due_date', chores, null)
    return groups
      .map(group => {
        return {
          label: group.name,
          value: group.content.length,
          color: group.color,
          id: group.name,
        }
      })
      .filter(item => item.value > 0)
  }

  const generateHistoryPieChartData = history => {
    if (!history || history.length === 0) {
      return []
    }

    const totalCompleted =
      history.filter(item => item.dueDate > item.performedAt).length || 0
    const totalLate =
      history.filter(item => item.dueDate < item.performedAt).length || 0
    const totalNoDueDate = history.filter(item => !item.dueDate).length || 0

    const result = []

    if (totalCompleted > 0) {
      result.push({
        label: `On time`,
        value: totalCompleted,
        color: TASK_COLOR.COMPLETED,
        id: 1,
      })
    }

    if (totalLate > 0) {
      result.push({
        label: `Late`,
        value: totalLate,
        color: TASK_COLOR.LATE,
        id: 2,
      })
    }

    if (totalNoDueDate > 0) {
      result.push({
        label: `Completed`,
        value: totalNoDueDate,
        color: TASK_COLOR.ANYTIME,
        id: 3,
      })
    }

    return result
  }

  const figmaEvents = useMemo(
    () => activityEvents(filteredTimeline, circleUsers),
    [filteredTimeline, circleUsers],
  )

  const openHistoryDetails = record => {
    setDetailModalConfig({
      isOpen: true,
      entry: record,
      performers: circleUsers,
      onClose: () => setDetailModalConfig({ isOpen: false }),
      onEdit: editableRecord => {
        setDetailModalConfig(previous => ({ ...previous, isOpen: false }))
        setEditHistoryRecord(editableRecord)
        setEditModalConfig({
          isOpen: true,
          onClose: () => {
            setEditModalConfig({ isOpen: false })
            setEditHistoryRecord(null)
          },
          onSave: updated => {
            updateChoreHistory.mutate(
              {
                choreId: editableRecord.choreId,
                historyId: editableRecord.id,
                historyData: {
                  performedAt: updated.performedAt,
                  dueDate: updated.dueDate,
                  notes: updated.notes,
                },
              },
              {
                onSuccess: () => {
                  setEditModalConfig({ isOpen: false })
                  setEditHistoryRecord(null)
                },
              },
            )
          },
          onDelete: () => {
            deleteChoreHistory.mutate(
              { choreId: editableRecord.choreId, historyId: editableRecord.id },
              {
                onSuccess: () => {
                  setEditModalConfig({ isOpen: false })
                  setEditHistoryRecord(null)
                },
              },
            )
          },
        })
      },
    })
  }

  if (isChoresHistoryLoading || isChoresLoading) {
    return <QueryLoadingView />
  }
  return (
    <Container maxWidth='lg' sx={listPageContainerSx}>
      <FigmaActivityScreen
        events={figmaEvents}
        isSolo={circleUsers.length < 2}
        onOpenEvent={openHistoryDetails}
      />
      <NoteViewerModal config={noteViewerConfig} />
      <HistoryDetailModal config={detailModalConfig} />
      <EditHistoryModal
        config={editModalConfig}
        historyRecord={editHistoryRecord}
      />
    </Container>
  )
}

export default UserActivites
